import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

/**
 * PerformanceTracker component for visualizing training progress
 */
const PerformanceTracker = ({ userProfile, workouts }) => {
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState('month');
  const [metricType, setMetricType] = useState('power');
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  
  // Filter workouts based on selected timeframe
  useEffect(() => {
    if (!workouts || workouts.length === 0) {
      setFilteredWorkouts([]);
      return;
    }
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeframe) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoffDate.setMonth(now.getMonth() - 1); // Default to month
    }
    
    const filtered = workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= cutoffDate;
    });
    
    // Sort by date
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    setFilteredWorkouts(filtered);
  }, [workouts, timeframe]);
  
  /**
   * Calculate stats for the filtered workouts
   */
  const calculateStats = () => {
    if (filteredWorkouts.length === 0) {
      return {
        totalWorkouts: 0,
        totalDuration: 0,
        avgPower: 0,
        maxPower: 0,
        totalTSS: 0,
        workoutTypes: []
      };
    }
    
    const totalWorkouts = filteredWorkouts.length;
    const totalDuration = filteredWorkouts.reduce((sum, w) => sum + w.duration, 0);
    
    // Calculate power metrics
    const powerWorkouts = filteredWorkouts.filter(w => w.metrics?.averagePower);
    const avgPower = powerWorkouts.length 
      ? Math.round(powerWorkouts.reduce((sum, w) => sum + w.metrics.averagePower, 0) / powerWorkouts.length)
      : 0;
    
    const maxPower = powerWorkouts.length
      ? Math.max(...powerWorkouts.map(w => w.metrics.normalizedPower || w.metrics.averagePower))
      : 0;
    
    // Calculate TSS
    const totalTSS = filteredWorkouts.reduce((sum, w) => sum + (w.tss || 0), 0);
    
    // Calculate workout type distribution
    const typeCount = {};
    filteredWorkouts.forEach(w => {
      typeCount[w.type] = (typeCount[w.type] || 0) + 1;
    });
    
    const workoutTypes = Object.entries(typeCount).map(([name, value]) => ({ name, value }));
    
    return {
      totalWorkouts,
      totalDuration,
      avgPower,
      maxPower,
      totalTSS,
      workoutTypes
    };
  };
  
  const stats = calculateStats();
  
  /**
   * Prepare data for the time series chart
   */
  const prepareTimeSeriesData = () => {
    if (filteredWorkouts.length === 0) return [];
    
    // Map workouts to chart data based on selected metric
    return filteredWorkouts.map(workout => {
      let metricValue = 0;
      
      switch (metricType) {
        case 'power':
          metricValue = workout.metrics?.normalizedPower || workout.metrics?.averagePower || 0;
          break;
        case 'tss':
          metricValue = workout.tss || 0;
          break;
        case 'duration':
          metricValue = workout.duration || 0;
          break;
        case 'heartrate':
          metricValue = workout.metrics?.averageHr || 0;
          break;
        default:
          metricValue = workout.metrics?.averagePower || 0;
      }
      
      // Format date for display
      const date = new Date(workout.date);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
      
      return {
        date: formattedDate,
        value: metricValue,
        type: workout.type
      };
    });
  };
  
  /**
   * Prepare data for the workout type distribution chart
   */
  const prepareWorkoutTypeData = () => {
    if (filteredWorkouts.length === 0) return [];
    
    const typeCount = {};
    filteredWorkouts.forEach(w => {
      typeCount[w.type] = (typeCount[w.type] || 0) + 1;
    });
    
    return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
  };
  
  /**
   * Prepare data for the TSS distribution chart
   */
  const prepareTssDistributionData = () => {
    if (filteredWorkouts.length === 0) return [];
    
    // Group TSS by week
    const tssByWeek = {};
    
    filteredWorkouts.forEach(workout => {
      const date = new Date(workout.date);
      const weekNum = getWeekNumber(date);
      const weekKey = `W${weekNum}`;
      
      if (!tssByWeek[weekKey]) {
        tssByWeek[weekKey] = 0;
      }
      
      tssByWeek[weekKey] += workout.tss || 0;
    });
    
    // Convert to array for chart
    return Object.entries(tssByWeek).map(([name, value]) => ({ name, value }));
  };
  
  /**
   * Get ISO week number for a date
   */
  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  };
  
  /**
   * Prepare data for performance profile radar chart
   */
  const preparePerformanceProfileData = () => {
    if (!userProfile || filteredWorkouts.length === 0) return [];
    
    // Calculate metrics for different performance aspects
    const enduranceWorkouts = filteredWorkouts.filter(w => 
      w.type === 'endurance' || w.duration >= 90
    );
    
    const endurance = enduranceWorkouts.length 
      ? Math.min(100, (enduranceWorkouts.reduce((sum, w) => sum + w.duration, 0) / 10))
      : 20;
    
    const hiitWorkouts = filteredWorkouts.filter(w => w.type === 'hiit');
    const intensity = hiitWorkouts.length
      ? Math.min(100, (hiitWorkouts.reduce((sum, w) => sum + (w.tss || 50), 0) / 5))
      : 20;
    
    const consistency = Math.min(100, (filteredWorkouts.length * 10));
    
    const powerWorkouts = filteredWorkouts.filter(w => w.metrics?.normalizedPower);
    const power = powerWorkouts.length && userProfile.ftp
      ? Math.min(100, ((Math.max(...powerWorkouts.map(w => w.metrics.normalizedPower)) / userProfile.ftp) * 80))
      : 20;
    
    const recovery = 100 - Math.min(100, (stats.totalTSS / 10));
    
    return [
      { subject: t('endurance'), A: endurance, fullMark: 100 },
      { subject: t('intensity'), A: intensity, fullMark: 100 },
      { subject: t('consistency'), A: consistency, fullMark: 100 },
      { subject: t('power'), A: power, fullMark: 100 },
      { subject: t('recovery'), A: recovery, fullMark: 100 }
    ];
  };
  
  // Chart data
  const timeSeriesData = prepareTimeSeriesData();
  const workoutTypeData = prepareWorkoutTypeData();
  const tssDistributionData = prepareTssDistributionData();
  const performanceProfileData = preparePerformanceProfileData();
  
  // Type colors for charts
  const typeColors = {
    hiit: '#f44336',
    endurance: '#4caf50',
    strength: '#2196f3',
    recovery: '#ff9800',
    default: '#9c27b0'
  };
  
  // Get color based on workout type
  const getWorkoutTypeColor = (type) => {
    return typeColors[type] || typeColors.default;
  };
  
  // No workouts message
  if (filteredWorkouts.length === 0) {
    return (
      <div className="performance-tracker">
        <div className="tracker-controls">
          <div className="timeframe-selector">
            <label>{t('timeframe')}:</label>
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
              <option value="week">{t('lastWeek')}</option>
              <option value="month">{t('lastMonth')}</option>
              <option value="quarter">{t('lastQuarter')}</option>
              <option value="year">{t('lastYear')}</option>
            </select>
          </div>
        </div>
        
        <div className="no-workouts-message">
          {t('noWorkoutsInTimeframe')}
        </div>
      </div>
    );
  }
  
  return (
    <div className="performance-tracker">
      <div className="tracker-controls">
        <div className="timeframe-selector">
          <label>{t('timeframe')}:</label>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="week">{t('lastWeek')}</option>
            <option value="month">{t('lastMonth')}</option>
            <option value="quarter">{t('lastQuarter')}</option>
            <option value="year">{t('lastYear')}</option>
          </select>
        </div>
        
        <div className="metric-selector">
          <label>{t('metric')}:</label>
          <select value={metricType} onChange={(e) => setMetricType(e.target.value)}>
            <option value="power">{t('power')}</option>
            <option value="tss">{t('tss')}</option>
            <option value="duration">{t('duration')}</option>
            <option value="heartrate">{t('heartRate')}</option>
          </select>
        </div>
      </div>
      
      <div className="performance-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.totalWorkouts}</div>
          <div className="stat-label">{t('workouts')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalDuration}</div>
          <div className="stat-label">{t('minutes')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgPower}W</div>
          <div className="stat-label">{t('avgPower')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalTSS}</div>
          <div className="stat-label">{t('totalTSS')}</div>
        </div>
      </div>
      
      <div className="charts-grid">
        <div className="chart-container">
          <h3>{`${t(metricType)} ${t('overTime')}`}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} ${metricType === 'duration' ? t('min') : metricType === 'tss' ? '' : 'W'}`, t(metricType)]} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <h3>{t('workoutTypes')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={workoutTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${t(name)} ${(percent * 100).toFixed(0)}%`}
              >
                {workoutTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getWorkoutTypeColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, t(name)]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <h3>{t('weeklyTrainingLoad')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tssDistributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [value, t('tss')]} />
              <Bar dataKey="value" fill="#ff7043" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <h3>{t('performanceProfile')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceProfileData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name={t('currentPerformance')}
                dataKey="A"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip formatter={(value) => [value, t('score')]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="workout-history">
        <h3>{t('recentWorkouts')}</h3>
        <table className="workout-table">
          <thead>
            <tr>
              <th>{t('date')}</th>
              <th>{t('type')}</th>
              <th>{t('duration')}</th>
              <th>{t('power')}</th>
              <th>{t('tss')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkouts.slice(-5).reverse().map((workout, index) => (
              <tr key={index}>
                <td>{workout.date}</td>
                <td>{t(workout.type)}</td>
                <td>{workout.duration} {t('min')}</td>
                <td>{workout.metrics?.averagePower || '-'} W</td>
                <td>{workout.tss || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

PerformanceTracker.propTypes = {
  userProfile: PropTypes.object,
  workouts: PropTypes.array
};

export default PerformanceTracker;

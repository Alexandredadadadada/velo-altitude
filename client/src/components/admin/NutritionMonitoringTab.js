import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  RestaurantMenu,
  Error,
  Warning,
  Favorite,
  Info
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Composant d'onglet dédié au monitoring nutritionnel
 * Affiche les métriques relatives au service de nutrition et ses performances
 */
const NutritionMonitoringTab = ({ nutritionMetrics, formatMetricValue }) => {
  if (!nutritionMetrics) {
    return (
      <Typography variant="body2" color="text.secondary">
        Aucune donnée nutritionnelle disponible
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Carte de résumé des performances nutritionnelles */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              <RestaurantMenu sx={{ verticalAlign: 'middle', mr: 1 }} />
              État du service de nutrition
            </Typography>
            <Chip 
              label={nutritionMetrics.status} 
              color={
                nutritionMetrics.status === 'critical' 
                  ? 'error' 
                  : nutritionMetrics.status === 'warning' 
                    ? 'warning' 
                    : 'success'
              }
              icon={
                nutritionMetrics.status === 'critical' 
                  ? <Error /> 
                  : nutritionMetrics.status === 'warning' 
                    ? <Warning /> 
                    : <Favorite />
              }
            />
          </Box>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ bgcolor: 'background.default' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="subtitle2">
                    Temps moyen de calcul
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {formatMetricValue(nutritionMetrics.metrics.avgCalculationTime)} ms
                  </Typography>
                  <Typography variant="body2" color={
                    nutritionMetrics.metrics.avgCalculationTime > nutritionMetrics.thresholds.calculationTime.warning
                      ? 'error.main'
                      : 'success.main'
                  }>
                    Seuil: {nutritionMetrics.thresholds.calculationTime.warning} ms
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ bgcolor: 'background.default' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="subtitle2">
                    Génération de plans
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {formatMetricValue(nutritionMetrics.metrics.avgPlanGenerationTime)} ms
                  </Typography>
                  <Typography variant="body2" color={
                    nutritionMetrics.metrics.avgPlanGenerationTime > nutritionMetrics.thresholds.planGenerationTime.warning
                      ? 'error.main'
                      : 'success.main'
                  }>
                    Seuil: {nutritionMetrics.thresholds.planGenerationTime.warning} ms
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ bgcolor: 'background.default' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="subtitle2">
                    Taux d'erreur API
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {(nutritionMetrics.metrics.errorRate * 100).toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color={
                    nutritionMetrics.metrics.errorRate > nutritionMetrics.thresholds.apiErrorRate.warning
                      ? 'error.main'
                      : 'success.main'
                  }>
                    Seuil: {(nutritionMetrics.thresholds.apiErrorRate.warning * 100).toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ bgcolor: 'background.default' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="subtitle2">
                    Taux cache hits
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {(nutritionMetrics.metrics.cacheHitRate * 100).toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color={
                    nutritionMetrics.metrics.cacheHitRate < nutritionMetrics.thresholds.cacheHitRate.warning
                      ? 'error.main'
                      : 'success.main'
                  }>
                    Seuil: {(nutritionMetrics.thresholds.cacheHitRate.warning * 100).toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Graphique des temps de calcul */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Temps de calcul nutritionnel (ms)
          </Typography>
          
          {nutritionMetrics.calculationTimes ? (
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={nutritionMetrics.calculationTimes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="basic" 
                    name="Calcul de base" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cyclist" 
                    name="Calcul cycliste" 
                    stroke="#82ca9d" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="plan" 
                    name="Génération de plan" 
                    stroke="#ff7300" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Données temporelles non disponibles
            </Typography>
          )}
        </Paper>
      </Grid>

      {/* Graphique d'utilisation des fonctionnalités */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Utilisation des fonctionnalités
          </Typography>
          
          {nutritionMetrics.metrics.topFeatures && nutritionMetrics.metrics.topFeatures.length > 0 ? (
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nutritionMetrics.metrics.topFeatures}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="count" name="Nombre d'utilisations" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Aucune donnée d'utilisation disponible
            </Typography>
          )}
        </Paper>
      </Grid>

      {/* Alertes récentes */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Alertes récentes du service nutritionnel
          </Typography>
          
          {nutritionMetrics.recentAlerts && nutritionMetrics.recentAlerts.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Niveau</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Détails</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nutritionMetrics.recentAlerts.map((alert, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small"
                          label={alert.level} 
                          color={
                            alert.level === 'critical' 
                              ? 'error' 
                              : alert.level === 'warning' 
                                ? 'warning' 
                                : 'info'
                          }
                        />
                      </TableCell>
                      <TableCell>{alert.message}</TableCell>
                      <TableCell>
                        <Tooltip title="Voir détails">
                          <IconButton size="small" onClick={() => alert.metadata && console.log(alert.metadata)}>
                            <Info fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Aucune alerte récente
            </Typography>
          )}
        </Paper>
      </Grid>

      {/* Statistiques d'utilisation du composant NutritionCalculator */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Performances du Calculateur Nutritionnel
          </Typography>
          
          {nutritionMetrics.clientPerformance ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ bgcolor: 'background.default' }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="subtitle2">
                      Temps de rendu moyen
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1 }}>
                      {formatMetricValue(nutritionMetrics.clientPerformance.avgRenderTime)} ms
                    </Typography>
                    <Typography variant="body2">
                      {nutritionMetrics.clientPerformance.totalRenders} rendus
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ bgcolor: 'background.default' }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="subtitle2">
                      Sessions utilisateur
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1 }}>
                      {nutritionMetrics.clientPerformance.uniqueSessions}
                    </Typography>
                    <Typography variant="body2">
                      Durée moyenne: {formatMetricValue(nutritionMetrics.clientPerformance.avgSessionDuration / 1000)} s
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ bgcolor: 'background.default' }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="subtitle2">
                      Taux de conversion
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1 }}>
                      {(nutritionMetrics.clientPerformance.conversionRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">
                      Formulaires complétés / visites
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {nutritionMetrics.clientPerformance.formComplexityDistribution && (
                <Grid item xs={12}>
                  <Box sx={{ mt: 2, height: 250 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Distribution de la complexité des formulaires
                    </Typography>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Simple', value: nutritionMetrics.clientPerformance.formComplexityDistribution.simple || 0 },
                        { name: 'Intermédiaire', value: nutritionMetrics.clientPerformance.formComplexityDistribution.advanced || 0 },
                        { name: 'Complet', value: nutritionMetrics.clientPerformance.formComplexityDistribution.complete || 0 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="#82ca9d" name="Nombre d'utilisations" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
              )}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Aucune donnée de performance client disponible
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default NutritionMonitoringTab;

import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * GPXExport component - allows exporting a col as a GPX file using a Web Worker
 * @param {Object} col - The col data object (must include name, description, waypoints, track)
 */
function GPXExport({ col }) {
  const [status, setStatus] = useState('idle'); // idle, generating, complete, error
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [gpxData, setGpxData] = useState(null);
  const workerRef = useRef(null);

  const generateGPX = useCallback(() => {
    setStatus('generating');
    setProgress(0);
    setMessage('Preparing GPX export...');

    // Create worker
    workerRef.current = new window.Worker('/src/workers/gpx-worker.js');

    // Set up message handler
    workerRef.current.onmessage = (e) => {
      const { type, progress, message, gpx, error } = e.data;
      if (type === 'progress') {
        setProgress(progress);
        setMessage(message);
      } else if (type === 'complete') {
        setStatus('complete');
        setProgress(1);
        setMessage('GPX export complete');
        setGpxData(gpx);
      } else if (type === 'error') {
        setStatus('error');
        setMessage(`Error: ${error}`);
      }
    };

    // Start processing
    workerRef.current.postMessage({
      colData: col,
      options: {
        includeElevation: true,
        includePOIs: true,
        includeWeather: true
      }
    });
  }, [col]);

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Download function
  const downloadGPX = () => {
    if (!gpxData) return;
    const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${col.name.replace(/\s+/g, '-').toLowerCase()}.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- GPX FORMAT ENHANCEMENT ---
  function processTrack(colData) {
    let track = '  <trk>\n';
    track += `    <name>${colData.name}</name>\n`;
    track += `    <desc>${colData.description || ''}</desc>\n`;
    track += '    <extensions>\n';
    track += '      <velo:coldata xmlns:velo="http://velo-altitude.com/gpx/extensions/1.0">\n';
    track += `        <velo:difficulty>${colData.difficulty}</velo:difficulty>\n`;
    track += `        <velo:region>${colData.region}</velo:region>\n`;
    track += `        <velo:maxElevation>${colData.maxElevation}</velo:maxElevation>\n`;
    track += `        <velo:elevationGain>${colData.elevationGain}</velo:elevationGain>\n`;
    track += `        <velo:distance>${colData.distance}</velo:distance>\n`;
    if (colData.weather) {
      track += '        <velo:weather>\n';
      track += `          <velo:conditions>${colData.weather.conditions}</velo:conditions>\n`;
      track += `          <velo:temperature>${colData.weather.temperature}</velo:temperature>\n`;
      track += `          <velo:windSpeed>${colData.weather.windSpeed}</velo:windSpeed>\n`;
      track += `          <velo:windDirection>${colData.weather.windDirection}</velo:windDirection>\n`;
      track += '        </velo:weather>\n';
    }
    track += '      </velo:coldata>\n';
    track += '    </extensions>\n';
    track += '    <trkseg>\n';
    colData.points.forEach(point => {
      track += '      <trkpt ';
      track += `lat="${point.lat}" lon="${point.lon}">\n`;
      if (point.elevation !== undefined) {
        track += `        <ele>${point.elevation}</ele>\n`;
      }
      if (point.time) {
        track += `        <time>${point.time}</time>\n`;
      }
      if (point.gradient || point.surface) {
        track += '        <extensions>\n';
        if (point.gradient !== undefined) {
          track += `          <velo:gradient>${point.gradient}</velo:gradient>\n`;
        }
        if (point.surface) {
          track += `          <velo:surface>${point.surface}</velo:surface>\n`;
        }
        track += '        </extensions>\n';
      }
      track += '      </trkpt>\n';
    });
    track += '    </trkseg>\n';
    track += '  </trk>\n';
    return track;
  }

  // Use processTrack in your GPX generation logic:
  // ...
  // const gpxTrack = processTrack(colData);
  // ...

  return (
    <div className="gpx-export">
      {status === 'idle' && (
        <button className="export-button" onClick={generateGPX}>Export GPX</button>
      )}
      {status === 'generating' && (
        <div className="export-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress * 100}%` }}></div>
          </div>
          <p className="progress-message">{message}</p>
        </div>
      )}
      {status === 'complete' && (
        <div className="export-complete">
          <p>GPX export complete!</p>
          <button className="download-button" onClick={downloadGPX}>Download GPX</button>
          <button className="share-button" onClick={() => {/* share logic */}}>Share</button>
        </div>
      )}
      {status === 'error' && (
        <div className="export-error">
          <p>{message}</p>
          <button className="retry-button" onClick={generateGPX}>Retry</button>
        </div>
      )}
    </div>
  );
}

export default GPXExport;

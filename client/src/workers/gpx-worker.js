// GPX generation Web Worker for Velo-Altitude
self.addEventListener('message', async (e) => {
  const { colData, options } = e.data;
  try {
    self.postMessage({ type: 'progress', progress: 0.1, message: 'Initializing...' });
    const gpx = await generateGPX(colData, options, progress => {
      self.postMessage({ type: 'progress', progress, message: `Processing ${Math.round(progress * 100)}%` });
    });
    self.postMessage({ type: 'complete', gpx });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
});

async function generateGPX(colData, options, progressCallback) {
  progressCallback(0.2);
  await wait(200);
  let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
  gpx += '<gpx version="1.1" creator="Velo-Altitude" xmlns="http://www.topografix.com/GPX/1/1">\n';
  gpx += '  <metadata>\n';
  gpx += `    <name>${colData.name}</name>\n`;
  gpx += `    <desc>${colData.description || ''}</desc>\n`;
  gpx += `    <time>${new Date().toISOString()}</time>\n`;
  gpx += '  </metadata>\n';
  progressCallback(0.4);
  await wait(200);
  gpx += processWaypoints(colData.waypoints);
  progressCallback(0.6);
  await wait(200);
  gpx += processTrack(colData);
  progressCallback(0.8);
  await wait(200);
  gpx += '</gpx>';
  progressCallback(1.0);
  return gpx;
}

function processWaypoints(waypoints = []) {
  if (!waypoints.length) return '';
  return waypoints.map(wp => `  <wpt lat="${wp.lat}" lon="${wp.lon}"><name>${wp.name}</name></wpt>\n`).join('');
}

function processTrack(colData) {
  if (!colData.track || !colData.track.length) return '';
  let track = '  <trk>\n    <name>' + colData.name + '</name>\n    <trkseg>\n';
  track += colData.track.map(pt => `      <trkpt lat="${pt.lat}" lon="${pt.lon}">${pt.ele ? `<ele>${pt.ele}</ele>` : ''}</trkpt>\n`).join('');
  track += '    </trkseg>\n  </trk>\n';
  return track;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

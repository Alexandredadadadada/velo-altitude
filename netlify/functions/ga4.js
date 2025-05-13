const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { GoogleAuth } = require('google-auth-library');

function getClientFromEnv() {
  const json = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error('GA4_SERVICE_ACCOUNT_JSON not set');
  const credentials = JSON.parse(json);
  const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/analytics.readonly'] });
  return new BetaAnalyticsDataClient({ auth });
}

exports.handler = async (event) => {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const path = event.path || '';
  let body = {};
  let statusCode = 200;

  try {
    const client = getClientFromEnv();
    if (path.endsWith('/basic')) {
      const [response] = await client.runRealtimeReport({
        property: `properties/${propertyId}`,
        metrics: [{ name: 'activeUsers' }]
      });
      body = { site_name: "Grand Est Cyclisme", users_total: Number(response.rows?.[0]?.metricValues?.[0]?.value || 0) }; // Ajout du nom du site pour le front
    } else if (path.endsWith('/top_pages_daytime')) {
      const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: 'today', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        limit: 6
      });
      body = response.rows.map(r => ({
        url: r.dimensionValues[0].value,
        views: Number(r.metricValues[0].value)
      }));
    } else if (path.endsWith('/top_pages_realtime')) {
      const [response] = await client.runRealtimeReport({
        property: `properties/${propertyId}`,
        dimensions: [{ name: 'pageTitle' }],
        metrics: [{ name: 'activeUsers' }],
        limit: 6
      });
      body = response.rows.map(r => ({
        title: r.dimensionValues[0].value,
        views: Number(r.metricValues[0].value)
      }));
    } else {
      statusCode = 404;
      body = { error: 'Not found' };
    }
  } catch (e) {
    statusCode = 500;
    console.error('Erreur GA4:', e);
    body = { error: 'Impossible de récupérer les données GA4.', details: e.message };
  }

  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  };
};

import { NextApiRequest, NextApiResponse } from 'next';
import { APIOrchestrator } from '../../../api/orchestration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid route ID' });
  }

  const orchestrator = new APIOrchestrator();

  try {
    switch (req.method) {
      case 'GET':
        // Get route with weather and elevation data
        const routeData = await orchestrator.getRouteWithWeatherAndElevation(id);
        return res.status(200).json(routeData);
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`Error processing route ${id}:`, error);
    return res.status(500).json({ 
      error: 'Failed to process route data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

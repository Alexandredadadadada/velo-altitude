import { NextApiRequest, NextApiResponse } from 'next';
import { APIOrchestrator } from '../../../api/orchestration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { routeId } = req.query;
  
  if (!routeId || Array.isArray(routeId)) {
    return res.status(400).json({ error: 'Invalid route ID' });
  }

  try {
    const orchestrator = new APIOrchestrator();
    const recommendations = await orchestrator.getNutritionRecommendations(routeId);
    
    return res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error generating nutrition recommendations:', error);
    return res.status(500).json({ 
      error: 'Failed to generate nutrition recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

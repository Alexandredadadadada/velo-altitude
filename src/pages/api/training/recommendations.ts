import { NextApiRequest, NextApiResponse } from 'next';
import { APIOrchestrator } from '../../../api/orchestration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orchestrator = new APIOrchestrator();
    const recommendations = await orchestrator.getTrainingRecommendations();
    
    return res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error generating training recommendations:', error);
    return res.status(500).json({ 
      error: 'Failed to generate training recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { APIOrchestrator } from '../../../api/orchestration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orchestrator = new APIOrchestrator();
    const athleteData = await orchestrator.getAthleteWithActivities();
    
    return res.status(200).json(athleteData);
  } catch (error) {
    console.error('Error fetching athlete data:', error);
    return res.status(500).json({ error: 'Failed to fetch athlete data' });
  }
}

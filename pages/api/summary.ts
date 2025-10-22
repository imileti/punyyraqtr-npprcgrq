import type { NextApiRequest, NextApiResponse } from 'next'
import { getSummary } from '@/lib/exchangeService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Summary API called:', { method: req.method, query: req.query });
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { start, end, mode = 'day' } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Missing required parameters: start and end' });
  }

  if (typeof start !== 'string' || typeof end !== 'string') {
    return res.status(400).json({ error: 'Invalid parameter types' });
  }

  if (mode !== 'day' && mode !== 'none') {
    return res.status(400).json({ error: 'Invalid mode. Must be "day" or "none"' });
  }

  try {
    const result = await getSummary(start, end, mode as 'day' | 'none');
    res.status(200).json(result);
  } catch (error) {
    console.error('Summary request failed:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

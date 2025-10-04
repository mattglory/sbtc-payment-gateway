import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companyName, industry, description } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'Please add OPENAI_API_KEY to .env.local'
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Analyze the ESG (Environmental, Social, Governance) performance for:
Company: ${companyName}
Industry: ${industry || 'Not specified'}
Description: ${description || 'Not provided'}

Provide scores (0-100) for Environmental, Social, and Governance, plus an overall score and brief analysis.

Return ONLY valid JSON in this exact format:
{
  "environmental": 75,
  "social": 80,
  "governance": 85,
  "overall": 80,
  "analysis": "Brief ESG analysis here..."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return res.status(200).json({
      success: true,
      companyName,
      scores: {
        environmental: result.environmental,
        social: result.social,
        governance: result.governance,
        overall: result.overall
      },
      analysis: result.analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ESG API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze ESG scores',
      details: error.message 
    });
  }
}

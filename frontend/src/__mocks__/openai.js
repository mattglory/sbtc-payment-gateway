// Mock OpenAI module for testing
export const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              esgScores: {
                environmental: 85,
                social: 72,
                governance: 68,
                overall: 75
              },
              analysis: {
                strengths: ['Clean energy leadership', 'Innovation'],
                weaknesses: ['Governance concerns'],
                recommendations: ['Improve board diversity']
              },
              confidence: 0.87
            })
          }
        }],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 200,
          total_tokens: 350
        }
      })
    }
  }
};

export default jest.fn(() => mockOpenAI);
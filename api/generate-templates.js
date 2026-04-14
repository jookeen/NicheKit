// api/generate-templates.js - Vercel serverless function for template generation
const { Anthropic } = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { templateType, niche, targetAudience } = req.body;

    if (!templateType || !niche) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const prompt = `Generate a comprehensive ${templateType} template for a business in the ${niche} industry targeting ${targetAudience || 'general customers'}.

Include all relevant sections that would be in a professional template. Structure it with clear headings, placeholders in [brackets] for user customization, and helpful guidance notes.

Format the output in HTML with proper heading tags (h2, h3), paragraphs, bullet points, and bold text for emphasis.`;

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].text;

    const formatted = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/### (.+)$/gm, '<h3>$1</h3>')
      .replace(/## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');

    res.status(200).json({ template: formatted });
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: error.message });
  }
};

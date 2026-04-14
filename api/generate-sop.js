// api/generate-sop.js - Vercel serverless function for SOP generation
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
    const { niche, targetAudience, service, tone } = req.body;

    if (!niche || !targetAudience || !service) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const prompt = `Generate a comprehensive Standard Operating Procedure (SOP) document for a ${service} business targeting ${targetAudience} in the ${niche} industry. Use a ${tone || 'professional'} tone.

Include these sections:
1. Purpose & Scope
2. Roles & Responsibilities
3. Step-by-Step Procedures
4. Quality Control Measures
5. Documentation Requirements
6. Troubleshooting Guide

Format the output in HTML with proper heading tags (h2, h3), paragraphs, bullet points, and bold text for emphasis. Make it practical and actionable.`;

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].text;

    // Convert markdown-style formatting to HTML
    const formatted = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/### (.+)$/gm, '<h3>$1</h3>')
      .replace(/## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');

    res.status(200).json({ sop: formatted });
  } catch (error) {
    console.error('Error generating SOP:', error);
    res.status(500).json({ error: error.message });
  }
};

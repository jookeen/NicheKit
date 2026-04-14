export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessType, processes, hourlyRate } = req.body;

    // Validate input
    if (!businessType || !processes || !processes.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rate = parseFloat(hourlyRate) || 35;

    // Hours map
    const HOURS_MAP = {
      'Lead follow-up emails': 3, 'Quoting & invoicing': 4, 'Scheduling & reminders': 2,
      'Review requests': 1, 'Payroll for cleaners': 3, 'Supply reordering': 2,
      'Lead nurturing emails': 3, 'Showing scheduling': 3, 'CMA report creation': 5,
      'Contract follow-ups': 2, 'Social media posting': 4, 'Client check-ins': 2,
      'Appointment reminders': 2, 'New patient intake': 3, 'Insurance verification': 4,
      'Recall campaigns': 2, 'Staff scheduling': 3,
      'Reservation management': 3, 'Inventory tracking': 4, 'Employee scheduling': 3,
      'Review responses': 2, 'Supplier ordering': 2, 'Payroll processing': 4,
      'Order confirmation emails': 2, 'Abandoned cart recovery': 3, 'Inventory sync': 3,
      'Customer support replies': 5, 'Refund processing': 2,
      'Class scheduling': 2, 'Membership renewals': 2, 'Attendance tracking': 2,
      'Lead nurturing': 3,
      'Client intake forms': 3, 'Document collection': 4, 'Deadline reminders': 1,
      'Invoice follow-ups': 2, 'Conflict checks': 3, 'Referral tracking': 2,
      'Client reporting': 5, 'Social scheduling': 4, 'Project status updates': 2,
      'Invoice reminders': 2, 'Content repurposing': 3,
      'Bid follow-ups': 3, 'Job scheduling': 3, 'Subcontractor comms': 3,
      'Material ordering': 3, 'Permit tracking': 2, 'Customer updates': 2,
      'Inventory alerts': 2, 'Purchase orders': 3, 'Customer loyalty emails': 2,
      'Sales reporting': 2,
    };

    const totalHrs = processes.reduce((s, p) => s + (HOURS_MAP[p] || 2), 0);
    const savedHrs = Math.round(totalHrs * 0.8 * 10) / 10;

    const prompt = `You are an expert automation consultant for small businesses. Create a detailed, actionable automation implementation plan for a ${businessType} business.
Manual processes to automate:
${processes.map(p => `- ${p} (~${HOURS_MAP[p] || 2} hrs/week)`).join('\n')}
Current data:
- Hours wasted per week: ~${totalHrs} hours
- Hours saved with automation: ~${savedHrs} hours/week
- Hourly value rate: $${rate}/hr
Create a professional automation plan with:
1. **EXECUTIVE SUMMARY** (2-3 sentences on the ROI opportunity)
2. **AUTOMATION STACK** (Specific tools for each process: Make.com, Zapier, AI tools, etc.)
3. **IMPLEMENTATION ROADMAP** (Phase 1: Quick wins in week 1, Phase 2: Core automations weeks 2-4, Phase 3: Advanced AI integrations)
4. **TOP 3 HIGHEST-IMPACT AUTOMATIONS** (Most detail here — explain exactly how each works, what triggers it, what it does)
5. **TOOLS & ESTIMATED COSTS** (Monthly tool costs breakdown)
6. **PITCH SCRIPT** (A 3-sentence pitch to sell this $500-$2000 setup to the business owner)
Be specific, technical, and actionable. This is a deliverable a consultant would hand to a client.`;

    // Call Anthropic API with server-side key
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errText}`);
    }

    const data = await anthropicResponse.json();
    const text = data.content?.map(b => b.text || '').join('') || 'Error generating plan.';

    // Format markdown for HTML
    const formatted = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^#{1,3}\s+(.+)$/gm, '<strong style="color:#00d4ff;font-size:15px">$1</strong>');

    res.status(200).json({ plan: formatted });
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ error: error.message });
  }
}

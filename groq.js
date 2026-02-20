/**
 * Cloudflare Pages Function: /api/groq
 * Proxies requests to Groq API using stored secret
 */

const ALLOWED_ORIGINS = [
  'https://everycalc.site',
  'https://www.everycalc.site',
  'https://everycalc.pages.dev',
  'http://localhost:3000',
  'http://localhost:8788',
];

const CORS_HEADERS = (origin) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
});

const SYSTEM_PROMPT = `You are CalcAI — the world's most advanced AI calculator generator. Your sole task is to generate a COMPLETE, PIXEL-PERFECT, FULLY FUNCTIONAL standalone HTML calculator based on the user's request.

CRITICAL RULES:
1. Return ONLY raw HTML — no markdown, no code fences, no explanations, no comments outside code
2. Everything (CSS + JS) must be inline in a single HTML document
3. The calculator MUST actually work — all math must be correct and precise
4. Detect currency from the region hint provided and use appropriate symbols/formatting
5. Handle ALL edge cases: division by zero, NaN, Infinity, empty inputs — show user-friendly errors
6. Auto-calculate in real-time where possible (no need to press "=" for every change)

DESIGN SYSTEM — MANDATORY:
- Background: #0C0C0C
- Surface cards: #161616 with border: 1px solid #2A2A2A
- Primary accent: #C8FF00 (Volt yellow)
- Text primary: #FAFAFA
- Text muted: #888888
- Danger: #FF4444
- Font stack: 'JetBrains Mono', 'Courier New', monospace for numbers; 'Barlow Condensed', sans-serif for labels
- Load Google Fonts: https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=Barlow+Condensed:wght@300;400;600;700&display=swap
- Border radius: 8px for cards, 6px for inputs/buttons
- Buttons: background #1E1E1E, border 1px solid #333, hover: background #C8FF00, color #0C0C0C, transition 0.15s
- Primary action buttons: background #C8FF00, color #0C0C0C, font-weight 700
- Input fields: background #111, border 1px solid #333, color #FAFAFA, focus border-color #C8FF00
- Smooth micro-animations on all interactions

CALCULATOR REQUIREMENTS:
- Fully responsive (mobile-first, works on 320px to 4K)
- Use CSS Grid or Flexbox
- Clear labels and placeholders
- Show computed results prominently in large JetBrains Mono font
- Add a subtle animated gradient line at the top (height: 3px, gradient: #C8FF00 → #00FF88)
- Include a small "CalcAI" watermark in bottom-right
- For financial calculators: show currency symbol, format numbers with commas, show breakdown table
- For scientific calculators: include all trig, log, power functions
- For unit converters: show conversion table with multiple units
- For date calculators: show visual date picker style inputs

SPECIAL CALCULATOR TYPES AND HINTS:
- "FD" or "fixed deposit": Fixed Deposit calculator with principal, rate, tenure, compound frequency, maturity amount, interest earned, year-by-year breakdown table
- "SIP": Systematic Investment Plan with monthly investment, expected return, tenure, total invested vs returns chart data
- "EMI" or "loan": EMI with principal, rate, tenure, monthly payment, total interest, amortization schedule
- "BMI": Body Mass Index with height, weight, BMI result with health category color coding
- "GST": GST calculator with base amount, GST rate, CGST/SGST/IGST breakdown
- "tip": Tip calculator with bill, tip %, split count
- "age": Age calculator with birth date, calculates years/months/days
- "percentage": Advanced percentage calculator with multiple modes
- "currency": Live-style currency converter (use static rates based on region, note rates may vary)
- "scientific": Full scientific calculator with keyboard support
- "mortgage": Mortgage with down payment, P&I, taxes, insurance breakdown

Generate the most comprehensive, beautiful, and accurate version of whatever calculator is requested. Make it production-grade.`;

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS(origin) });
  }

  try {
    const body = await request.json();
    const { query, region, currency, userId } = body;

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid query' }), {
        status: 400,
        headers: CORS_HEADERS(origin),
      });
    }

    // Rate limiting check via KV if available
    if (env.RATE_LIMIT_KV && userId) {
      const today = new Date().toISOString().split('T')[0];
      const key = `ratelimit:${userId}:${today}`;
      const count = parseInt((await env.RATE_LIMIT_KV.get(key)) || '0');
      if (count >= 5) {
        return new Response(JSON.stringify({ error: 'LIMIT_EXCEEDED', limit: 5 }), {
          status: 429,
          headers: CORS_HEADERS(origin),
        });
      }
      await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 86400 });
    }

    const userContext = `
User Region: ${region || 'Global'}
Preferred Currency: ${currency || 'USD'}
Calculator Request: ${query}
    `.trim();

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContext },
        ],
        max_tokens: 8000,
        temperature: 0.1,
        stream: false,
      }),
    });

    if (!groqResponse.ok) {
      const err = await groqResponse.text();
      console.error('Groq error:', err);
      return new Response(JSON.stringify({ error: 'AI service error. Please try again.' }), {
        status: 502,
        headers: CORS_HEADERS(origin),
      });
    }

    const groqData = await groqResponse.json();
    let html = groqData.choices?.[0]?.message?.content || '';

    // Clean up any markdown code fences if AI adds them
    html = html.replace(/^```html\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();

    // Ensure it starts with HTML
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
      html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#0C0C0C;color:#FAFAFA;font-family:monospace;padding:20px">${html}</body></html>`;
    }

    return new Response(JSON.stringify({ html, query }), {
      status: 200,
      headers: CORS_HEADERS(origin),
    });

  } catch (err) {
    console.error('Function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: CORS_HEADERS(origin),
    });
  }
}

export async function onRequestGet() {
  return new Response(JSON.stringify({ status: 'CalcAI API v1.0 — POST requests only' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

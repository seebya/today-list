import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM = `You are a warm, brief task assistant. The user is doing a brain dump.
Have a short conversation to understand their tasks. Ask one clarifying question at a time if something is vague.
Keep replies to 1-3 sentences max.
When you have a clear picture (usually after 1-3 exchanges), say exactly "Got it! Here are your tasks:" then output:
TASKS:[{"task":"...","q":"easy-today"},{"task":"...","q":"hard-later"}]
Quadrant rules — today vs later: only "later" if user says later/eventually/someday/maybe/one day.
easy vs hard: easy=quick single action, hard=needs focus or multiple steps.
Do not output TASKS until you are confident you have captured everything.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const { messages } = await req.json()
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: SYSTEM }, ...messages],
        max_tokens: 400,
        temperature: 0.7,
      }),
    })
    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content ?? 'Something went wrong.'
    return new Response(JSON.stringify({ reply }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ reply: 'Error: ' + (e as Error).message }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }, status: 500
    })
  }
})

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY

export async function askGroq(system: string, user: string, maxTokens = 1024): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('EXPO_PUBLIC_GROQ_API_KEY is not set')

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) throw new Error('AI request failed')
  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('Empty AI response')
  return text
}

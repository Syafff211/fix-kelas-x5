import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, systemPrompt } = await request.json();

    // Using Groq API (free and fast) - you can also use OpenAI, Anthropic, etc.
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768', // Fast and capable model
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const message = data.choices[0]?.message?.content || 'Maaf, saya tidak bisa merespons saat ini.';

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { message: 'Maaf, terjadi kesalahan. Silakan coba lagi dalam beberapa saat.' },
      { status: 500 }
    );
  }
}

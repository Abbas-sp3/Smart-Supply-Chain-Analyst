import { NextResponse } from 'next/server';
import { queryRag } from '@/features/geopolitical-intelligence/services/ragService';

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    const GROQ_API_KEY_RAG = process.env.GROQ_API_KEY_RAG;
    if (!GROQ_API_KEY_RAG) {
      return NextResponse.json({ 
        error: "GROQ_API_KEY_RAG is missing. Please configure it in .env.local to enable the Ask Intelligence feature." 
      }, { status: 500 });
    }

    const topChunks = await queryRag(question);
    
    // Honesty gate: if top score is very low, refuse to answer
    if (topChunks.length === 0 || topChunks[0].score < 0.25) {
      return NextResponse.json({
        answer: "I don't have enough information in the provided intelligence corpus to answer this question. (No relevant context retrieved)",
        citations: [],
        retrievedChunks: topChunks.map(c => ({
          sourceLabel: c.sourceLabel,
          score: c.score,
          excerpt: c.text.slice(0, 200) + (c.text.length > 200 ? '…' : ''),
        })),
        belowThreshold: true,
      });
    }

    const contextText = topChunks.map((c, i) => `[Source ${i+1}: ${c.sourceLabel}]\n${c.text}`).join('\n\n');

    const prompt = `You are a strict intelligence analyst. Answer the following user question based ONLY on the provided Context below.
If the context does not contain the answer, you must state: "I don't have enough information in the provided intelligence corpus to answer this question."
Do NOT use outside or general knowledge.
Keep your answer concise and factual.

Context:
${contextText}

Question:
${question}
`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY_RAG}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.0
      })
    });

    if (!res.ok) {
      throw new Error(`Groq API error: ${res.status}`);
    }

    const data = await res.json();
    const answer = data.choices[0].message.content;

    return NextResponse.json({ 
      answer, 
      citations: topChunks.map(c => c.sourceLabel),
      // Return the retrieved chunks so the UI can show the retrieval step
      retrievedChunks: topChunks.map(c => ({
        sourceLabel: c.sourceLabel,
        score: c.score,
        excerpt: c.text.slice(0, 240) + (c.text.length > 240 ? '…' : ''),
      })),
      belowThreshold: false,
    });

  } catch (error: any) {
    console.error("Ask Intelligence error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

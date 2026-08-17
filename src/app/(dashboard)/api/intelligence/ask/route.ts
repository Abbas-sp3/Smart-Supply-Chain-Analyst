import { NextResponse } from 'next/server';
import { queryRag } from '@/features/geopolitical-intelligence/services/ragService';

export async function POST(req: Request) {
  try {
    const { question, country = "the country" } = await req.json();
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

    const contextText = topChunks.map((c, i) => `[Source ${i+1}: ${c.sourceLabel} | Scenario ID: ${c.scenarioId || 'N/A'} | Type: ${c.type}]\n${c.text}`).join('\n\n');

    const prompt = `You are a strategic intelligence analyst advising ${country}. Synthesize a coherent, narrative impact analysis based ONLY on the provided Context below.
Do not simply list the facts; weave them into a comprehensive strategic brief that explains downstream effects, affected industries, and strategic implications specifically for ${country}. Do not mention or reference any other country's perspective.
If the retrieved chunks come from different scenarios (as indicated by the Scenario ID or content), attribute each claim to its specific scenario by name (e.g. 'under a full closure...' vs 'a partial closure would instead...'). Never merge details from different scenarios into a single unqualified description.
Use historical precedent context (chunks with Type: precedent) as supporting historical comparison, not as equal-weight current facts.
CRITICAL INSTRUCTION FOR UNRELATED QUERIES: If the user's question is entirely unrelated to the provided supply chain and geopolitical context (e.g., asking for general tourism advice, personal stock/investment tips, generic chit-chat, or coding help), you MUST outright refuse to answer it. Reply exactly with: "I cannot answer this question as it is unrelated to the provided supply chain intelligence context." Do NOT attempt to twist or force the context to answer irrelevant questions.
If the question IS relevant but the context does not contain the *exact* answer, synthesize the closest relevant impacts from the provided context without making up external facts.
Do not introduce external facts not contained in the provided chunks, but you MAY extrapolate the logical supply chain impacts based on the provided context.
CRITICAL FORMATTING RULES: Do NOT use any markdown syntax. No **, no ##, no ###, no ---, no bullet points with -. Write in plain flowing prose paragraphs only. No headers, no bold, no separators.

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
        model: "openai/gpt-oss-120b",
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

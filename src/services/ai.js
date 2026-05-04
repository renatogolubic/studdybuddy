// src/services/ai.js
// Groq free API – fast, browser CORS-safe, no proxy needed

const GROQ_TOKEN = import.meta.env.VITE_GROQ_TOKEN;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

/**
 * Generate flashcards (Q&A pairs) from note content using Groq's free API.
 * @param {string} title   - Note title for context
 * @param {string} content - Note body text
 * @param {number} count   - Desired number of flashcards (default 6)
 * @returns {Promise<Array<{question: string, answer: string}>>}
 */
export async function generateFlashcardsAI(title, content, count = 6) {
  if (!GROQ_TOKEN || GROQ_TOKEN === "your_groq_token_here") {
    throw new Error("VITE_GROQ_TOKEN nije postavljen. Dodajte token u .env datoteku (console.groq.com).");
  }

  // Trim content to avoid exceeding context window
  const trimmedContent = content.length > 3000
    ? content.slice(0, 3000) + "\n...[sadržaj skraćen]"
    : content;

  const systemPrompt = `You are a JSON flashcard generator. You output ONLY raw JSON arrays — nothing else.
Never use markdown. Never add explanations. Never add code fences. Start your response with [ and end with ]. All text needs to be display in Croatian language.

Example output format:
[{"question":"What is X?","answer":"X is Y."},{"question":"Define Z.","answer":"Z means W."}]`;

  const userPrompt = `Title: ${title}

Text:
${trimmedContent}

Output a JSON array of exactly ${count} flashcard objects with "question" and "answer" string fields. Start with [ immediately.`;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1400,
      temperature: 0.2,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 401) {
      throw new Error("Neispravan Groq API token. Provjerite VITE_GROQ_TOKEN u .env datoteci.");
    }
    if (response.status === 429) {
      throw new Error("Previše zahtjeva. Pričekajte minutu i pokušajte ponovo.");
    }
    throw new Error(`Groq API greška (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "";

  if (!raw) {
    throw new Error("AI nije vratio odgovor. Pokušajte ponovo.");
  }

  // Strip markdown fences if present (```json ... ``` or ``` ... ```)
  let cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Extract the first JSON array found in the text
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) {
    throw new Error("AI nije vratio ispravni JSON format. Pokušajte ponovo.");
  }

  let cards;
  try {
    cards = JSON.parse(match[0]);
  } catch {
    throw new Error("Greška pri parsiranju AI odgovora. Pokušajte ponovo.");
  }


  // Validate and sanitise
  const valid = cards
    .filter(c => c && typeof c.question === "string" && typeof c.answer === "string")
    .map(c => ({ question: c.question.trim(), answer: c.answer.trim() }))
    .filter(c => c.question && c.answer);

  if (valid.length === 0) {
    throw new Error("AI nije generirao validne kartice. Pokušajte ponovo.");
  }

  return valid;
}

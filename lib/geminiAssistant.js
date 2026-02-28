'use strict';

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ---------------------------------------------------------------------------
// Knowledge base – loaded once at startup
// ---------------------------------------------------------------------------
const KB_PATH = path.join(__dirname, '..', 'data', 'petropavlovsk_kz_kb.md');
let knowledgeBaseText = '';
try {
  knowledgeBaseText = fs.readFileSync(KB_PATH, 'utf8');
} catch (e) {
  console.warn('[geminiAssistant] Warning: knowledge-base file not found at', KB_PATH);
}

// Split KB into chunks (one per "##" section), skipping the title-only first line
const KB_CHUNKS = knowledgeBaseText
  .split(/\n(?=## )/)
  .map((s) => s.trim())
  .filter((s) => s.startsWith('## '));

// ---------------------------------------------------------------------------
// Simple keyword relevance: return the top-N chunks relevant to a query
// ---------------------------------------------------------------------------
function getRelevantChunks(query, topN = 4) {
  if (!KB_CHUNKS.length) return '';
  const words = query
    .toLowerCase()
    .replace(/[^а-яёa-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scored = KB_CHUNKS.map((chunk) => {
    const lower = chunk.toLowerCase();
    let score = 0;
    for (const w of words) score += (lower.split(w).length - 1);
    return { chunk, score };
  });

  const topChunks = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((x) => x.chunk);

  // If nothing matched, include first two general sections as fallback
  if (!topChunks.length) {
    return KB_CHUNKS.slice(0, 2).join('\n\n');
  }
  return topChunks.join('\n\n');
}

// ---------------------------------------------------------------------------
// System instruction for the model
// ---------------------------------------------------------------------------
const SYSTEM_INSTRUCTION = `Ты — виртуальный помощник-справочник по городу Петропавловск (Северо-Казахстанская область, Казахстан).
Твоя задача — отвечать исключительно на вопросы, связанные с Петропавловском (СКО): его историей, географией, инфраструктурой, транспортом, достопримечательностями, учреждениями, государственными услугами, экономикой, культурой, жильём и климатом.

Правила:
1. Отвечай ТОЛЬКО на вопросы о Петропавловске (СКО). Если вопрос не относится к городу — вежливо откажи и попроси уточнить.
2. Используй информацию из предоставленной базы знаний. Не придумывай факты.
3. Отвечай на языке пользователя (русский или английский). По умолчанию — русский.
4. Не пользуйся интернетом и внешними источниками.
5. Будь краток, точен и полезен.`;

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------
async function askAssistant(userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      reply:
        'Ассистент временно недоступен: не задан API-ключ (GEMINI_API_KEY). Обратитесь к администратору.',
      error: 'GEMINI_API_KEY is not set',
    };
  }

  const relevantKB = getRelevantChunks(userMessage);

  const contextBlock = relevantKB
    ? `\n\n--- Фрагменты базы знаний ---\n${relevantKB}\n--- Конец фрагментов ---`
    : '';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel(
    {
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    },
    { timeout: 30000 }
  );

  const prompt = `${userMessage}${contextBlock}`;

  try {
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    return { reply };
  } catch (err) {
    console.error('[geminiAssistant] Gemini API error:', err.message || err);

    // Fall back to knowledge-base-only response when Gemini is unreachable.
    // Limit to 1200 chars to keep the chat reply readable in the UI.
    if (relevantKB) {
      // Strip markdown heading syntax so the fallback reads as plain prose.
      const cleanKB = relevantKB
        .slice(0, 1200)
        .replace(/^## (.+)$/gm, '[$1]');
      const fallback =
        'ИИ-сервис временно недоступен. Вот информация из базы знаний:\n\n' +
        cleanKB;
      return { reply: fallback, error: err.message || 'Gemini API error' };
    }

    return {
      reply: 'Ошибка при обращении к ИИ-сервису. Попробуйте позже.',
      error: err.message || 'Gemini API error',
    };
  }
}

module.exports = { askAssistant };

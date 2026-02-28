const express = require('express');
const router = express.Router();
const { askAssistant } = require('../lib/geminiAssistant');

// Обработчик для ИИ-ассистента (Gemini / Петропавловск СКО)
router.post('/', async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ reply: 'Пожалуйста, введите сообщение.' });
    }

    const { reply, error } = await askAssistant(String(message).trim());

    if (error) {
      return res.status(503).json({ reply });
    }

    res.json({ reply });
  } catch (error) {
    console.error('Ошибка ассистента:', error);
    res.status(500).json({ reply: 'Внутренняя ошибка сервера при обработке запроса ассистента.' });
  }
});

module.exports = router;
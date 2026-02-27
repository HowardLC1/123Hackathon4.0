const express = require('express');

const router = express.Router();

// Simple placeholder AI assistant endpoint.
// In future you can replace logic here with a real LLM/API call.
router.post('/', async (req, res) => {
  try {
    const { message, context } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ reply: 'Please send a non-empty message.' });
    }

    const trimmed = String(message).trim();

    // Very small, friendly stub reply so UI feels alive.
    let reply =
      "I'm an assistant stub running locally. " +
      "Right now I can’t access real AI, but I received your message and can help with basic guidance.\n\n" +
      `You said: “${trimmed}”.\n\n` +
      "Typical things I can help with here:\n" +
      "- How to submit a complaint and what fields mean\n" +
      "- How to track a ticket by ID\n" +
      "- How admins log in, sign up, and update statuses\n\n" +
      "For deeper AI answers you can later connect this endpoint to a real LLM.";

    if (context && context.page) {
      reply += `\n\nContext: you are on the “${context.page}” page.`;
    }

    res.json({ reply });
  } catch (error) {
    console.error('Assistant error:', error);
    res.status(500).json({ reply: 'Internal error inside assistant endpoint.' });
  }
});

module.exports = router;


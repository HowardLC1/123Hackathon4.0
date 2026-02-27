const express = require('express');
const router = express.Router();

// Обработчик для ИИ-ассистента
router.post('/', async (req, res) => {
  try {
    const { message, context } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ reply: 'Пожалуйста, введите сообщение.' });
    }

    const trimmed = String(message).trim();

    // Заглушка ответа, чтобы интерфейс "ожил"
    let reply =
      "Я — ваш виртуальный помощник. " +
      "На данный момент я работаю в тестовом режиме, но я получил ваше сообщение и готов помочь с базовой навигацией.\n\n" +
      `Вы написали: «${trimmed}».\n\n` +
      "Чем я могу помочь:\n" +
      "- Рассказать, как подать жалобу и что значат поля формы\n" +
      "- Объяснить, как отследить статус по ID тикета\n" +
      "- Помочь администраторам с входом и обновлением статусов\n\n" +
      "Позже этот раздел будет подключен к полноценному искусственному интеллекту.";

    if (context && context.page) {
      // Переводим названия страниц для контекста, если нужно
      const pageNames = {
        'Citizen Complaint Submission': 'Подача жалобы',
        'Track Complaint Status': 'Отслеживание статуса',
        'Admin Dashboard - Complaints': 'Панель администратора'
      };
      const currentPage = pageNames[context.page] || context.page;
      reply += `\n\nКонтекст: вы находитесь на странице «${currentPage}».`;
    }

    res.json({ reply });
  } catch (error) {
    console.error('Ошибка ассистента:', error);
    res.status(500).json({ reply: 'Внутренняя ошибка сервера при обработке запроса ассистента.' });
  }
});

module.exports = router;
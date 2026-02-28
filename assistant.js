(function () {
  const BASE_URL =
    window.location.protocol === 'file:'
      ? 'http://localhost:4000'
      : window.location.origin;

  function createEl(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    });
    children.forEach((c) => el.appendChild(c));
    return el;
  }

  function initAssistant() {
    if (document.querySelector('.ai-assistant-toggle')) return;

    // Кнопка открытия
    const toggle = createEl('button', {
      class: 'ai-assistant-toggle',
      type: 'button',
      'aria-label': 'Открыть ассистента',
    });
    toggle.innerHTML = '<span class="ai-dot"></span><span>ИИ-Помощник</span>';

    // Панель чата
    const panel = createEl('div', { class: 'ai-assistant-panel', 'aria-hidden': 'true' });
    const header = createEl('div', { class: 'ai-assistant-header' });
    header.innerHTML =
      '<div class="ai-assistant-title">Ассистент по Петропавловску</div>' +
      '<div class="ai-assistant-subtitle">Задайте вопрос о городе Петропавловск (СКО, Казахстан).</div>';

    const closeBtn = createEl('button', {
      class: 'ai-assistant-close',
      type: 'button',
      'aria-label': 'Закрыть',
    });
    closeBtn.textContent = '✕';
    header.appendChild(closeBtn);

    const messagesEl = createEl('div', { class: 'ai-assistant-messages' });
    const inputRow = createEl('div', { class: 'ai-assistant-input-row' });
    const input = createEl('textarea', {
      class: 'ai-assistant-input',
      rows: '2',
      placeholder: 'Задайте вопрос...',
    });
    const sendBtn = createEl('button', {
      class: 'btn primary ai-assistant-send',
      type: 'button',
    });
    sendBtn.textContent = 'Отправить';
    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);

    panel.appendChild(header);
    panel.appendChild(messagesEl);
    panel.appendChild(inputRow);

    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    const pageTitle = document.title || 'Страница';

    function addMessage(kind, text) {
      const bubble = createEl('div', {
        class: 'ai-assistant-msg ' + (kind === 'user' ? 'user' : 'bot'),
      });
      bubble.textContent = text;
      messagesEl.appendChild(bubble);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    let open = false;
    function setOpen(v) {
      open = v;
      panel.setAttribute('data-open', v ? 'true' : 'false');
      panel.setAttribute('aria-hidden', v ? 'false' : 'true');
      toggle.setAttribute('data-open', v ? 'true' : 'false');
      if (v) {
        input.focus();
      }
    }

    toggle.addEventListener('click', () => setOpen(!open));
    closeBtn.addEventListener('click', () => setOpen(false));

    async function send() {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      addMessage('user', text);

      sendBtn.disabled = true;
      sendBtn.textContent = '...';

      try {
        const res = await fetch(`${BASE_URL}/api/assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            context: { page: pageTitle, path: window.location.pathname },
          }),
        });
        
        const data = await res.json().catch(() => ({}));
        const reply =
          (data && (data.reply || data.message)) ||
          'Сервер не прислал ответ.';
        addMessage('bot', reply);
      } catch (e) {
        addMessage('bot', 'Ошибка сети или сервера при вызове помощника.');
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Отправить';
      }
    }

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    addMessage(
      'bot',
      'Здравствуйте! Я ваш ИИ-помощник по городу Петропавловск (Северо-Казахстанская область, Казахстан). Спросите меня об истории, достопримечательностях, транспорте, услугах или инфраструктуре города.'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAssistant);
  } else {
    initAssistant();
  }
})();
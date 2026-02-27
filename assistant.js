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

    const toggle = createEl('button', {
      class: 'ai-assistant-toggle',
      type: 'button',
      'aria-label': 'Open assistant',
    });
    toggle.innerHTML = '<span class="ai-dot"></span><span>Ask AI</span>';

    const panel = createEl('div', { class: 'ai-assistant-panel', 'aria-hidden': 'true' });
    const header = createEl('div', { class: 'ai-assistant-header' });
    header.innerHTML =
      '<div class="ai-assistant-title">Assistant</div>' +
      '<div class="ai-assistant-subtitle">Ask about using this page or the system.</div>';

    const closeBtn = createEl('button', {
      class: 'ai-assistant-close',
      type: 'button',
      'aria-label': 'Close assistant',
    });
    closeBtn.textContent = '✕';
    header.appendChild(closeBtn);

    const messagesEl = createEl('div', { class: 'ai-assistant-messages' });
    const inputRow = createEl('div', { class: 'ai-assistant-input-row' });
    const input = createEl('textarea', {
      class: 'ai-assistant-input',
      rows: '2',
      placeholder: 'Ask a question…',
    });
    const sendBtn = createEl('button', {
      class: 'btn primary ai-assistant-send',
      type: 'button',
    });
    sendBtn.textContent = 'Send';
    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);

    panel.appendChild(header);
    panel.appendChild(messagesEl);
    panel.appendChild(inputRow);

    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    const pageTitle = document.title || 'Page';

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
          'Assistant endpoint did not return a reply.';
        addMessage('bot', reply);
      } catch (e) {
        addMessage('bot', 'Network or server error when calling assistant.');
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
      }
    }

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    // Initial helper message
    addMessage(
      'bot',
      'Hi! I am an experimental helper. Ask me how to use this page or how the complaint system works.'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAssistant);
  } else {
    initAssistant();
  }
})();


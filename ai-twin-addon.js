/* ═══════════════════════════════════════════════════════════════
   Devansh's AI TWIN — Inline mode with grid section support
   Injects into #aitwin-inline-container if present, else floats
════════════════════════════════════════════════════════════════ */

(function initAITwin() {

  const HF_API_URL = 'https://devansh8011-ai-chatbot.hf.space/chat';
  const BOT_NAME = "Devansh's AI Twin";
  const SYSTEM_PROMPT = `You are Devansh's AI Twin — a robotics and embedded systems builder behind SteelCircuits. 
Answer questions about Devansh's projects, his skills, and SteelCircuits.
Keep answers concise, enthusiastic, and technical.`;

  const SUGGESTIONS = [
    '⚡ What projects have you built?',
    '🤖 How does the eye-controlled car work?',
    '🔧 What hardware do you use?',
    '✂️ Do you use laser cutting?',
    '🔗 What is Paperclip AI?',
  ];

  /* ─── Inject HTML ──────────────────────────────────────── */
  const html = `
    <button id="aitwin-trigger" aria-label="Open Devansh's AI Twin">
      <span class="notif-dot"></span>
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zM5 14v4h2v1a1 1 0 0 0 2 0v-1h6v1a1 1 0 0 0 2 0v-1h2v-4H5zm4 1h2v2H9v-2zm4 0h2v2h-2v-2z"/>
      </svg>
    </button>

    <div id="aitwin-panel" role="dialog" aria-label="Devansh's AI Twin Chat" aria-hidden="true">
      <div class="aitwin-header">
        <div class="aitwin-avatar">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zM5 14v4h2v1a1 1 0 0 0 2 0v-1h6v1a1 1 0 0 0 2 0v-1h2v-4H5zm4 1h2v2H9v-2zm4 0h2v2h-2v-2z"/>
          </svg>
        </div>
        <div class="aitwin-header-text">
          <div class="aitwin-name">${BOT_NAME}</div>
          <div class="aitwin-status">ONLINE</div>
        </div>
        <button class="aitwin-close" id="aitwin-close" aria-label="Close chat">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="aitwin-messages" id="aitwin-messages"></div>
      <div class="aitwin-suggestions" id="aitwin-suggestions"></div>

      <div class="aitwin-input-row">
        <textarea id="aitwin-input" placeholder="Ask Devansh's AI Twin anything…" rows="1" aria-label="Message input"></textarea>
        <button id="aitwin-send" aria-label="Send message">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  const inlineContainer = document.getElementById('aitwin-inline-container');

  if (inlineContainer) {
    inlineContainer.innerHTML = html;
  } else {
    document.body.insertAdjacentHTML('beforeend', html);
  }

  /* ─── State ────────────────────────────────────────────── */
  const panel     = document.getElementById('aitwin-panel');
  const trigger   = document.getElementById('aitwin-trigger');
  const closeBtn  = document.getElementById('aitwin-close');
  const messages  = document.getElementById('aitwin-messages');
  const input     = document.getElementById('aitwin-input');
  const sendBtn   = document.getElementById('aitwin-send');
  const sugBox    = document.getElementById('aitwin-suggestions');

  let isOpen      = false;
  let isLoading   = false;
  let history     = [];

  /* ─── Toggle panel ─────────────────────────────────────── */
  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    trigger.querySelector('.notif-dot').style.display = 'none';
    if (messages.children.length === 0) {
      addBotMessage(`Hey! I'm ${BOT_NAME} — Devansh's AI twin. Ask me about robotics, laser cutting fabrication, or Paperclip AI workflows! ⚡`);
      renderSuggestions();
    }
    setTimeout(() => input.focus(), 350);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  trigger.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closePanel(); });

  /* ─── Render suggestion chips ──────────────────────────── */
  function renderSuggestions() {
    sugBox.innerHTML = SUGGESTIONS.map(s =>
      `<button class="suggestion-chip">${s}</button>`
    ).join('');
    sugBox.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        submitMessage(chip.innerText.replace(/^[⚡🤖🔧✂️🔗]\s/, ''));
        sugBox.innerHTML = '';
      });
    });
  }

  /* ─── Message rendering ────────────────────────────────── */
  function getTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function addBotMessage(text) {
    const div = document.createElement('div');
    div.className = 'aitwin-msg bot';
    div.innerHTML = `<div class="aitwin-bubble">${escapeHtml(text)}</div><div class="aitwin-timestamp">${BOT_NAME} · ${getTime()}</div>`;
    messages.appendChild(div);
    scrollToBottom();
  }

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'aitwin-msg user';
    div.innerHTML = `<div class="aitwin-bubble">${escapeHtml(text)}</div><div class="aitwin-timestamp">You · ${getTime()}</div>`;
    messages.appendChild(div);
    scrollToBottom();
  }

  function addTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'aitwin-msg bot';
    div.id = 'aitwin-typing';
    div.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
    messages.appendChild(div);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const el = document.getElementById('aitwin-typing');
    if (el) el.remove();
  }

  function addErrorMessage(msg) {
    const div = document.createElement('div');
    div.className = 'aitwin-error';
    div.textContent = msg;
    messages.appendChild(div);
    scrollToBottom();
  }

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  /* ─── API call ─────────────────────────────────────────── */
  async function fetchHF(userMessage) {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, system_prompt: 'Devansh uses laser cutting for precise acrylic and wood chassis fabrication in his robotics builds. He also builds agentic workflows with Paperclip AI to orchestrate robotics pipelines.' }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API error ${response.status}: ${err.slice(0, 120)}`);
    }
    return await response.json();
  }

  function parseResponse(data) {
    return data.reply || "No response.";
  }

  /* ─── Main send flow ────────────────────────────────────── */
  async function submitMessage(text) {
    const msg = text.trim();
    if (!msg || isLoading) return;

    input.value = '';
    input.style.height = 'auto';
    sugBox.innerHTML = '';

    addUserMessage(msg);
    history.push({ role: 'user', content: msg });

    isLoading = true;
    sendBtn.disabled = true;
    addTypingIndicator();

    try {
      const data = await fetchHF(msg);
      removeTypingIndicator();
      const reply = parseResponse(data);
      addBotMessage(reply);
      history.push({ role: 'assistant', content: reply });
      if (history.length > 20) history = history.slice(-20);
    } catch (err) {
      removeTypingIndicator();
      console.error("[Devansh's AI Twin]", err);
      addErrorMessage("⚠️ Could not reach Devansh's AI Twin.");
    }

    isLoading = false;
    sendBtn.disabled = false;
    input.focus();
  }

  /* ─── Input events ──────────────────────────────────────── */
  sendBtn.addEventListener('click', () => submitMessage(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage(input.value);
    }
  });

})();
// devansh

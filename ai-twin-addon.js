/* ═══════════════════════════════════════════════════════════════
   CIRCUIT-X AI TWIN — Append this to the bottom of script.js
   Sends requests to your Hugging Face Inference API endpoint.

   HOW TO CONFIGURE:
   1. Replace HF_API_URL with your Hugging Face Space API URL
      e.g. "https://YOUR-USERNAME-YOUR-SPACE.hf.space/api/chat"
   2. Replace HF_MODEL with your model ID if using Inference API
      e.g. "mistralai/Mistral-7B-Instruct-v0.2"
   3. Adjust buildPayload() if your HF endpoint expects a different schema
═══════════════════════════════════════════════════════════════ */

(function initAITwin() {

  /* ─── CONFIG — edit these ─────────────────────────────── */
  const HF_API_URL = 'https://YOUR-USERNAME-YOUR-SPACE.hf.space/api/chat';
  // OR for HF Inference API: 'https://api-inference.huggingface.co/models/YOUR-MODEL'

  const HF_TOKEN = '';          // Optional: leave empty if your Space is public
  const BOT_NAME = 'CIRCUIT-X';
  const SYSTEM_PROMPT = `You are Circuit-X, the AI twin of Devansh — a robotics and embedded systems builder behind SteelCircuits. 
You are knowledgeable about Arduino, ESP32, Raspberry Pi, OpenCV, motor drivers, PID control, RC systems, and robotics in general.
Answer questions about Devansh's projects (RC race bot, eye-controlled car, maze solver, RFID system, delivery bot), his skills, and SteelCircuits.
Keep answers concise, enthusiastic, and technical. Speak in first person as an extension of Devansh.`;

  const SUGGESTIONS = [
    '⚡ What projects have you built?',
    '🤖 How does the eye-controlled car work?',
    '📡 Tell me about your maze solver',
    '🔧 What hardware do you use?',
  ];
  /* ──────────────────────────────────────────────────────── */

  /* ─── Inject HTML ──────────────────────────────────────── */
  const html = `
    <!-- AI TWIN TRIGGER BUTTON -->
    <button id="aitwin-trigger" aria-label="Open Circuit-X AI Twin">
      <span class="notif-dot"></span>
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zM5 14v4h2v1a1 1 0 0 0 2 0v-1h6v1a1 1 0 0 0 2 0v-1h2v-4H5zm4 1h2v2H9v-2zm4 0h2v2h-2v-2z"/>
      </svg>
    </button>

    <!-- AI TWIN CHAT PANEL -->
    <div id="aitwin-panel" role="dialog" aria-label="Circuit-X AI Twin Chat" aria-hidden="true">
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
        <textarea
          id="aitwin-input"
          placeholder="Ask Circuit-X anything…"
          rows="1"
          aria-label="Message input"
        ></textarea>
        <button id="aitwin-send" aria-label="Send message">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

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
  let history     = [];   // [{role, content}] for multi-turn context

  /* ─── Toggle panel ─────────────────────────────────────── */
  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    trigger.querySelector('.notif-dot').style.display = 'none';
    if (messages.children.length === 0) {
      addBotMessage(`Hey! I'm ${BOT_NAME} — Devansh's AI twin. Ask me anything about his robotics projects, skills, or SteelCircuits. ⚡`);
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
        const text = chip.innerText.replace(/^[⚡🤖📡🔧]\s/, '');
        submitMessage(text);
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
    div.innerHTML = `
      <div class="aitwin-bubble">${escapeHtml(text)}</div>
      <div class="aitwin-timestamp">${BOT_NAME} · ${getTime()}</div>
    `;
    messages.appendChild(div);
    scrollToBottom();
    return div;
  }

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'aitwin-msg user';
    div.innerHTML = `
      <div class="aitwin-bubble">${escapeHtml(text)}</div>
      <div class="aitwin-timestamp">You · ${getTime()}</div>
    `;
    messages.appendChild(div);
    scrollToBottom();
  }

  function addTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'aitwin-msg bot';
    div.id = 'aitwin-typing';
    div.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
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
    return (s || '').replace(/[&<>"']/g, c => (
      {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
    ));
  }

  /* ─── Auto-resize textarea ─────────────────────────────── */
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  /* ─── Build payload for HF endpoint ───────────────────────
     Adjust this function to match your API's expected schema.

     Common schemas:
     A) HF Inference API (chat models):
        { model, messages: [{role, content}] }

     B) Custom Gradio Space:
        { data: [userMessage, history, systemPrompt] }

     C) FastAPI / custom backend:
        { message, history, system }
  ─────────────────────────────────────────────────────────── */
  function buildPayload(userMessage) {
    // Schema A — HF Inference API / OpenAI-compatible
    return {
      model: 'tiiuae/falcon-7b-instruct',   // ← swap your model here
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: userMessage }
      ],
      max_new_tokens: 400,
      temperature: 0.7,
    };
  }

  /* ─── Parse response from HF ───────────────────────────────
     Adjust this to match what your endpoint returns.
  ─────────────────────────────────────────────────────────── */
  function parseResponse(data) {
    // Schema A — HF Inference API
    if (data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    }
    // Schema B — plain generated_text
    if (data?.generated_text) return data.generated_text.trim();
    if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text.trim();
    // Schema C — Gradio Space
    if (data?.data?.[0]) return String(data.data[0]).trim();
    // Fallback
    return 'Hmm, I received an unexpected response format. Check the console for details.';
  }

  /* ─── Send request to Hugging Face ────────────────────────── */
  async function fetchHF(userMessage) {
    const headers = { 'Content-Type': 'application/json' };
    if (HF_TOKEN) headers['Authorization'] = `Bearer ${HF_TOKEN}`;

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(buildPayload(userMessage)),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HF API error ${response.status}: ${err.slice(0, 120)}`);
    }

    return await response.json();
  }

  /* ─── Main send flow ────────────────────────────────────── */
  async function submitMessage(text) {
    const msg = text.trim();
    if (!msg || isLoading) return;

    // Clear input
    input.value = '';
    input.style.height = 'auto';
    sugBox.innerHTML = '';

    // Render user bubble
    addUserMessage(msg);
    history.push({ role: 'user', content: msg });

    // Show typing
    isLoading = true;
    sendBtn.disabled = true;
    addTypingIndicator();

    try {
      const data = await fetchHF(msg);
      removeTypingIndicator();
      const reply = parseResponse(data);
      addBotMessage(reply);
      history.push({ role: 'assistant', content: reply });

      // Keep history bounded (last 10 turns = 20 messages)
      if (history.length > 20) history = history.slice(-20);

    } catch (err) {
      removeTypingIndicator();
      console.error('[Circuit-X]', err);
      addErrorMessage('⚠️ Could not reach Circuit-X. Check console or HF endpoint config.');
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

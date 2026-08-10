/**
 * Velinova Chat Widget v1.1
 *
 * Usage recommandé (couleurs pilotées depuis le dashboard Velinova) :
 *   <script src="https://VOTRE-DOMAINE/widget/velinova-widget.js"
 *           data-velinova-key="wk_xxx"></script>
 *
 * Usage manuel (sans clé, couleurs figées dans le HTML) :
 *   <script src="https://VOTRE-DOMAINE/widget/velinova-widget.js"
 *           data-velinova-agent="qualification-immobilier"
 *           data-velinova-bg-color="#1a110d"
 *           data-velinova-bot-color="#2d1f17"
 *           data-velinova-user-color="#7a2e26"
 *           data-velinova-position="right"></script>
 *
 * Attributs configurables :
 *   data-velinova-key         — Clé du widget (récupère automatiquement les
 *                                couleurs configurées dans le dashboard, et
 *                                associe les conversations à l'entreprise)
 *   data-velinova-agent       — ID de l'agent, mode legacy sans clé
 *                                (défaut: "qualification-immobilier")
 *   data-velinova-api         — URL de base de l'API (défaut: origine du script)
 *   data-velinova-bg-color    — Couleur de fond du panneau (défaut: "#1a110d")
 *   data-velinova-bot-color   — Couleur des bulles du bot (défaut: "#2d1f17")
 *   data-velinova-user-color  — Couleur des bulles visiteur + accent (défaut: "#7a2e26")
 *   data-velinova-color       — Alias historique de data-velinova-user-color
 *   data-velinova-position    — "right" ou "left" (défaut: "right")
 *   data-velinova-greeting    — Message d'accueil personnalisé (optionnel)
 *
 * Un attribut de couleur explicite dans le HTML est toujours prioritaire sur
 * la config distante — utile pour un aperçu ponctuel différent du dashboard.
 */
(function () {
  "use strict";

  /* ─── Configuration ─────────────────────────────────────── */

  const scriptTag = document.currentScript;
  const scriptSrc = scriptTag?.src || "";
  const scriptOrigin = scriptSrc ? new URL(scriptSrc).origin : "";

  const CONFIG = {
    key: scriptTag?.getAttribute("data-velinova-key") || "",
    agent: scriptTag?.getAttribute("data-velinova-agent") || "qualification-immobilier",
    apiBase: scriptTag?.getAttribute("data-velinova-api") || scriptOrigin,
    colorBg: scriptTag?.getAttribute("data-velinova-bg-color") || "",
    colorBot: scriptTag?.getAttribute("data-velinova-bot-color") || "",
    colorUser:
      scriptTag?.getAttribute("data-velinova-user-color") ||
      scriptTag?.getAttribute("data-velinova-color") || // alias historique
      "",
    position: scriptTag?.getAttribute("data-velinova-position") || "right",
    greeting: scriptTag?.getAttribute("data-velinova-greeting") || "",
  };

  const DEFAULT_COLORS = { bg: "#1a110d", bot: "#2d1f17", user: "#7a2e26" };

  /**
   * Résout les 3 couleurs du widget : attribut HTML explicite > config
   * distante (dashboard, via data-velinova-key) > défaut codé en dur.
   * Ne lève jamais — si le fetch échoue, le widget s'affiche quand même.
   */
  async function resolveColors() {
    let remote = null;
    if (CONFIG.key) {
      try {
        const url = `${CONFIG.apiBase}/api/agent/widget-config?key=${encodeURIComponent(CONFIG.key)}`;
        const res = await fetch(url);
        if (res.ok) {
          const body = await res.json();
          remote = body?.colors || null;
        }
      } catch {
        // Silencieux : pas de config distante, on retombe sur les défauts/attributs.
      }
    }
    return {
      bg: CONFIG.colorBg || remote?.bg || DEFAULT_COLORS.bg,
      bot: CONFIG.colorBot || remote?.bot || DEFAULT_COLORS.bot,
      user: CONFIG.colorUser || remote?.user || DEFAULT_COLORS.user,
    };
  }

  /* ─── Styles (injectés dans le Shadow DOM) ──────────────── */

  function buildStyles(colors) {
    return `
    :host {
      --r-color: ${colors.user};
      --r-color-bright: ${adjustBrightness(colors.user, 30)};
      --r-ink: ${colors.bg};
      --r-ink-soft: ${adjustBrightness(colors.bg, 10)};
      --r-surface: ${colors.bot};
      --r-border: ${adjustBrightness(colors.bg, 30)};
      --r-paper: #f5ebe0;
      --r-paper-dim: #b8a99a;
      --r-status: #4ade80;
      --r-red: #f87171;

      all: initial;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: var(--r-paper);
      -webkit-font-smoothing: antialiased;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .roster-launcher {
      position: fixed;
      bottom: 24px;
      ${CONFIG.position}: 24px;
      z-index: 999998;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--r-color);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px rgba(0,0,0,.3);
      transition: transform 0.2s, background 0.2s;
    }
    .roster-launcher:hover { transform: scale(1.08); background: var(--r-color-bright); }
    .roster-launcher svg { width: 24px; height: 24px; fill: none; stroke: var(--r-ink); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

    .roster-panel {
      position: fixed;
      bottom: 96px;
      ${CONFIG.position}: 24px;
      z-index: 999999;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 560px;
      max-height: calc(100vh - 120px);
      border-radius: 16px;
      border: 1px solid var(--r-border);
      background: var(--r-ink);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 12px 48px rgba(0,0,0,.5);
      opacity: 0;
      transform: translateY(16px) scale(0.96);
      pointer-events: none;
      transition: opacity 0.25s, transform 0.25s;
    }
    .roster-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .roster-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--r-border);
      background: var(--r-ink-soft);
    }
    .roster-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(201,166,107,.2);
      display: flex; align-items: center; justify-content: center;
      font-family: ui-monospace, monospace;
      font-size: 14px; font-weight: 600; color: var(--r-color);
    }
    .roster-agent-info { flex: 1; }
    .roster-agent-name { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .roster-agent-role { font-size: 11px; color: var(--r-paper-dim); }
    .roster-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 12px;
      border: 1px solid rgba(74,222,128,.3); background: rgba(74,222,128,.1);
      font-family: ui-monospace, monospace;
      font-size: 8px; text-transform: uppercase; letter-spacing: .1em; color: var(--r-status);
    }
    .roster-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--r-status); }
    .roster-close {
      width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent;
      cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--r-paper-dim);
      transition: color .15s;
    }
    .roster-close:hover { color: var(--r-paper); }
    .roster-close svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }

    .roster-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .roster-messages::-webkit-scrollbar { width: 4px; }
    .roster-messages::-webkit-scrollbar-track { background: transparent; }
    .roster-messages::-webkit-scrollbar-thumb { background: var(--r-border); border-radius: 4px; }

    .roster-msg {
      max-width: 85%;
      padding: 10px 14px;
      font-size: 13px;
      line-height: 1.55;
      border-radius: 16px;
      word-wrap: break-word;
    }
    .roster-msg-a {
      align-self: flex-start;
      background: var(--r-surface);
      border: 1px solid var(--r-border);
      border-bottom-left-radius: 4px;
      color: var(--r-paper);
    }
    .roster-msg-u {
      align-self: flex-end;
      background: var(--r-color);
      color: var(--r-ink);
      border-bottom-right-radius: 4px;
    }

    .roster-typing {
      align-self: flex-start;
      background: var(--r-surface);
      border: 1px solid var(--r-border);
      border-radius: 16px;
      border-bottom-left-radius: 4px;
      padding: 12px 18px;
      display: flex; gap: 4px;
    }
    .roster-typing span {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--r-paper-dim);
      opacity: .4;
      animation: velinovaBounce .6s infinite alternate;
    }
    .roster-typing span:nth-child(2) { animation-delay: .15s; }
    .roster-typing span:nth-child(3) { animation-delay: .3s; }
    @keyframes velinovaBounce { to { opacity: 1; transform: translateY(-3px); } }

    .roster-input-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-top: 1px solid var(--r-border);
      background: var(--r-ink-soft);
    }
    .roster-input {
      flex: 1;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--r-border);
      background: var(--r-ink);
      color: var(--r-paper);
      font-size: 13px;
      font-family: inherit;
      outline: none;
      transition: border-color .15s;
    }
    .roster-input::placeholder { color: rgba(183,188,203,.4); }
    .roster-input:focus { border-color: var(--r-color); }
    .roster-send {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--r-color); border: none;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s, opacity .15s;
      flex-shrink: 0;
    }
    .roster-send:hover { background: var(--r-color-bright); }
    .roster-send:disabled { opacity: .4; cursor: default; }
    .roster-send svg { width: 14px; height: 14px; fill: none; stroke: var(--r-ink); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

    .roster-prospect {
      margin: 8px 0;
      border: 1px solid var(--r-border);
      border-radius: 12px;
      background: var(--r-surface);
      padding: 14px;
    }
    .roster-prospect-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 12px; }
    .roster-prospect-label { font-family: ui-monospace, monospace; font-size: 9px; text-transform: uppercase; letter-spacing: .15em; color: rgba(183,188,203,.4); }
    .roster-prospect-name { font-size: 15px; font-weight: 600; margin-top: 2px; }
    .roster-q-badge {
      padding: 3px 10px; border-radius: 12px;
      font-family: ui-monospace, monospace; font-size: 9px;
      text-transform: uppercase; letter-spacing: .1em;
    }
    .roster-q-hot { border: 1px solid var(--r-status); background: rgba(74,222,128,.1); color: var(--r-status); }
    .roster-q-warm { border: 1px solid #fbbf24; background: rgba(251,191,36,.1); color: #fbbf24; }
    .roster-q-cold { border: 1px solid var(--r-paper-dim); background: rgba(183,188,203,.1); color: var(--r-paper-dim); }
    .roster-prospect-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .roster-prospect-field dt { font-family: ui-monospace, monospace; font-size: 9px; text-transform: uppercase; letter-spacing: .12em; color: rgba(183,188,203,.4); }
    .roster-prospect-field dd { font-size: 12px; margin-top: 2px; }
    .roster-prospect-summary { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--r-border); }
    .roster-prospect-summary p { font-size: 12px; line-height: 1.55; color: var(--r-paper-dim); margin-top: 4px; }

    .roster-powered {
      text-align: center;
      padding: 6px;
      font-size: 10px;
      color: rgba(183,188,203,.3);
      border-top: 1px solid var(--r-border);
      background: var(--r-ink-soft);
    }
    .roster-powered a { color: var(--r-color); text-decoration: none; }
    .roster-powered a:hover { text-decoration: underline; }

    @media (prefers-reduced-motion: reduce) {
      .roster-panel { transition: none; }
      .roster-launcher { transition: none; }
      .roster-typing span { animation: none; opacity: .6; }
    }
  `;
  }

  /* ─── Helpers ───────────────────────────────────────────── */

  function adjustBrightness(hex, amount) {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === "className") e.className = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v);
    });
    if (children) {
      if (typeof children === "string") e.textContent = children;
      else if (Array.isArray(children)) children.forEach((c) => c && e.appendChild(c));
      else e.appendChild(children);
    }
    return e;
  }

  /* ─── Widget Class ──────────────────────────────────────── */

  class VelinovaWidget {
    constructor(colors) {
      this.messages = [];
      this.conversationId = null;
      this.isOpen = false;
      this.isLoading = false;
      this.prospect = null;

      this.host = el("div");
      this.shadow = this.host.attachShadow({ mode: "closed" });

      const style = el("style");
      style.textContent = buildStyles(colors);
      this.shadow.appendChild(style);

      this.buildUI();
      document.body.appendChild(this.host);

      // Lancer le premier message de l'agent
      this.sendToAgent([{ role: "user", content: "Bonjour" }]);
    }

    buildUI() {
      // Bouton launcher
      this.launcher = el("button", { className: "roster-launcher", "aria-label": "Ouvrir le chat", onClick: () => this.toggle() }, [
        this.createSVG("chat"),
      ]);
      this.shadow.appendChild(this.launcher);

      // Panel
      this.panel = el("div", { className: "roster-panel" });

      // Header
      const header = el("div", { className: "roster-header" }, [
        el("div", { className: "roster-avatar" }, "A"),
        el("div", { className: "roster-agent-info" }, [
          el("div", { className: "roster-agent-name" }, [
            document.createTextNode("Alex"),
            el("span", { className: "roster-badge" }, [
              el("span", { className: "roster-dot" }),
              document.createTextNode(" En ligne"),
            ]),
          ]),
          el("div", { className: "roster-agent-role" }, "Agent de qualification"),
        ]),
        el("button", { className: "roster-close", "aria-label": "Fermer", onClick: () => this.toggle() }, [
          this.createSVG("close"),
        ]),
      ]);

      this.messagesEl = el("div", { className: "roster-messages" });

      // Input bar
      this.inputEl = el("input", { className: "roster-input", placeholder: "Écrivez votre message...", type: "text" });
      this.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.handleSend(); }
      });

      this.sendBtn = el("button", { className: "roster-send", "aria-label": "Envoyer", onClick: () => this.handleSend() }, [
        this.createSVG("send"),
      ]);

      this.inputBar = el("div", { className: "roster-input-bar" }, [this.inputEl, this.sendBtn]);

      // Powered by
      const poweredBy = el("div", { className: "roster-powered" });
      poweredBy.innerHTML = 'Propulsé par <a href="https://velinova.ai" target="_blank" rel="noopener">Velinova</a>';

      this.panel.appendChild(header);
      this.panel.appendChild(this.messagesEl);
      this.panel.appendChild(this.inputBar);
      this.panel.appendChild(poweredBy);
      this.shadow.appendChild(this.panel);
    }

    createSVG(type) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      if (type === "chat") {
        path.setAttribute("d", "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z");
      } else if (type === "close") {
        path.setAttribute("d", "M18 6L6 18M6 6l12 12");
      } else if (type === "send") {
        svg.setAttribute("viewBox", "0 0 16 16");
        path.setAttribute("d", "M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9");
      }
      svg.appendChild(path);
      return svg;
    }

    toggle() {
      this.isOpen = !this.isOpen;
      this.panel.classList.toggle("open", this.isOpen);
      if (this.isOpen) {
        this.scrollToBottom();
        setTimeout(() => this.inputEl.focus(), 300);
      }
    }

    addMessage(role, content) {
      this.messages.push({ role, content });
      const div = el("div", { className: `roster-msg ${role === "user" ? "roster-msg-u" : "roster-msg-a"}` }, content);
      this.messagesEl.appendChild(div);
      this.scrollToBottom();
    }

    showTyping() {
      this.typingEl = el("div", { className: "roster-typing" }, [
        el("span"), el("span"), el("span"),
      ]);
      this.messagesEl.appendChild(this.typingEl);
      this.scrollToBottom();
    }

    hideTyping() {
      if (this.typingEl) { this.typingEl.remove(); this.typingEl = null; }
    }

    showProspect(data) {
      this.prospect = data;

      const qClass = { HOT: "roster-q-hot", WARM: "roster-q-warm", COLD: "roster-q-cold" }[data.qualification] || "roster-q-cold";
      const qLabel = { HOT: "Prospect chaud", WARM: "Prospect tiède", COLD: "Prospect froid" }[data.qualification] || "";

      const fields = [
        ["Projet", data.type_projet],
        ["Bien", data.type_bien],
        ["Lieu", data.localisation],
        ["Surface", data.surface_m2 ? data.surface_m2 + " m²" : null],
        ["Pièces", data.nombre_pieces],
        ["Budget", data.budget],
        ["Délai", data.delai],
        ["Email", data.contact_email],
      ].filter(([, v]) => v);

      const card = el("div", { className: "roster-prospect" });

      const header = el("div", { className: "roster-prospect-header" }, [
        el("div", {}, [
          el("div", { className: "roster-prospect-label" }, "Fiche prospect"),
          el("div", { className: "roster-prospect-name" }, data.prenom || "Prospect"),
        ]),
        el("span", { className: `roster-q-badge ${qClass}` }, qLabel),
      ]);
      card.appendChild(header);

      const grid = el("div", { className: "roster-prospect-grid" });
      fields.forEach(([label, value]) => {
        const field = el("div", { className: "roster-prospect-field" }, [
          el("dt", {}, label),
          el("dd", {}, value),
        ]);
        grid.appendChild(field);
      });
      card.appendChild(grid);

      if (data.resume) {
        const sum = el("div", { className: "roster-prospect-summary" }, [
          el("div", { className: "roster-prospect-label" }, "Résumé"),
          el("p", {}, data.resume),
        ]);
        card.appendChild(sum);
      }

      this.messagesEl.appendChild(card);

      // Masquer la barre de saisie une fois la qualification terminée
      this.inputBar.style.display = "none";

      this.scrollToBottom();
    }

    scrollToBottom() {
      requestAnimationFrame(() => {
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
      });
    }

    handleSend() {
      const text = this.inputEl.value.trim();
      if (!text || this.isLoading) return;
      this.inputEl.value = "";
      this.addMessage("user", text);
      this.sendToAgent(this.messages);
    }

    async sendToAgent(messages) {
      this.isLoading = true;
      this.sendBtn.disabled = true;
      this.showTyping();

      try {
        const res = await fetch(`${CONFIG.apiBase}/api/agent/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            conversationId: this.conversationId,
            ...(CONFIG.key ? { widgetKey: CONFIG.key } : {}),
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        this.conversationId = data.conversationId;
        this.hideTyping();
        this.addMessage("assistant", data.reply);

        if (data.prospect) {
          // Fiche prospect déjà sauvegardée côté serveur dans /api/agent/chat
          this.showProspect(data.prospect);
        }
      } catch (err) {
        this.hideTyping();
        const errDiv = el("div", { className: "roster-msg roster-msg-a" }, "Désolé, une erreur est survenue. Veuillez réessayer.");
        errDiv.style.borderColor = "var(--r-red)";
        this.messagesEl.appendChild(errDiv);
        this.scrollToBottom();
      } finally {
        this.isLoading = false;
        this.sendBtn.disabled = false;
      }
    }
  }

  /* ─── Init ──────────────────────────────────────────────── */

  async function init() {
    const colors = await resolveColors();
    new VelinovaWidget(colors);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

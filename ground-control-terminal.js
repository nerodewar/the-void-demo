(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const directDialogIds = ["groundControlDialog", "finalGroundDialog"];
  const sequenceDialog = document.getElementById("sequenceDialog");
  const sequenceCode = document.getElementById("sequenceCode");
  const sequenceCounter = document.getElementById("sequenceCounter");
  const sequenceTitle = document.getElementById("sequenceTitle");
  const sequenceText = document.getElementById("sequenceText");
  const sequenceButton = document.getElementById("sequenceButton");

  let sessionId = 0;
  let activeSession = null;
  let sequenceCheckQueued = false;
  let sequenceLinkActive = false;
  let lastSequenceSignature = "";

  injectTerminalStyles();

  const wait = (milliseconds) => new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

  function injectTerminalStyles() {
    if (document.getElementById("groundControlTerminalStyles")) return;

    const style = document.createElement("style");
    style.id = "groundControlTerminalStyles";
    style.textContent = `
      dialog.gct-terminal {
        width: min(1120px, 96vw) !important;
        max-width: none !important;
        color: #b9ffd5 !important;
        background: transparent !important;
      }

      dialog.gct-terminal::backdrop {
        background: rgba(0, 0, 0, .96) !important;
        backdrop-filter: blur(3px);
      }

      dialog.gct-terminal .transmission-window,
      dialog.gct-terminal .sequence-window {
        position: relative;
        overflow: hidden;
        width: 100% !important;
        max-width: none !important;
        min-height: min(680px, 88vh);
        color: #b9ffd5 !important;
        border: 1px solid rgba(117, 255, 174, .38) !important;
        background:
          radial-gradient(circle at 50% 45%, rgba(21, 91, 54, .13), transparent 58%),
          #010403 !important;
        box-shadow:
          0 0 0 1px rgba(117, 255, 174, .06) inset,
          0 0 80px rgba(0, 0, 0, .92),
          0 0 34px rgba(53, 255, 132, .08) !important;
      }

      dialog.gct-terminal .transmission-window::before,
      dialog.gct-terminal .sequence-window::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 8;
        pointer-events: none;
        opacity: .2;
        background: repeating-linear-gradient(
          to bottom,
          transparent 0,
          transparent 3px,
          rgba(153, 255, 194, .08) 4px
        );
        mix-blend-mode: screen;
      }

      dialog.gct-terminal .transmission-window::after,
      dialog.gct-terminal .sequence-window::after {
        content: "";
        position: absolute;
        inset: -30% 0;
        z-index: 7;
        pointer-events: none;
        background: linear-gradient(
          to bottom,
          transparent 45%,
          rgba(135, 255, 183, .05) 50%,
          transparent 55%
        );
        animation: gct-screen-scan 7s linear infinite;
      }

      dialog.gct-terminal .transmission-window > header,
      dialog.gct-terminal .transmission-window > footer {
        position: relative;
        z-index: 3;
        color: #80ffb4 !important;
        border-color: rgba(117, 255, 174, .22) !important;
        background: rgba(0, 8, 4, .88) !important;
      }

      dialog.gct-terminal .transmission-window > header h2 {
        color: #d9ffe7 !important;
        text-shadow: 0 0 18px rgba(93, 255, 157, .24);
      }

      dialog.gct-terminal .signal-meter i {
        background: #58f79b !important;
        box-shadow: 0 0 9px rgba(88, 247, 155, .52);
      }

      dialog.gct-terminal .transmission-body {
        position: relative;
        z-index: 2;
        display: block !important;
        overflow: auto;
        max-height: min(560px, 68vh);
        padding: clamp(24px, 4vw, 54px) !important;
        background: transparent !important;
        scrollbar-color: rgba(105, 255, 164, .38) transparent;
      }

      dialog.gct-terminal .transmission {
        position: relative;
        display: block !important;
        margin: 0 0 clamp(24px, 4vh, 42px) !important;
        padding: 0 0 0 25px !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      dialog.gct-terminal .transmission:last-child {
        margin-bottom: 0 !important;
      }

      dialog.gct-terminal .transmission::before {
        content: ">";
        position: absolute;
        left: 0;
        top: 1.75rem;
        color: rgba(116, 255, 172, .68);
        font: 700 .9rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }

      dialog.gct-terminal .transmission span,
      dialog.gct-terminal .gct-sequence-header,
      dialog.gct-terminal .gct-link-status {
        color: #62f6a0 !important;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
        letter-spacing: .14em;
        text-transform: uppercase;
      }

      dialog.gct-terminal .transmission p,
      dialog.gct-terminal #sequenceText {
        min-height: 1.35em;
        margin-top: 10px !important;
        color: #caffdc !important;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
        font-size: clamp(.9rem, 1.55vw, 1.08rem) !important;
        line-height: 1.72 !important;
        letter-spacing: .025em;
        white-space: pre-wrap;
        text-shadow: 0 0 12px rgba(111, 255, 169, .11);
      }

      dialog.gct-terminal .ground-line p {
        color: #9dffc2 !important;
      }

      dialog.gct-terminal .signal-line p {
        color: #ffe6a2 !important;
      }

      dialog.gct-terminal .signal-line span {
        color: #ffc85c !important;
      }

      dialog.gct-terminal .dialog-button {
        color: #caffdc !important;
        border-color: rgba(104, 255, 164, .42) !important;
        background: rgba(7, 40, 22, .42) !important;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
      }

      dialog.gct-terminal .dialog-button:hover,
      dialog.gct-terminal .dialog-button:focus-visible {
        color: #001b0c !important;
        background: #80ffb4 !important;
        box-shadow: 0 0 24px rgba(88, 247, 155, .22) !important;
      }

      dialog.gct-terminal .gct-pending {
        visibility: hidden;
      }

      dialog.gct-terminal .gct-cursor::after {
        content: "▮";
        display: inline-block;
        margin-left: .15em;
        color: #8dffba;
        animation: gct-cursor-blink .72s steps(1, end) infinite;
      }

      dialog.gct-terminal .gct-link-status {
        position: absolute;
        right: clamp(18px, 3vw, 38px);
        bottom: clamp(14px, 2vw, 24px);
        z-index: 6;
        display: flex;
        align-items: center;
        gap: 9px;
        pointer-events: none;
        color: rgba(126, 255, 177, .65) !important;
        font-size: .58rem;
      }

      dialog.gct-terminal .gct-link-status::before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #63ff9f;
        box-shadow: 0 0 12px #63ff9f;
        animation: gct-link-pulse 1.45s ease-in-out infinite;
      }

      #sequenceDialog.gct-terminal .sequence-window {
        display: block !important;
      }

      #sequenceDialog.gct-terminal .sequence-media {
        display: none !important;
      }

      #sequenceDialog.gct-terminal .sequence-copy {
        position: relative;
        z-index: 3;
        display: flex !important;
        flex-direction: column;
        justify-content: center;
        min-height: min(680px, 88vh);
        padding: clamp(34px, 7vw, 92px) !important;
        color: #caffdc !important;
        background: transparent !important;
      }

      #sequenceDialog.gct-terminal .sequence-counter {
        display: none !important;
      }

      #sequenceDialog.gct-terminal .gct-sequence-header {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 20px;
        margin-bottom: clamp(44px, 8vh, 82px);
        padding-bottom: 18px;
        border-bottom: 1px solid rgba(112, 255, 169, .22);
        font-size: clamp(.58rem, .9vw, .72rem);
      }

      #sequenceDialog.gct-terminal #sequenceTitle {
        margin: 0 0 22px !important;
        color: #d9ffe7 !important;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
        font-size: clamp(1.8rem, 5vw, 4.8rem) !important;
        font-weight: 500 !important;
        line-height: .95 !important;
        letter-spacing: .08em !important;
        text-shadow: 0 0 24px rgba(92, 255, 156, .18);
      }

      #sequenceDialog.gct-terminal #sequenceText {
        max-width: 920px;
        margin-bottom: clamp(34px, 6vh, 64px) !important;
      }

      #sequenceDialog.gct-terminal #sequenceButton {
        align-self: flex-start;
      }

      @keyframes gct-cursor-blink {
        0%, 48% { opacity: 1; }
        49%, 100% { opacity: 0; }
      }

      @keyframes gct-screen-scan {
        from { transform: translateY(-25%); }
        to { transform: translateY(25%); }
      }

      @keyframes gct-link-pulse {
        0%, 100% { opacity: .4; transform: scale(.75); }
        50% { opacity: 1; transform: scale(1); }
      }

      @media (max-width: 720px) {
        dialog.gct-terminal .transmission-window,
        dialog.gct-terminal .sequence-window {
          min-height: 92vh;
        }

        dialog.gct-terminal .transmission-body {
          max-height: 70vh;
        }

        #sequenceDialog.gct-terminal .sequence-copy {
          min-height: 92vh;
          padding: 30px 24px !important;
        }

        #sequenceDialog.gct-terminal .gct-sequence-header {
          grid-template-columns: 1fr;
          gap: 8px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        dialog.gct-terminal .transmission-window::after,
        dialog.gct-terminal .sequence-window::after,
        dialog.gct-terminal .gct-cursor::after,
        dialog.gct-terminal .gct-link-status::before {
          animation: none !important;
        }
      }
    `;

    document.head.append(style);
  }

  function addLinkStatus(dialog, message = "ENCRYPTED CARRIER ACTIVE") {
    const windowElement = dialog.querySelector(".transmission-window, .sequence-window");
    if (!windowElement) return;

    let status = windowElement.querySelector(".gct-link-status");
    if (!status) {
      status = document.createElement("div");
      status.className = "gct-link-status";
      status.setAttribute("aria-hidden", "true");
      windowElement.append(status);
    }
    status.textContent = message;
  }

  function getOriginalText(element) {
    const currentText = element.textContent || "";
    if (!element.dataset.gctOriginalText || currentText.trim()) {
      element.dataset.gctOriginalText = currentText;
    }
    return element.dataset.gctOriginalText || "";
  }

  function prepareElements(elements) {
    return elements
      .filter(Boolean)
      .map((element) => ({
        element,
        text: getOriginalText(element),
        fast: element.matches("span, h2")
      }))
      .filter((item) => item.text.length > 0);
  }

  function resetElements(items) {
    items.forEach(({ element }) => {
      element.classList.remove("gct-cursor");
      element.classList.add("gct-pending");
      element.textContent = "";
    });
  }

  function restoreElements(items) {
    items.forEach(({ element, text }) => {
      element.classList.remove("gct-pending", "gct-cursor");
      element.textContent = text;
    });
  }

  function finishActiveSession() {
    if (!activeSession) return;
    activeSession.cancelled = true;
    restoreElements(activeSession.items);
    activeSession.button.textContent = activeSession.originalButtonText;
    activeSession.button.removeAttribute("aria-label");
    activeSession.running = false;
  }

  function cancelActiveSession({ restore = true } = {}) {
    if (!activeSession) return;
    activeSession.cancelled = true;
    if (restore) restoreElements(activeSession.items);
    activeSession.button.textContent = activeSession.originalButtonText;
    activeSession.button.removeAttribute("aria-label");
    activeSession = null;
    sessionId += 1;
  }

  async function typeElement(item, session) {
    const { element, text, fast } = item;
    element.classList.remove("gct-pending");
    element.classList.add("gct-cursor");

    if (reducedMotion) {
      element.textContent = text;
      element.classList.remove("gct-cursor");
      return;
    }

    const characters = Array.from(text);
    const baseDelay = fast ? 7 : 15;

    for (let index = 0; index < characters.length; index += 1) {
      if (session.cancelled || activeSession !== session) return;
      element.textContent += characters[index];

      const character = characters[index];
      const punctuationPause = /[.!?]/.test(character) ? 70 : /[,;:]/.test(character) ? 34 : 0;
      await wait(baseDelay + punctuationPause);
    }

    element.classList.remove("gct-cursor");
  }

  async function runTypingSession({ dialog, items, button, signature = "", statusText }) {
    cancelActiveSession();

    const session = {
      id: ++sessionId,
      dialog,
      items,
      button,
      signature,
      originalButtonText: button.textContent,
      cancelled: false,
      running: true
    };

    activeSession = session;
    dialog.classList.add("gct-terminal");
    addLinkStatus(dialog, statusText);
    resetElements(items);

    button.disabled = false;
    button.textContent = reducedMotion ? session.originalButtonText : "SKIP TRANSMISSION";
    button.setAttribute("aria-label", reducedMotion ? session.originalButtonText : "Skip typed transmission");

    if (!reducedMotion) await wait(300);

    for (const item of items) {
      if (session.cancelled || activeSession !== session) return;
      await typeElement(item, session);
      if (!reducedMotion) await wait(item.fast ? 90 : 230);
    }

    if (session.cancelled || activeSession !== session) return;

    restoreElements(items);
    button.textContent = session.originalButtonText;
    button.removeAttribute("aria-label");
    session.running = false;
  }

  function handleTerminalButtonClick(event) {
    if (!activeSession || activeSession.button !== event.currentTarget || !activeSession.running) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    finishActiveSession();
  }

  function startDirectDialog(dialog) {
    const button = dialog.querySelector("footer button");
    if (!button) return;

    const elements = Array.from(dialog.querySelectorAll(".transmission span, .transmission p"));
    const items = prepareElements(elements);
    if (!items.length) return;

    button.addEventListener("click", handleTerminalButtonClick, true);
    runTypingSession({
      dialog,
      items,
      button,
      statusText: dialog.id === "finalGroundDialog" ? "DEGRADED CARRIER LOCKED" : "ENCRYPTED CARRIER ACTIVE"
    });
  }

  function directDialogObserver(dialog) {
    const observer = new MutationObserver(() => {
      if (dialog.open) {
        window.requestAnimationFrame(() => startDirectDialog(dialog));
      } else {
        if (activeSession?.dialog === dialog) cancelActiveSession();
        dialog.classList.remove("gct-terminal");
      }
    });

    observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
  }

  function ensureSequenceHeader() {
    if (!sequenceDialog) return null;
    const copy = sequenceDialog.querySelector(".sequence-copy");
    if (!copy) return null;

    let header = copy.querySelector(".gct-sequence-header");
    if (!header) {
      header = document.createElement("div");
      header.className = "gct-sequence-header";
      header.setAttribute("aria-hidden", "true");
      header.innerHTML = '<span class="gct-sequence-code"></span><span class="gct-sequence-count"></span>';
      copy.prepend(header);
    }

    const codeElement = header.querySelector(".gct-sequence-code");
    const countElement = header.querySelector(".gct-sequence-count");
    codeElement.textContent = sequenceCode?.textContent || "DEEP SPACE RELAY";
    countElement.textContent = sequenceCounter?.textContent || "";
    return { header, codeElement, countElement };
  }

  function sequenceSignature() {
    return [
      sequenceCode?.textContent,
      sequenceCounter?.textContent,
      sequenceTitle?.textContent,
      sequenceText?.textContent
    ].join("\u241f");
  }

  function sequenceLooksLikeGroundControl() {
    if (!sequenceDialog?.open) return false;
    if (sequenceDialog.classList.contains("is-communication-sequence")) return true;
    if (sequenceLinkActive) return true;

    const content = [
      sequenceCode?.textContent,
      sequenceTitle?.textContent,
      sequenceText?.textContent
    ].join(" ").toUpperCase();

    return /(GROUND CONTROL|EARTH RELAY|NO CARRIER|INCOMING TRANSMISSION|AUTHENTICATION PENDING)/.test(content);
  }

  function maybeStartSequenceTerminal() {
    sequenceCheckQueued = false;
    if (!sequenceDialog?.open) return;
    if (!sequenceLooksLikeGroundControl()) return;

    sequenceLinkActive = true;
    const signature = sequenceSignature();

    if (activeSession?.dialog === sequenceDialog && activeSession.signature === signature) return;
    if (!activeSession?.running && lastSequenceSignature === signature) return;

    const header = ensureSequenceHeader();
    const items = prepareElements([header?.codeElement, header?.countElement, sequenceTitle, sequenceText]);
    if (!items.length || !sequenceButton) return;

    lastSequenceSignature = signature;
    sequenceButton.addEventListener("click", handleTerminalButtonClick, true);

    runTypingSession({
      dialog: sequenceDialog,
      items,
      button: sequenceButton,
      signature,
      statusText: /NO CARRIER/i.test(sequenceCode?.textContent || "")
        ? "CARRIER SEARCH ACTIVE"
        : "DEEP SPACE RELAY ACTIVE"
    });
  }

  function queueSequenceCheck() {
    if (activeSession?.dialog === sequenceDialog && activeSession.running) return;
    if (sequenceCheckQueued) return;
    sequenceCheckQueued = true;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(maybeStartSequenceTerminal);
    });
  }

  if (sequenceDialog) {
    const resetSequenceTerminal = () => {
      if (activeSession?.dialog === sequenceDialog) cancelActiveSession();
      if (sequenceDialog.classList.contains("gct-terminal")) {
        sequenceDialog.classList.remove("gct-terminal");
      }
      sequenceLinkActive = false;
      lastSequenceSignature = "";
      sequenceCheckQueued = false;
    };

    // Observe only the dialog's open state. Watching its class or typed text
    // creates a feedback loop because this enhancement changes both itself.
    const sequenceObserver = new MutationObserver(() => {
      if (sequenceDialog.open) queueSequenceCheck();
      else resetSequenceTerminal();
    });

    sequenceObserver.observe(sequenceDialog, {
      attributes: true,
      attributeFilter: ["open"]
    });

    // The game's own sequence handler runs first because script.js loads before
    // this file. Check again after it advances to the next transmission frame.
    sequenceButton?.addEventListener("click", () => {
      window.setTimeout(queueSequenceCheck, 0);
    });

    document.addEventListener("keydown", (event) => {
      if (!sequenceDialog.open) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      window.setTimeout(queueSequenceCheck, 0);
    });
  }

  directDialogIds.forEach((id) => {
    const dialog = document.getElementById(id);
    if (dialog) directDialogObserver(dialog);
  });
})();

// SonicBloom Seamless Terminal Content Engine
class ContentEngine {
  constructor() {
    this.viewport = document.getElementById('terminal-viewport');
    this.terminalStatus = document.getElementById('terminal-status-tag');
    this.terminalTitle = document.getElementById('terminal-file-title');
    this.defaultDeckHTML = '';
  }

  init() {
    if (!this.viewport) return;
    this.defaultDeckHTML = this.viewport.innerHTML; // Cache default project cards
    this.bindLinks();
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.path) {
        this.loadContent(e.state.path, e.state.title, false);
      } else {
        this.restoreProjectDeck(false);
      }
    });
  }

  bindLinks() {
    document.querySelectorAll('[data-content-path]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const path = link.getAttribute('data-content-path');
        const title = link.getAttribute('data-content-title') || 'system-node.sys';
        
        // Highlight active link in sidebar
        document.querySelectorAll('.tree-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        if (path === 'PROJECT_DECK') {
          this.restoreProjectDeck(true);
        } else {
          this.loadContent(path, title, true);
        }
      });
    });
  }

  async loadContent(path, title, pushState = true) {
    this.setLoadingState(title);

    try {
      const resp = await fetch(path);
      if (!resp.ok) throw new Error(`HTTP Error ${resp.status}`);
      const rawHtml = await resp.text();

      // Extract article payload from returned HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');
      const articleBody = doc.querySelector('.sonicbloom-article-body') || doc.querySelector('.content-frame') || doc.body;

      // Render within Terminal Frame
      this.viewport.innerHTML = `
        <div class="rendered-article-container">
          <div class="terminal-article-nav">
            <button class="btn-terminal-back" onclick="window.contentEngine.restoreProjectDeck(true)">
              &larr; Return to Workspace Deck
            </button>
            <span class="badge-source">SOURCE: ${path}</span>
          </div>
          <div class="article-markdown-body">
            ${articleBody.innerHTML}
          </div>
        </div>
      `;

      if (this.terminalTitle) this.terminalTitle.innerText = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.sys`;
      if (this.terminalStatus) {
        this.terminalStatus.innerText = "PARSED";
        this.terminalStatus.style.color = "var(--rate-green)";
      }

      if (pushState) {
        history.pushState({ path, title }, title, `#${path.replace(/[^a-zA-Z0-9]/g, '-')}`);
      }

      // Scroll smoothly to top of terminal
      this.viewport.scrollTop = 0;

    } catch (err) {
      console.error("[CONTENT-ENGINE] Retrieval error:", err);
      this.viewport.innerHTML = `
        <div class="terminal-error-box">
          <h3>[DATA_STREAM_UNAVAILABLE]</h3>
          <p>The requested knowledge node could not be parsed from repository records.</p>
          <button class="btn-terminal-back" onclick="window.contentEngine.restoreProjectDeck(true)">&larr; Return to Projects Deck</button>
        </div>
      `;
    }
  }

  restoreProjectDeck(pushState = true) {
    this.viewport.innerHTML = this.defaultDeckHTML;
    if (this.terminalTitle) this.terminalTitle.innerText = "infrastructure-deck.sys";
    if (this.terminalStatus) {
      this.terminalStatus.innerText = "ONLINE";
      this.terminalStatus.style.color = "var(--rate-green)";
    }
    document.querySelectorAll('.tree-link').forEach(l => l.classList.remove('active'));
    const defaultTab = document.querySelector('[data-content-path="PROJECT_DECK"]');
    if (defaultTab) defaultTab.classList.add('active');

    if (pushState) {
      history.pushState(null, 'SonicBloom Workspace', window.location.pathname);
    }
  }

  setLoadingState(title) {
    if (this.terminalStatus) {
      this.terminalStatus.innerText = "STREAMING...";
      this.terminalStatus.style.color = "var(--brand-orange)";
    }
    this.viewport.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: var(--terminal-text-muted); font-family: 'Space Mono', monospace; gap: 12px;">
        <div style="font-size: 1.5rem; animation: pulse 1s infinite;">⚡️</div>
        <div>STREAMING_NODE: [${title}]</div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.contentEngine = new ContentEngine();
  window.contentEngine.init();
});

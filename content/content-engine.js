// SonicBloom Seamless Terminal Content Engine
class ContentEngine {
  constructor() {
    this.viewport = document.getElementById('terminal-viewport');
    this.terminalStatus = document.getElementById('terminal-status-tag');
    this.terminalTitle = document.getElementById('terminal-file-title');
    this.defaultDeckHTML = '';
    this.manifestData = { articles: [], nodes: [], faqs: [] };
  }

  init() {
    if (!this.viewport) return;
    this.defaultDeckHTML = this.viewport.innerHTML; 
    
    // Load dynamic sidebar content
    this.loadManifest();
    
    // Bind internal viewport links (Intercepts clicks on related nodes/FAQs)
    this.bindViewportInterception();
    
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.path) {
        this.loadContent(e.state.path, e.state.title, false);
      } else {
        this.restoreProjectDeck(false);
      }
    });
  }

  async loadManifest() {
    try {
      const resp = await fetch(`/content/manifest.json?v=${new Date().getTime()}`);
      if (!resp.ok) throw new Error("Manifest not found");
      this.manifestData = await resp.json();
      this.renderSidebar(this.manifestData);
    } catch (err) {
      console.warn("[CONTENT-ENGINE] Manifest offline. Retaining staged outline.");
      const list = document.getElementById('dynamic-content-list');
      if (list && list.innerHTML.includes('Awaiting sync')) {
        list.innerHTML = `<li><span class="tree-link" style="color:var(--terminal-text-muted);">Sync Failed. Running Local.</span></li>`;
      }
    }
  }

  renderSidebar(manifest) {
    const list = document.getElementById('dynamic-content-list');
    if (!list) return;
    list.innerHTML = ''; // Clear default state

    // Combine all manifest categories for the sidebar
    const allContent = [
      ...(manifest.articles || []),
      ...(manifest.nodes || []),
      ...(manifest.faqs || [])
    ];

    allContent.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'tree-link';
      a.innerText = item.title;
      a.onclick = () => this.loadContent(item.path, item.title, true);
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  // >>> NEW ROUTING LOGIC FOR RELATED CONTENT BLOCKS <<<
  bindViewportInterception() {
    this.viewport.addEventListener('click', (e) => {
      // Find the closest anchor tag click
      const target = e.target.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');

      // If it's an internal hash link (e.g., #ai-training-pay-scale)
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const slug = href.substring(1);
        this.navigateBySlug(slug);
      }
    });
  }

  navigateBySlug(slug) {
    // Search through the saved manifest data to find the matching path
    let targetItem = null;
    ['articles', 'nodes', 'faqs'].forEach(category => {
      if (!targetItem && this.manifestData[category]) {
        targetItem = this.manifestData[category].find(item => item.slug === slug);
      }
    });

    if (targetItem) {
      this.loadContent(targetItem.path, targetItem.title, true);
    } else {
      console.error(`[CONTENT-ENGINE] Slug '${slug}' not found in manifest.`);
      this.setLoadingState("ERROR_404: Node Unresolved");
      setTimeout(() => this.restoreProjectDeck(false), 2000);
    }
  }
  // >>> END NEW ROUTING LOGIC <<<

  setLoadingState(title) {
    if (this.terminalStatus) {
      this.terminalStatus.innerText = "STREAMING...";
      this.terminalStatus.style.color = "var(--brand-orange)";
    }
    this.viewport.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: var(--terminal-text-muted); font-family: 'Space Mono', monospace; gap: 12px;">
        <div style="font-size: 1.5rem; animation: pulse 1s infinite;">⚡️</div>
        <div>${title || 'STREAMING_NODE...'}</div>
      </div>
    `;
  }

  async loadContent(path, title, pushState = true) {
    this.setLoadingState();
    
    // Remove active state from sidebar links
    document.querySelectorAll('.tree-link').forEach(l => l.classList.remove('active'));

    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error("Network response was not ok");
      const htmlContent = await response.text();

      if (this.terminalTitle) this.terminalTitle.innerText = title || path.split('/').pop();
      if (this.terminalStatus) {
        this.terminalStatus.innerText = "ONLINE";
        this.terminalStatus.style.color = "var(--rate-green)";
      }

      this.viewport.innerHTML = `
        <div class="rendered-article-container" style="animation: fadeIn 0.3s ease;">
          <div class="terminal-article-nav">
            <button class="btn-terminal-back" onclick="window.contentEngine.restoreProjectDeck(true)">&larr; Return to Workspace Deck</button>
            <span class="badge-source">SOURCE: ${path.split('/').pop()}</span>
          </div>
          ${htmlContent}
        </div>
      `;

      if (pushState) {
        history.pushState({ path, title }, title, window.location.pathname);
      }
    } catch (error) {
      console.error('Content fetch failed:', error);
      this.viewport.innerHTML = `
        <div style="color: #ef4444; padding: 20px; font-family: 'Space Mono', monospace;">
          [ERROR] Node unreachable or connection refused.
          <br><br>
          <button class="btn-terminal-back" onclick="window.contentEngine.restoreProjectDeck(true)">&larr; Return to Workspace Deck</button>
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
}

// Initialize the engine
document.addEventListener('DOMContentLoaded', () => {
  window.contentEngine = new ContentEngine();
  window.contentEngine.init();
});

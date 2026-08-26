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
    this.defaultDeckHTML = this.viewport.innerHTML; 
    
    // Load dynamic sidebar content first
    this.loadManifest();
    
    // Bind existing hardcoded links (like LabMatch and Workspace Deck)
    this.bindLinks();
    
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
      const manifest = await resp.json();
      this.renderSidebar(manifest); // Overwrites staged links with live ones
    } catch (err) {
      console.warn("[CONTENT-ENGINE] Manifest offline. Retaining staged outline.");
      
      // FIX: Replace "Awaiting sync..." so the UI doesn't look infinitely stuck
      const list = document.getElementById('dynamic-content-list');
      if (list && list.innerHTML.includes('Awaiting sync')) {
         list.innerHTML = `<li><span class="tree-link" style="color:#ef4444;">[Sync Failed: Offline Mode]</span></li>`;
      }

      // Visually indicate to the user that the backend is currently failing
      document.querySelectorAll('.status-badge').forEach(badge => {
        badge.innerText = "OFFLINE";
        badge.style.color = "#ef4444";
        badge.style.background = "rgba(239, 68, 68, 0.1)";
      });
    } finally {
      // CRITICAL FIX: Always drop the loading overlay so the page becomes clickable,
      // even if the manifest fetch completely failed.
      const syncOverlay = document.getElementById('sync-overlay');
      if (syncOverlay) {
        syncOverlay.style.display = 'none';
      }
    }
  }

  renderSidebar(manifest) {
    const list = document.getElementById('dynamic-content-list');
    if (!list) return;

    // Combine Articles and Nodes arrays
    const allContent = [...(manifest.articles || []), ...(manifest.nodes || [])];
    
    if (allContent.length === 0) {
      list.innerHTML = `<li><span class="tree-link" style="color:var(--terminal-text-muted);">No entries found.</span></li>`;
      return;
    }

    let html = '';
    allContent.forEach(item => {
      // Keep titles short for the sidebar
      const shortTitle = item.title.length > 28 ? item.title.substring(0, 28) + '...' : item.title;
      html += `
        <li>
          <a class="tree-link" data-content-path="${item.path}" data-content-title="${item.title}">
            ${shortTitle}
          </a>
        </li>
      `;
    });

    list.innerHTML = html;
    
    // Re-bind the click event listeners now that new DOM elements exist
    this.bindLinks();
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

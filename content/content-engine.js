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
    list.innerHTML = ''; 

    // Helper to create category sub-folders using user-facing terms
    const createCategoryFolder = (title, items) => {
      if (!items || items.length === 0) return;
      
      const folderHeader = document.createElement('div');
      folderHeader.className = 'tree-folder-title';
      folderHeader.style.cssText = "font-family: 'Space Mono', monospace; font-size: 0.65rem; color: var(--brand-orange); text-transform: uppercase; margin: 10px 0 4px 4px; letter-spacing: 0.5px;";
      folderHeader.innerText = `// ${title}`;
      list.appendChild(folderHeader);

      items.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'tree-link';
        a.innerText = item.title;
        a.onclick = () => this.loadContent(item.path, item.title, true);
        li.appendChild(a);
        list.appendChild(li);
      });
    };

    // Render categorized groups with user-facing nomenclature mapped to legacy manifest arrays
    createCategoryFolder("Reports", manifest.articles);
    createCategoryFolder("Concepts", manifest.nodes);
    createCategoryFolder("FAQs", manifest.faqs);
  }

  renderCardGrid(manifest) {
    if (!this.cardGrid) return;
    this.cardGrid.innerHTML = ''; 

    const buildGalleryCard = (item, tag, tagColor) => `
      <div class="hub-gallery-card" style="display: flex; flex-direction: column; background: #0d121f; border: 1px solid var(--terminal-border, #1e293b); border-radius: 8px; padding: 24px; transition: all 0.2s ease; cursor: pointer; text-decoration: none;" 
           onclick="window.location.href='${item.path}'" 
           onmouseover="this.style.borderColor='${tagColor}'; this.style.transform='translateY(-4px)'; this.style.boxShadow='0 10px 25px rgba(0,0,0,0.2)';" 
           onmouseout="this.style.borderColor='var(--terminal-border, #1e293b)'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
        
        <div style="font-family: 'Space Mono', monospace; font-size: 0.7rem; font-weight: 700; color: ${tagColor}; margin-bottom: 12px; letter-spacing: 1px;">
          [ ${tag} ]
        </div>
        
        <h3 style="font-size: 1.25rem; font-weight: 600; color: #f8fafc; margin-bottom: 12px; line-height: 1.3;">
          ${item.title}
        </h3>
        
        <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin-bottom: 24px; flex-grow: 1;">
          ${item.description || 'Access full technical specifications and operational data metrics inside this module.'}
        </p>
        
        <div style="font-family: 'Space Mono', monospace; font-size: 0.8rem; font-weight: 700; color: ${tagColor}; display: flex; align-items: center; gap: 8px; margin-top: auto;">
          INITIALIZE STREAM <span style="font-size: 1.2rem;">&rarr;</span>
        </div>
      </div>
    `;

    // Draw using user-facing tags
    if (manifest.articles) {
      manifest.articles.forEach(i => this.cardGrid.innerHTML += buildGalleryCard(i, 'REPORT', 'var(--brand-accent, #ff6a00)'));
    }
    if (manifest.nodes) {
      manifest.nodes.forEach(i => this.cardGrid.innerHTML += buildGalleryCard(i, 'CONCEPT', '#3b82f6'));
    }
    if (manifest.faqs) {
      manifest.faqs.forEach(i => this.cardGrid.innerHTML += buildGalleryCard(i, 'FAQ', '#10b981'));
    }
  }

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

toggleKnowledgeMap() {
    let modal = document.getElementById('knowledge-map-modal');
    if (modal) {
      modal.remove(); // Toggle off if already open
      return;
    }

    // Build the Overlay Modal
    modal = document.createElement('div');
    modal.id = 'knowledge-map-modal';
    modal.style.cssText = "position: absolute; top: 50px; left: 20px; right: 20px; bottom: 20px; background: rgba(9, 13, 22, 0.95); border: 1px solid var(--brand-orange); border-radius: 8px; z-index: 1000; padding: 24px; display: flex; flex-direction: column; backdrop-filter: blur(8px); box-shadow: 0 25px 50px rgba(0,0,0,0.8);";

    let htmlContent = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--terminal-border); padding-bottom: 12px; margin-bottom: 16px;">
        <h3 style="font-family: 'Space Mono', monospace; font-size: 1rem; color: var(--brand-orange);">&gt; REPOSITORY_TOPOLOGY_MAP</h3>
        <button onclick="document.getElementById('knowledge-map-modal').remove()" style="background: transparent; border: 1px solid var(--terminal-border); color: #fff; padding: 4px 8px; cursor: pointer; border-radius: 4px;">[ CLOSE ]</button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; overflow-y: auto; flex-grow: 1; padding-right: 8px;">
    `;

    // Map articles/nodes and their connected relationships
    const articles = this.manifestData.articles || [];
    const nodes = this.manifestData.nodes || [];
    const faqs = this.manifestData.faqs || [];

    articles.forEach(art => {
      const relatedFaqs = faqs.filter(f => f.path.includes(art.slug) || (f.targetSlug && f.targetSlug === art.slug));
      htmlContent += `
        <div style="background: var(--terminal-card); border: 1px solid var(--terminal-border); border-radius: 6px; padding: 16px; display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 0.65rem; color: var(--brand-orange); font-family: 'Space Mono', monospace;">[CORE ARTICLE]</div>
          <a href="#" onclick="window.contentEngine.loadContent('${art.path}', '${art.title}', true); document.getElementById('knowledge-map-modal').remove(); return false;" style="color: #f8fafc; font-weight: 600; text-decoration: none; font-size: 0.95rem;">${art.title}</a>
          <div style="font-size: 0.75rem; color: var(--terminal-text-muted); margin-top: auto; border-top: 1px dashed var(--terminal-border); pt: 8px;">
            Linked FAQs: ${relatedFaqs.length > 0 ? relatedFaqs.map(f => f.title).join(', ') : 'None mapped'}
          </div>
        </div>
      `;
    });

    htmlContent += `</div>`;
    modal.innerHTML = htmlContent;
    
    // Append modal inside the terminal window container
    const terminalWindow = document.querySelector('.terminal-window');
    if (terminalWindow) {
      terminalWindow.style.position = 'relative';
      terminalWindow.appendChild(modal);
    }
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

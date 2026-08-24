/**
 * SonicBloom Content & Node Query Engine
 * Ingests manifest.json to dynamically populate related nodes and interactive elements.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('related-nodes-grid');
  if (!container) return;

  try {
    const res = await fetch('/content/manifest.json');
    if (!res.ok) throw new Error('Failed to load content manifest');
    const manifest = await res.json();

    // 1. Render recent semantic nodes
    if (manifest.nodes && manifest.nodes.length > 0) {
      container.innerHTML = manifest.nodes.slice(-4).map(node => `
        <div class="node-card">
          <h4>${node.title}</h4>
          <p>${node.abstract || ''}</p>
          <a href="/content/nodes/${node.id}.html">Read Node Analysis &rarr;</a>
        </div>
      `).join('');
    }
  } catch (err) {
    console.warn('[CONTENT ENGINE] Could not dynamically load related nodes:', err);
  }
});

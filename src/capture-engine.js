// SonicBloom Data Capture & Ingestion Engine
// Handles telemetry, AST density evaluation, and route loading mechanics

const API_ENDPOINT = 'https://api.sonicbloom.dev/v1/ingest';

async function routeSystemPage(targetKey) {
  console.log(`[ROUTER] Loading execution node: ${targetKey}`);
  try {
    const response = await fetch(`/config/routing-map.json`);
    const map = await response.json();
    
    // Target validation check
    const route = map.system_routes.nodes[targetKey] || 
                  map.system_routes.essays[targetKey] || 
                  map.system_routes.faq[targetKey];
                  
    if (!route || route.status === 'pending_specification') {
      console.warn(`[ROUTER] Route key "${targetKey}" resolves to TBD map constraint.`);
      return;
    }
    
    // Execute asynchronous injection into master viewport container
    const contentResp = await fetch(`/${route.path}`);
    document.getElementById('primary-viewport').innerHTML = await contentResp.text();
  } catch (err) {
    console.error(`[CRITICAL] Routing resolution failed for vector ${targetKey}:`, err);
  }
}

function processCapturePayload(formElement) {
  const payload = {
    timestamp: new Date().toISOString(),
    session_id: crypto.randomUUID(),
    input_payload: formElement.value,
    semantic_diversity: calculateLocalLexicalDensity(formElement.value)
  };
  
  if (payload.semantic_diversity < 0.72) {
    console.warn(`[PRUNED] Input density falls below threshold: ${payload.semantic_diversity}`);
    return null;
  }
  
  return payload;
}

function calculateLocalLexicalDensity(text) {
  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  return new Set(tokens).size / tokens.length;
}
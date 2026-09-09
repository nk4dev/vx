import { SDK_VERSION } from '../config';
import { escapeHtml, toSafeInlineJson } from '../libs/html';

interface DashViewOptions {
  host: string;
  port: number;
  rpcList: Array<{ host?: string; port?: number; protocol?: string; rpcUrl?: string; type?: string }>;
  rpcUrl?: string;
}

export default function dashViewBuilder({ host, port, rpcList, rpcUrl }: DashViewOptions): string {
  const rpcListJson = toSafeInlineJson(rpcList || []);
  const rpcUrlJson = toSafeInlineJson(rpcUrl || '');
  const versionJson = toSafeInlineJson(SDK_VERSION);
  const safeHost = escapeHtml(host);
  const safePort = escapeHtml(port);
  const safeRpcUrl = escapeHtml(rpcUrl || '—');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VX3 Dashboard</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0d0f14;
      --bg2: #141720;
      --bg3: #1c2030;
      --border: #252a3a;
      --accent: #4ade80;
      --accent2: #38bdf8;
      --warn: #fb923c;
      --err: #f87171;
      --text: #e2e8f0;
      --muted: #64748b;
      --muted2: #94a3b8;
      --mono: 'Menlo', 'Consolas', 'Monaco', monospace;
    }
    html, body { height: 100%; }
    body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.5; }
    a { color: var(--accent2); text-decoration: none; }
    a:hover { text-decoration: underline; }
    code, .mono { font-family: var(--mono); font-size: 12px; }

    /* Layout */
    .topbar { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 0 20px; height: 52px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 10; }
    .topbar-logo { font-size: 16px; font-weight: 700; letter-spacing: 0.05em; color: var(--accent); }
    .topbar-version { font-size: 11px; color: var(--muted); font-family: var(--mono); }
    .topbar-sep { flex: 1; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .status-dot.live { background: var(--accent); box-shadow: 0 0 6px var(--accent); animation: pulse 2s ease-in-out infinite; }
    .status-dot.err { background: var(--err); }
    .status-dot.idle { background: var(--muted); }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .topbar-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted2); }
    .topbar-nav { display: flex; gap: 16px; font-size: 12px; }

    .page { display: grid; grid-template-columns: 280px 1fr; grid-template-rows: auto 1fr; min-height: calc(100vh - 52px); }
    .sidebar { background: var(--bg2); border-right: 1px solid var(--border); padding: 16px; overflow-y: auto; }
    .main { padding: 20px; overflow-y: auto; }

    /* Cards */
    .card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .card-title { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }

    /* Stats row */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .page { grid-template-columns: 1fr; } }
    .stat-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; }
    .stat-label { font-size: 11px; color: var(--muted); margin-bottom: 6px; letter-spacing: 0.05em; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: 700; font-family: var(--mono); line-height: 1; }
    .stat-value.green { color: var(--accent); }
    .stat-value.blue { color: var(--accent2); }
    .stat-value.orange { color: var(--warn); }
    .stat-sub { font-size: 11px; color: var(--muted); margin-top: 4px; font-family: var(--mono); }
    .flash { animation: flash 0.4s ease; }
    @keyframes flash { 0% { color: var(--accent); } 100% { } }

    /* Two-column content */
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } }

    /* RPC list */
    .rpc-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; background: var(--bg2); border: 1px solid var(--border); margin-bottom: 8px; transition: border-color 0.2s; cursor: default; }
    .rpc-item:hover { border-color: var(--accent2); }
    .rpc-url { font-family: var(--mono); font-size: 12px; color: var(--text); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .rpc-type { font-size: 10px; color: var(--muted); font-family: var(--mono); text-transform: uppercase; }
    .copy-btn { font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--muted2); cursor: pointer; flex-shrink: 0; transition: color 0.15s, border-color 0.15s; }
    .copy-btn:hover { color: var(--accent); border-color: var(--accent); }

    /* Event log */
    .log-area { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px; height: 220px; overflow-y: auto; font-family: var(--mono); font-size: 12px; }
    .log-line { padding: 2px 0; border-bottom: 1px solid #1a1f2e; color: var(--muted2); }
    .log-line:last-child { border-bottom: none; }
    .log-line .ts { color: var(--muted); margin-right: 8px; }
    .log-line .tag { margin-right: 6px; font-weight: 600; }
    .tag-block { color: var(--accent); }
    .tag-gas { color: var(--accent2); }
    .tag-err { color: var(--err); }
    .tag-info { color: var(--warn); }

    /* Gas table */
    .gas-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border); font-family: var(--mono); font-size: 13px; }
    .gas-row:last-child { border-bottom: none; }
    .gas-label { color: var(--muted2); }
    .gas-val { color: var(--accent2); font-weight: 600; }

    /* Endpoints */
    .ep-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 12px; font-family: var(--mono); }
    .ep-item:last-child { border-bottom: none; }
    .ep-method { font-size: 10px; font-weight: 700; color: var(--bg); background: var(--accent2); border-radius: 3px; padding: 1px 5px; flex-shrink: 0; }
    .ep-method.post { background: var(--warn); }
    .ep-path { color: var(--text); flex: 1; }
    .ep-desc { color: var(--muted); font-size: 11px; }

    /* Sidebar sections */
    .sidebar-section { margin-bottom: 24px; }
    .sidebar-heading { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
    .sidebar-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 6px; color: var(--muted2); font-size: 13px; cursor: default; }
    .sidebar-item:hover { background: var(--bg3); color: var(--text); }
    .sidebar-item .ico { color: var(--accent); font-size: 14px; width: 16px; text-align: center; }

    /* Quick commands */
    .cmd-chip { display: inline-block; font-family: var(--mono); font-size: 11px; background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 2px 7px; color: var(--muted2); margin: 3px 2px; }

    /* Footer */
    .footer { border-top: 1px solid var(--border); padding: 12px 20px; font-size: 12px; color: var(--muted); display: flex; gap: 16px; }
  </style>
</head>
<body>

<header class="topbar">
  <span class="topbar-logo">VX3</span>
  <span class="topbar-version">v${SDK_VERSION}</span>
  <span class="topbar-sep"></span>
  <div class="topbar-status">
    <span class="status-dot live" id="srv-dot"></span>
    <span id="srv-label">server running</span>
  </div>
  <nav class="topbar-nav">
    <a href="/api/status">status</a>
    <a href="/api/block">block</a>
    <a href="/api/gas">gas</a>
    <a href="/api/rpc">rpc</a>
  </nav>
</header>

<div class="page">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-heading">Server</div>
      <div class="sidebar-item"><span class="ico">◎</span><span class="mono" id="sb-addr">http://${safeHost}:${safePort}</span></div>
      <div class="sidebar-item"><span class="ico">⬡</span><span id="sb-rpc" class="mono" style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="">${safeRpcUrl}</span></div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-heading">Commands</div>
      <div style="padding: 4px 0;">
        <div class="cmd-chip">vx3 node</div>
        <div class="cmd-chip">vx3 rpc</div>
        <div class="cmd-chip">vx3 compile</div>
        <div class="cmd-chip">vx3 pay</div>
        <div class="cmd-chip">vx3 gas</div>
        <div class="cmd-chip">vx3 dash</div>
        <div class="cmd-chip">vx3 init</div>
        <div class="cmd-chip">vx3 generate</div>
      </div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-heading">Endpoints</div>
      <div class="ep-item"><span class="ep-method">GET</span><span class="ep-path">/api/status</span></div>
      <div class="ep-item"><span class="ep-method">GET</span><span class="ep-path">/api/block</span></div>
      <div class="ep-item"><span class="ep-method">GET</span><span class="ep-path">/api/gas</span></div>
      <div class="ep-item"><span class="ep-method">GET</span><span class="ep-path">/api/rpc</span></div>
      <div class="ep-item"><span class="ep-method">GET</span><span class="ep-path">/events</span></div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-heading">Links</div>
      <div class="sidebar-item"><span class="ico">↗</span><a href="https://nknighta.me/vx/" target="_blank">Docs</a></div>
    </div>
  </aside>

  <!-- Main content -->
  <main class="main">
    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Block</div>
        <div class="stat-value green" id="stat-block">—</div>
        <div class="stat-sub" id="stat-block-age">syncing...</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Gas Price</div>
        <div class="stat-value blue" id="stat-gas">—</div>
        <div class="stat-sub">gwei</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Base Fee</div>
        <div class="stat-value orange" id="stat-base">—</div>
        <div class="stat-sub">gwei</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">RPC</div>
        <div class="stat-value" id="stat-rpc-count" style="color:var(--muted2)">—</div>
        <div class="stat-sub">configured</div>
      </div>
    </div>

    <!-- Content grid -->
    <div class="content-grid">
      <!-- Gas details -->
      <div class="card">
        <div class="card-title">Gas Fees</div>
        <div id="gas-table">
          <div class="gas-row"><span class="gas-label">gasPrice</span><span class="gas-val" id="g-price">—</span></div>
          <div class="gas-row"><span class="gas-label">maxFeePerGas</span><span class="gas-val" id="g-max">—</span></div>
          <div class="gas-row"><span class="gas-label">maxPriorityFee</span><span class="gas-val" id="g-priority">—</span></div>
          <div class="gas-row"><span class="gas-label">baseFeePerGas</span><span class="gas-val" id="g-base">—</span></div>
        </div>
        <div style="margin-top:10px;">
          <button class="copy-btn" onclick="refreshGas()" style="padding:4px 10px;">Refresh</button>
        </div>
      </div>

      <!-- Activity log -->
      <div class="card">
        <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">
          Activity
          <button class="copy-btn" onclick="clearLog()">Clear</button>
        </div>
        <div class="log-area" id="log-area"></div>
      </div>
    </div>

    <!-- RPC list -->
    <div class="card" style="margin-top: 0;">
      <div class="card-title">RPC Endpoints (<span id="rpc-count">0</span>)</div>
      <div id="rpc-list"></div>
      <div id="rpc-empty" style="color:var(--muted);font-size:12px;display:none;">No RPC endpoints found in vx.config.json</div>
    </div>
  </main>
</div>

<footer class="footer">
  <span>VX3 SDK v${SDK_VERSION}</span>
  <span>·</span>
  <span>Dashboard server: <span class="mono">http://${safeHost}:${safePort}</span></span>
  <span>·</span>
  <a href="https://nknighta.me/vx/" target="_blank">Docs</a>
</footer>

<script>
  const VX_RPC_LIST = ${rpcListJson};
  const VX_DEFAULT_RPC = ${rpcUrlJson};
  const VX_VERSION = ${versionJson};

  // ── Logging ──────────────────────────────────────────────────────────────
  const logArea = document.getElementById('log-area');
  function log(tag, tagClass, msg) {
    const line = document.createElement('div');
    line.className = 'log-line';
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    line.innerHTML = '<span class="ts">' + ts + '</span><span class="tag ' + tagClass + '">[' + tag + ']</span>' + msg;
    logArea.appendChild(line);
    logArea.scrollTop = logArea.scrollHeight;
    // Keep max 200 lines
    while (logArea.children.length > 200) logArea.removeChild(logArea.firstChild);
  }
  function clearLog() { logArea.innerHTML = ''; }

  // ── Block display ─────────────────────────────────────────────────────────
  let lastBlock = null;
  let lastBlockTime = null;
  function setBlock(n) {
    const el = document.getElementById('stat-block');
    if (el) {
      el.textContent = String(n);
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    }
    const ageEl = document.getElementById('stat-block-age');
    if (ageEl) {
      lastBlockTime = Date.now();
      ageEl.textContent = 'just now';
    }
    if (lastBlock !== null && n !== lastBlock) {
      log('BLOCK', 'tag-block', '#' + n);
    }
    lastBlock = n;
  }

  setInterval(() => {
    if (!lastBlockTime) return;
    const s = Math.round((Date.now() - lastBlockTime) / 1000);
    const el = document.getElementById('stat-block-age');
    if (el) el.textContent = s < 5 ? 'just now' : s + 's ago';
  }, 2000);

  // ── Gas ───────────────────────────────────────────────────────────────────
  function fmtGwei(v) { return v ? parseFloat(v).toFixed(2) + ' gwei' : '—'; }
  function setGas(data) {
    const gp = data.gasPriceGwei;
    const mf = data.maxFeePerGasGwei;
    const mp = data.maxPriorityFeePerGasGwei;
    const bf = data.baseFeePerGasGwei;
    const statGas = document.getElementById('stat-gas');
    const statBase = document.getElementById('stat-base');
    if (statGas) statGas.textContent = gp ? parseFloat(gp).toFixed(2) : (mf ? parseFloat(mf).toFixed(2) : '—');
    if (statBase) statBase.textContent = bf ? parseFloat(bf).toFixed(2) : '—';
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = fmtGwei(val); };
    set('g-price', gp); set('g-max', mf); set('g-priority', mp); set('g-base', bf);
    log('GAS', 'tag-gas', (gp ? parseFloat(gp).toFixed(2) + ' gwei' : '—'));
  }

  async function refreshGas() {
    try {
      const r = await fetch('/api/gas');
      if (!r.ok) return;
      const d = await r.json();
      setGas(d);
    } catch(e) { log('ERR', 'tag-err', 'gas: ' + e.message); }
  }

  // ── SSE ───────────────────────────────────────────────────────────────────
  function initSse() {
    try {
      const es = new EventSource('/events');
      const dot = document.getElementById('srv-dot');
      const lbl = document.getElementById('srv-label');

      es.addEventListener('block', (ev) => {
        try {
          const d = JSON.parse(ev.data);
          if (typeof d.blockNumber !== 'undefined') setBlock(d.blockNumber);
        } catch(e) {}
      });

      es.addEventListener('gas', (ev) => {
        try {
          const d = JSON.parse(ev.data);
          setGas(d);
        } catch(e) {}
      });

      es.addEventListener('open', () => {
        if (dot) { dot.className = 'status-dot live'; }
        if (lbl) lbl.textContent = 'live';
        log('INFO', 'tag-info', 'SSE connected');
      });

      es.addEventListener('error', () => {
        if (dot) { dot.className = 'status-dot err'; }
        if (lbl) lbl.textContent = 'disconnected';
        log('ERR', 'tag-err', 'SSE disconnected');
      });
    } catch(e) {
      log('ERR', 'tag-err', 'SSE unavailable: ' + e.message);
    }
  }

  // ── RPC list ──────────────────────────────────────────────────────────────
  function rpcEntryToUrl(entry) {
    if (!entry) return '';
    if (typeof entry === 'string') return entry;
    if (entry.rpcUrl) return entry.rpcUrl;
    if (entry.host) {
      const proto = entry.protocol || 'http';
      const portSuffix = entry.port ? ':' + entry.port : '';
      return proto + '://' + entry.host + portSuffix;
    }
    return '';
  }

  function renderRpcList() {
    const container = document.getElementById('rpc-list');
    const empty = document.getElementById('rpc-empty');
    const count = document.getElementById('rpc-count');
    const statCount = document.getElementById('stat-rpc-count');
    const all = [...VX_RPC_LIST];
    if (VX_DEFAULT_RPC && !all.find(e => rpcEntryToUrl(e) === VX_DEFAULT_RPC)) {
      all.unshift({ rpcUrl: VX_DEFAULT_RPC, type: 'default' });
    }
    if (count) count.textContent = String(all.length);
    if (statCount) statCount.textContent = String(all.length);
    if (!all.length) { if (empty) empty.style.display = ''; return; }
    if (empty) empty.style.display = 'none';
    all.forEach(entry => {
      const url = rpcEntryToUrl(entry);
      const type = entry.type || 'rpc';
      const div = document.createElement('div');
      div.className = 'rpc-item';
      div.innerHTML =
        '<span class="status-dot idle" style="flex-shrink:0"></span>' +
        '<span class="rpc-url" title="' + url + '">' + url + '</span>' +
        '<span class="rpc-type">' + type + '</span>' +
        '<button class="copy-btn" data-url="' + url + '">copy</button>';
      div.querySelector('.copy-btn').addEventListener('click', function() {
        navigator.clipboard.writeText(this.dataset.url).then(() => {
          this.textContent = 'copied!';
          setTimeout(() => { this.textContent = 'copy'; }, 1200);
        });
      });
      container.appendChild(div);
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    log('INFO', 'tag-info', 'VX3 dashboard v' + VX_VERSION + ' started');
    renderRpcList();
    initSse();
    // Initial fetches
    fetch('/api/block').then(r => r.ok && r.json()).then(d => {
      if (d && d.blockNumber != null) setBlock(d.blockNumber);
    }).catch(e => log('ERR', 'tag-err', 'block: ' + e.message));
    refreshGas();
    // Refresh gas every 30s
    setInterval(refreshGas, 30000);
  });
</script>
</body>
</html>`;
}

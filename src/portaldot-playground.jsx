import { useState, useEffect, useCallback, useRef } from "react";

// ─── PORTALDOT NETWORK CONFIG ───────────────────────────────────────────────
const NETWORKS = {
  testnet: {
    name: "Portaldot Testnet",
    rpc: "wss://testnet-rpc.portaldot.io",
    token: "POT",
    decimals: 12,
    ss58: 42,
    color: "#00e5c8",
  },
  mainnet: {
    name: "Portaldot Mainnet",
    rpc: "wss://rpc.portaldot.io",
    token: "POT",
    decimals: 12,
    ss58: 42,
    color: "#f7b731",
  },
  local: {
    name: "Local Node (127.0.0.1:9944)",
    rpc: "ws://127.0.0.1:9944",
    token: "POT",
    decimals: 12,
    ss58: 42,
    color: "#a29bfe",
  },
};

// ─── DEMO DATA ───────────────────────────────────────────────────────────────
const randomHash = () =>
  "0x" + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
const randomAddr = () =>
  "5" + [...Array(47)].map(() => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789"[Math.floor(Math.random() * 58)]).join("");
const randomBalance = () => (Math.random() * 9000 + 100).toFixed(4);
const ts = (offset = 0) => {
  const d = new Date(Date.now() - offset * 1000);
  return d.toLocaleTimeString();
};

const DEMO_BLOCKS = Array.from({ length: 8 }, (_, i) => ({
  number: 1042300 - i,
  hash: randomHash(),
  extrinsics: Math.floor(Math.random() * 12) + 1,
  timestamp: ts(i * 6),
  author: randomAddr(),
}));

const DEMO_TXS = Array.from({ length: 6 }, (_, i) => ({
  hash: randomHash(),
  from: randomAddr(),
  to: randomAddr(),
  amount: (Math.random() * 500 + 0.1).toFixed(4),
  status: i % 5 === 0 ? "Failed" : "Success",
  block: 1042300 - i,
  fee: (Math.random() * 0.01).toFixed(6),
}));

const DEMO_MESSAGES = [
  { author: randomAddr(), message: "Hello Portaldot world! 🌐", block: 1042280, time: "10:32 AM" },
  { author: randomAddr(), message: "First dApp on Portaldot testnet!", block: 1042251, time: "09:17 AM" },
  { author: randomAddr(), message: "Layer-0 is the future of cross-chain!", block: 1042190, time: "Yesterday" },
  { author: randomAddr(), message: "Building the green Web3 infrastructure 🌿", block: 1042100, time: "Yesterday" },
];

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #080c14; --surface: #0f1624; --surface2: #162035;
    --border: #1e2d45; --border2: #243550;
    --accent: #00e5c8; --accent2: #0099ff; --accent3: #f7b731;
    --danger: #ff4d6d; --success: #00e5c8;
    --text: #e8edf5; --muted: #6b7fa3;
    --mono: 'Space Mono', monospace; --sans: 'DM Sans', sans-serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--sans); min-height: 100vh; }
  body::before {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image: linear-gradient(rgba(0,229,200,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,200,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .app { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 0 20px 60px; }
  .header { display: flex; align-items: center; justify-content: space-between; padding: 24px 0 20px; border-bottom: 1px solid var(--border); margin-bottom: 28px; }
  .logo { display: flex; align-items: center; gap: 12px; }
  .logo-mark { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-weight: 700; font-size: 18px; color: #000; box-shadow: 0 0 20px rgba(0,229,200,0.3); }
  .logo-text { font-family: var(--mono); font-size: 1.1rem; font-weight: 700; }
  .logo-text span { color: var(--accent); }
  .logo-sub { font-size: 0.7rem; color: var(--muted); margin-top: 2px; }
  .network-badge { display: flex; align-items: center; gap: 8px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 8px; padding: 8px 14px; font-family: var(--mono); font-size: 0.78rem; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity:1; box-shadow: 0 0 0 0 rgba(0,229,200,0.4); } 50% { box-shadow: 0 0 0 6px transparent; } }
  .wallet-bar { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
  .wallet-info { flex: 1; min-width: 200px; }
  .wallet-addr { font-family: var(--mono); font-size: 0.8rem; color: var(--accent); }
  .wallet-label { font-size: 0.72rem; color: var(--muted); margin-bottom: 4px; }
  .wallet-balance { font-family: var(--mono); font-size: 1.3rem; font-weight: 700; }
  .wallet-balance span { font-size: 0.8rem; color: var(--muted); margin-left: 6px; }
  .tabs { display: flex; gap: 4px; background: var(--surface); border-radius: 10px; padding: 4px; margin-bottom: 24px; flex-wrap: wrap; }
  .tab { flex: 1; min-width: 120px; padding: 10px 16px; border: none; background: transparent; color: var(--muted); font-family: var(--sans); font-size: 0.85rem; font-weight: 500; cursor: pointer; border-radius: 7px; transition: all 0.2s; white-space: nowrap; }
  .tab:hover { color: var(--text); background: var(--surface2); }
  .tab.active { background: linear-gradient(135deg, var(--accent2), var(--accent)); color: #000; font-weight: 600; }
  .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
  .panel-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .panel-title { font-family: var(--mono); font-size: 0.85rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em; }
  .panel-body { padding: 20px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  @media (max-width: 700px) { .grid2, .grid3 { grid-template-columns: 1fr; } }
  .stat-card { background: var(--surface2); border: 1px solid var(--border2); border-radius: 10px; padding: 16px; }
  .stat-label { font-size: 0.72rem; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
  .stat-value { font-family: var(--mono); font-size: 1.4rem; font-weight: 700; }
  .stat-value.green { color: var(--accent); }
  .stat-value.blue { color: var(--accent2); }
  .stat-value.yellow { color: var(--accent3); }
  .form-group { margin-bottom: 16px; }
  .form-label { font-size: 0.78rem; color: var(--muted); margin-bottom: 6px; display: block; }
  .form-input { width: 100%; padding: 10px 14px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 8px; color: var(--text); font-family: var(--sans); font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
  .form-input:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--muted); }
  .form-input.mono { font-family: var(--mono); font-size: 0.8rem; }
  textarea.form-input { min-height: 80px; resize: vertical; }
  .btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-family: var(--sans); font-weight: 600; font-size: 0.875rem; transition: all 0.15s; display: inline-flex; align-items: center; gap: 8px; }
  .btn-primary { background: var(--accent); color: #000; }
  .btn-primary:hover { background: #00ffdf; box-shadow: 0 0 16px rgba(0,229,200,0.4); }
  .btn-secondary { background: var(--surface2); border: 1px solid var(--border2); color: var(--text); }
  .btn-secondary:hover { border-color: var(--accent); color: var(--accent); }
  .btn-danger { background: var(--danger); color: #fff; }
  .btn-sm { padding: 6px 12px; font-size: 0.8rem; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
  .table th { text-align: left; padding: 10px 12px; color: var(--muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid var(--border); }
  .table td { padding: 10px 12px; border-bottom: 1px solid var(--border); font-family: var(--mono); font-size: 0.78rem; }
  .table tr:last-child td { border-bottom: none; }
  .table tr:hover td { background: var(--surface2); }
  .badge { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; font-family: var(--mono); }
  .badge-success { background: rgba(0,229,200,0.12); color: var(--accent); border: 1px solid rgba(0,229,200,0.25); }
  .badge-fail { background: rgba(255,77,109,0.12); color: var(--danger); border: 1px solid rgba(255,77,109,0.25); }
  .badge-info { background: rgba(0,153,255,0.12); color: var(--accent2); border: 1px solid rgba(0,153,255,0.25); }
  .badge-warn { background: rgba(247,183,49,0.12); color: var(--accent3); border: 1px solid rgba(247,183,49,0.25); }
  .hash { font-family: var(--mono); font-size: 0.75rem; color: var(--muted); }
  .hash-short { color: var(--accent2); cursor: pointer; }
  .alert { padding: 12px 16px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 16px; }
  .alert-info { background: rgba(0,153,255,0.1); border: 1px solid rgba(0,153,255,0.25); color: var(--accent2); }
  .alert-success { background: rgba(0,229,200,0.1); border: 1px solid rgba(0,229,200,0.25); color: var(--accent); }
  .alert-warn { background: rgba(247,183,49,0.1); border: 1px solid rgba(247,183,49,0.25); color: var(--accent3); }
  .alert-error { background: rgba(255,77,109,0.1); border: 1px solid rgba(255,77,109,0.25); color: var(--danger); }
  .log-area { background: #050810; border: 1px solid var(--border); border-radius: 8px; padding: 12px; max-height: 200px; overflow-y: auto; font-family: var(--mono); font-size: 0.75rem; line-height: 1.6; }
  .log-line { display: flex; gap: 8px; }
  .log-time { color: var(--muted); flex-shrink: 0; }
  .log-ok { color: var(--accent); }
  .log-err { color: var(--danger); }
  .log-info { color: var(--accent2); }
  .progress-bar { height: 4px; background: var(--border); border-radius: 4px; overflow: hidden; margin-top: 8px; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent2), var(--accent)); border-radius: 4px; transition: width 0.3s; }
  .msg-card { background: var(--surface2); border: 1px solid var(--border2); border-radius: 10px; padding: 14px; margin-bottom: 12px; transition: border-color 0.2s; }
  .msg-card:hover { border-color: var(--accent); }
  .msg-author { font-family: var(--mono); font-size: 0.72rem; color: var(--accent2); margin-bottom: 6px; }
  .msg-text { font-size: 0.9rem; line-height: 1.5; color: var(--text); }
  .msg-meta { display: flex; gap: 12px; margin-top: 8px; font-size: 0.72rem; color: var(--muted); }
  .section-title { font-family: var(--mono); font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 14px; }
  .divider { height: 1px; background: var(--border); margin: 20px 0; }
  .demo-banner { background: rgba(247,183,49,0.08); border: 1px solid rgba(247,183,49,0.2); border-radius: 8px; padding: 10px 16px; margin-bottom: 20px; font-size: 0.8rem; color: var(--accent3); display: flex; align-items: center; gap: 8px; }
  .real-banner { background: rgba(0,229,200,0.08); border: 1px solid rgba(0,229,200,0.2); border-radius: 8px; padding: 10px 16px; margin-bottom: 20px; font-size: 0.8rem; color: var(--accent); display: flex; align-items: center; gap: 8px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 16px; height: 16px; border: 2px solid var(--border2); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  .chain-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  @media (max-width:500px) { .chain-info-grid { grid-template-columns:1fr; } }
  .ci-item { background: var(--surface2); border-radius: 8px; padding: 12px; }
  .ci-key { font-size: 0.7rem; color: var(--muted); margin-bottom: 4px; }
  .ci-val { font-family: var(--mono); font-size: 0.85rem; }
  .faucet-icon { font-size: 2.5rem; text-align: center; margin-bottom: 10px; }
  .faucet-step { display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: var(--surface2); border-radius: 8px; margin-bottom: 10px; font-size: 0.85rem; }
  .step-num { width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: #000; font-weight: 700; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
  .flex-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .mt-4 { margin-top: 16px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-2 { margin-bottom: 8px; }
  .text-sm { font-size: 0.82rem; color: var(--muted); }
  .text-mono { font-family: var(--mono); }
  .text-accent { color: var(--accent); }
  .text-accent2 { color: var(--accent2); }
  .text-yellow { color: var(--accent3); }
  .text-danger { color: var(--danger); }
  .connecting-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; gap: 16px; }
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (h = "", n = 8) => h ? `${h.slice(0, n)}...${h.slice(-6)}` : "";

// ════════════════════════════════════════════════════════════════════════════
// WALLET TESTER
// ════════════════════════════════════════════════════════════════════════════
function WalletTester({ wallet, setWallet, addLog, network, realChain }) {
  const [sendTo, setSendTo] = useState("");
  const [sendAmt, setSendAmt] = useState("");
  const [signMsg, setSignMsg] = useState("");
  const [sig, setSig] = useState("");
  const [loading, setLoading] = useState("");
  const [txStatus, setTxStatus] = useState(null);
  const isReal = realChain?.isConnected;

  const connectWallet = async () => {
    setLoading("connect");
    addLog("info", "Requesting wallet connection...");

    if (realChain?.connectWallet) {
      const result = await realChain.connectWallet();
      if (result.success) {
        addLog("ok", `✅ REAL wallet connected: ${short(result.address)} | Balance: ${result.balance}`);
        setLoading("");
        return;
      } else {
        addLog("info", `Extension said: ${result.error} — using demo mode`);
      }
    }

    await sleep(1200);
    const addr = randomAddr();
    const bal = randomBalance();
    setWallet({ address: addr, balance: bal, connected: true });
    addLog("ok", `Demo connected: ${short(addr)} | Balance: ${bal} POT`);
    setLoading("");
  };

  const disconnect = () => {
    if (realChain?.disconnectWallet) realChain.disconnectWallet();
    setWallet({ connected: false, address: "", balance: "0" });
    addLog("info", "Wallet disconnected");
  };

  const sendTokens = async () => {
    if (!sendTo || !sendAmt) return;
    setLoading("send");
    setTxStatus(null);
    addLog("info", `Sending ${sendAmt} POT to ${short(sendTo)}...`);
    await sleep(1800);
    const hash = randomHash();
    setTxStatus({ type: "success", hash, msg: `${sendAmt} POT sent! Tx: ${short(hash)}` });
    setWallet((w) => ({ ...w, balance: (parseFloat(w.balance) - parseFloat(sendAmt)).toFixed(4) }));
    addLog("ok", `Tx confirmed: ${short(hash)}`);
    setLoading("");
  };

  const signMessage = async () => {
    if (!signMsg) return;
    setLoading("sign");
    addLog("info", `Signing message: "${signMsg.slice(0, 30)}"`);
    await sleep(900);
    const fakeSig = "0x" + [...Array(128)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
    setSig(fakeSig);
    addLog("ok", "Message signed");
    setLoading("");
  };

  const currentWallet = realChain?.wallet?.connected ? realChain.wallet : wallet;

  return (
    <div>
      {isReal
        ? <div className="real-banner">🟢 LIVE MODE — connected to real Portaldot node at {network.rpc}</div>
        : <div className="demo-banner">⚡ DEMO MODE — simulated wallet & transactions. Select Local Node and your node must be running.</div>
      }

      {!currentWallet.connected ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔐</div>
          {isReal
            ? <div style={{ color: "var(--accent)", marginBottom: "8px", fontSize: "0.9rem" }}>✅ Node connected — now connect your wallet extension</div>
            : <div style={{ color: "var(--muted)", marginBottom: "8px", fontSize: "0.9rem" }}>Node not connected — will use demo mode</div>
          }
          <div style={{ color: "var(--muted)", marginBottom: "24px", fontSize: "0.85rem" }}>
            Connect your Polkadot.js / SubWallet / Talisman wallet
          </div>
          <button className="btn btn-primary" onClick={connectWallet} disabled={!!loading}>
            {loading === "connect" ? <><span className="spinner" /> Connecting...</> : isReal ? "🔌 Connect Real Wallet" : "🔌 Connect Wallet (Demo)"}
          </button>
          <div className="mt-4 text-sm" style={{ maxWidth: 420, margin: "16px auto 0" }}>
            Need a wallet? Install <a href="https://polkadot.js.org/extension/" target="_blank" style={{ color: "var(--accent2)" }}>Polkadot.js Extension</a> or <a href="https://www.subwallet.app/" target="_blank" style={{ color: "var(--accent2)" }}>SubWallet</a>
          </div>
        </div>
      ) : (
        <div className="grid2">
          <div>
            <div className="section-title">Wallet Info {isReal && <span className="badge badge-success" style={{marginLeft:8}}>LIVE</span>}</div>
            <div className="ci-item mb-4">
              <div className="ci-key">Address (SS58)</div>
              <div className="ci-val" style={{ wordBreak: "break-all", fontSize: "0.72rem" }}>{currentWallet.address}</div>
            </div>
            <div className="chain-info-grid mb-4">
              <div className="ci-item">
                <div className="ci-key">Balance</div>
                <div className="ci-val text-accent">{currentWallet.balance} {network.token}</div>
              </div>
              <div className="ci-item">
                <div className="ci-key">Network</div>
                <div className="ci-val">{network.name}</div>
              </div>
              <div className="ci-item">
                <div className="ci-key">Decimals</div>
                <div className="ci-val">{network.decimals}</div>
              </div>
              <div className="ci-item">
                <div className="ci-key">Token</div>
                <div className="ci-val text-yellow">{network.token}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-danger btn-sm" onClick={disconnect}>Disconnect</button>
              {isReal && (
                <button className="btn btn-secondary btn-sm" onClick={() => realChain.refreshBalance(currentWallet.address).then(b => addLog("ok", `Balance refreshed: ${b}`))}>
                  🔄 Refresh
                </button>
              )}
            </div>
            <div className="divider" />
            <div className="section-title">Sign Message</div>
            <div className="form-group">
              <label className="form-label">Message to sign</label>
              <input className="form-input" placeholder="e.g. I own this address" value={signMsg} onChange={e => setSignMsg(e.target.value)} />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={signMessage} disabled={!signMsg || !!loading}>
              {loading === "sign" ? <><span className="spinner" /> Signing...</> : "✍️ Sign Message"}
            </button>
            {sig && (
              <div className="mt-4">
                <div className="form-label">Signature</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "0.65rem", wordBreak: "break-all", color: "var(--accent)", background: "var(--surface2)", padding: "10px", borderRadius: "6px" }}>{sig}</div>
              </div>
            )}
          </div>
          <div>
            <div className="section-title">Send Tokens</div>
            <div className="form-group">
              <label className="form-label">Recipient Address (SS58)</label>
              <input className="form-input mono" placeholder="5GrwvaEF5..." value={sendTo} onChange={e => setSendTo(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Amount ({network.token})</label>
              <input className="form-input" type="number" placeholder="10.0" value={sendAmt} onChange={e => setSendAmt(e.target.value)} />
            </div>
            {sendAmt && <div className="text-sm mb-4">Fee estimate: ~0.000012 {network.token} | Total: {(parseFloat(sendAmt || 0) + 0.000012).toFixed(6)} {network.token}</div>}
            {txStatus && <div className={`alert ${txStatus.type === "success" ? "alert-success" : "alert-error"} mb-4`}>{txStatus.msg}</div>}
            <button className="btn btn-primary" onClick={sendTokens} disabled={!sendTo || !sendAmt || !!loading} style={{ width: "100%" }}>
              {loading === "send" ? <><span className="spinner" /> Broadcasting...</> : "🚀 Send Transaction"}
            </button>
            <div className="divider" />
            <div className="section-title">Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setSendTo(randomAddr()); setSendAmt("1"); }}>🎲 Fill random address</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EXPLORER LITE
// ════════════════════════════════════════════════════════════════════════════
function ExplorerLite({ addLog, realChain }) {
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("address");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("blocks");
  const [liveBlocks, setLiveBlocks] = useState(DEMO_BLOCKS);

  // Update live blocks from real chain
  useEffect(() => {
    if (realChain?.bestBlock) {
      setLiveBlocks(prev => {
        const exists = prev.find(b => b.number === realChain.bestBlock.number);
        if (exists) return prev;
        return [
          { number: realChain.bestBlock.number, hash: realChain.bestBlock.hash, extrinsics: Math.floor(Math.random() * 5) + 1, timestamp: ts(), author: "Local Node" },
          ...prev.slice(0, 7)
        ];
      });
    }
  }, [realChain?.bestBlock?.number]);

  const doSearch = async () => {
    setLoading(true); setResult(null);
    addLog("info", `Searching ${searchType}: ${short(search, 12)}`);

    if (realChain?.api && searchType === "address") {
      try {
        const { data } = await realChain.api.query.system.account(search);
        setResult({ type: "address", address: search, balance: data.free.toHuman(), nonce: data.nonce?.toNumber() || 0, txCount: data.nonce?.toNumber() || 0 });
        addLog("ok", "✅ LIVE data from node");
        setLoading(false); return;
      } catch (e) {
        addLog("info", `Live query failed: ${e.message} — showing demo`);
      }
    }

    await sleep(1000);
    if (searchType === "address") {
      setResult({ type: "address", address: search, balance: randomBalance() + " POT", nonce: Math.floor(Math.random() * 50), txCount: Math.floor(Math.random() * 200) + 1 });
    } else if (searchType === "tx") {
      setResult({ type: "tx", hash: search, from: randomAddr(), to: randomAddr(), value: (Math.random() * 100).toFixed(4), fee: "0.000012", block: 1042250, status: "Success", timestamp: ts() });
    } else {
      setResult({ type: "block", number: parseInt(search) || 1042300, hash: randomHash(), parentHash: randomHash(), extrinsics: Math.floor(Math.random() * 15) + 1, author: randomAddr(), timestamp: ts() });
    }
    addLog("ok", "Search complete");
    setLoading(false);
  };

  return (
    <div>
      {realChain?.isConnected && <div className="real-banner">🟢 LIVE — block feed updating from your local node in real time</div>}
      <div className="flex-row mb-4">
        <select className="form-input" style={{ width: 150, flex: "none" }} value={searchType} onChange={e => setSearchType(e.target.value)}>
          <option value="address">Address</option>
          <option value="tx">Transaction</option>
          <option value="block">Block #</option>
        </select>
        <input className="form-input mono" style={{ flex: 1 }} placeholder={searchType === "block" ? "Block number..." : "0x... or 5G..."} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && search && doSearch()} />
        <button className="btn btn-primary" onClick={doSearch} disabled={!search || loading}>
          {loading ? <span className="spinner" /> : "🔍 Search"}
        </button>
      </div>

      {result && (
        <div className="panel mb-4">
          <div className="panel-header">
            <span className="panel-title">{result.type.toUpperCase()} Details</span>
            <span className="badge badge-success">Found</span>
          </div>
          <div className="panel-body">
            {result.type === "address" && (
              <div className="chain-info-grid">
                <div className="ci-item"><div className="ci-key">Address</div><div className="ci-val" style={{ fontSize: "0.65rem", wordBreak: "break-all" }}>{result.address}</div></div>
                <div className="ci-item"><div className="ci-key">Balance</div><div className="ci-val text-accent">{result.balance}</div></div>
                <div className="ci-item"><div className="ci-key">Nonce</div><div className="ci-val">{result.nonce}</div></div>
                <div className="ci-item"><div className="ci-key">Transactions</div><div className="ci-val">{result.txCount}</div></div>
              </div>
            )}
            {result.type === "tx" && (
              <div className="chain-info-grid">
                <div className="ci-item"><div className="ci-key">Hash</div><div className="ci-val" style={{ fontSize: "0.65rem", wordBreak: "break-all" }}>{result.hash}</div></div>
                <div className="ci-item"><div className="ci-key">Status</div><div className="ci-val"><span className="badge badge-success">{result.status}</span></div></div>
                <div className="ci-item"><div className="ci-key">From</div><div className="ci-val" style={{ fontSize: "0.65rem" }}>{short(result.from, 10)}</div></div>
                <div className="ci-item"><div className="ci-key">To</div><div className="ci-val" style={{ fontSize: "0.65rem" }}>{short(result.to, 10)}</div></div>
                <div className="ci-item"><div className="ci-key">Value</div><div className="ci-val text-accent">{result.value} POT</div></div>
                <div className="ci-item"><div className="ci-key">Block</div><div className="ci-val text-accent2">#{result.block}</div></div>
              </div>
            )}
            {result.type === "block" && (
              <div className="chain-info-grid">
                <div className="ci-item"><div className="ci-key">Block #</div><div className="ci-val text-accent2">{result.number}</div></div>
                <div className="ci-item"><div className="ci-key">Extrinsics</div><div className="ci-val">{result.extrinsics}</div></div>
                <div className="ci-item"><div className="ci-key">Hash</div><div className="ci-val" style={{ fontSize: "0.65rem", wordBreak: "break-all" }}>{short(result.hash)}</div></div>
                <div className="ci-item"><div className="ci-key">Author</div><div className="ci-val" style={{ fontSize: "0.65rem" }}>{short(result.author, 10)}</div></div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-row mb-4">
        <div className="section-title" style={{ margin: 0 }}>Live Feed:</div>
        <button className={`btn btn-sm ${view === "blocks" ? "btn-primary" : "btn-secondary"}`} onClick={() => setView("blocks")}>Blocks</button>
        <button className={`btn btn-sm ${view === "txs" ? "btn-primary" : "btn-secondary"}`} onClick={() => setView("txs")}>Transactions</button>
      </div>

      {view === "blocks" && (
        <div className="panel">
          <table className="table">
            <thead><tr><th>Block</th><th>Hash</th><th>Extrinsics</th><th>Author</th><th>Time</th></tr></thead>
            <tbody>
              {liveBlocks.map(b => (
                <tr key={b.number}>
                  <td><span className="text-accent2">#{b.number}</span></td>
                  <td><span className="hash-short">{short(b.hash)}</span></td>
                  <td>{b.extrinsics}</td>
                  <td><span className="hash">{typeof b.author === "string" && b.author.length < 20 ? b.author : short(b.author, 8)}</span></td>
                  <td><span className="hash">{b.timestamp}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "txs" && (
        <div className="panel">
          <table className="table">
            <thead><tr><th>Tx Hash</th><th>From</th><th>To</th><th>Amount</th><th>Status</th><th>Block</th></tr></thead>
            <tbody>
              {DEMO_TXS.map(tx => (
                <tr key={tx.hash}>
                  <td><span className="hash-short">{short(tx.hash)}</span></td>
                  <td><span className="hash">{short(tx.from, 8)}</span></td>
                  <td><span className="hash">{short(tx.to, 8)}</span></td>
                  <td className="text-accent">{tx.amount} POT</td>
                  <td><span className={`badge ${tx.status === "Success" ? "badge-success" : "badge-fail"}`}>{tx.status}</span></td>
                  <td>#{tx.block}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FAUCET
// ════════════════════════════════════════════════════════════════════════════
function Faucet({ addLog }) {
  const [addr, setAddr] = useState("");
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const requestTokens = async () => {
    if (!addr) return;
    setLoading(true); setStatus(null); setProgress(0);
    addLog("info", `Faucet request for ${short(addr, 10)}`);
    for (let i = 10; i <= 90; i += 20) { await sleep(350); setProgress(i); }
    await sleep(400);
    const hash = randomHash();
    setProgress(100);
    setStatus({ type: "success", hash, amount: "10" });
    setHistory(h => [{ addr: short(addr, 10), hash: short(hash), time: ts(), amount: "10 POT" }, ...h.slice(0, 4)]);
    addLog("ok", `Faucet dripped 10 POT → ${short(addr, 10)} | Tx: ${short(hash)}`);
    setLoading(false);
  };

  return (
    <div>
      <div style={{ textAlign: "center" }}>
        <div className="faucet-icon">🚰</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: "1.1rem", marginBottom: 4 }}>Portaldot Testnet Faucet</div>
        <div className="text-sm mb-4">Request free testnet POT tokens to experiment with the network</div>
      </div>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="alert alert-info mb-4">ℹ️ Each address can request tokens once per hour. Testnet POT has no real value.</div>
        <div className="form-group">
          <label className="form-label">Your Portaldot Address (SS58)</label>
          <input className="form-input mono" placeholder="5GrwvaEF5..." value={addr} onChange={e => setAddr(e.target.value)} />
        </div>
        {loading && (
          <div style={{ marginBottom: 16 }}>
            <div className="text-sm mb-2">Processing faucet request...</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
        {status && <div className="alert alert-success mb-4">✅ 10 POT sent! <span style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>Tx: {status.hash}</span></div>}
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={requestTokens} disabled={!addr || loading}>
          {loading ? <><span className="spinner" /> Requesting...</> : "💧 Request 10 POT"}
        </button>
        <div className="divider" />
        <div className="section-title">How to get a real testnet address</div>
        {[
          ["Install SubWallet or Polkadot.js Extension", "Browser extension wallets that support Substrate-based chains."],
          ["Create a new account", "Generate a new wallet. Back up your seed phrase!"],
          ["Add Portaldot Testnet network", "Settings → Networks → Add. RPC: wss://testnet-rpc.portaldot.io"],
          ["Copy your SS58 address", "Paste it above and request tokens."],
        ].map(([title, desc], i) => (
          <div className="faucet-step" key={i}>
            <div className="step-num">{i + 1}</div>
            <div><strong>{title}</strong><div className="text-sm" style={{ marginTop: 4 }}>{desc}</div></div>
          </div>
        ))}
        {history.length > 0 && (
          <>
            <div className="divider" />
            <div className="section-title">Recent Requests</div>
            <table className="table">
              <thead><tr><th>Address</th><th>Tx</th><th>Amount</th><th>Time</th></tr></thead>
              <tbody>{history.map((h, i) => <tr key={i}><td>{h.addr}</td><td className="hash-short">{h.hash}</td><td className="text-accent">{h.amount}</td><td className="hash">{h.time}</td></tr>)}</tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DEV PLAYGROUND
// ════════════════════════════════════════════════════════════════════════════
function DevPlayground({ addLog, realChain }) {
  const [rpcMethod, setRpcMethod] = useState("chain_getBlockHash");
  const [rpcParams, setRpcParams] = useState("[]");
  const [rpcResult, setRpcResult] = useState("");
  const [loading, setLoading] = useState(false);

  const RPC_METHODS = [
    { label: "chain_getBlockHash", params: "[]", desc: "Get latest block hash" },
    { label: "chain_getHeader", params: "[]", desc: "Get latest block header" },
    { label: "system_chain", params: "[]", desc: "Get chain name" },
    { label: "system_name", params: "[]", desc: "Get node name" },
    { label: "system_version", params: "[]", desc: "Get node version" },
    { label: "system_peers", params: "[]", desc: "Get connected peers" },
  ];

  const DEMO_RESPONSES = {
    "chain_getBlockHash": { jsonrpc: "2.0", id: 1, result: randomHash() },
    "chain_getHeader": { jsonrpc: "2.0", id: 1, result: { number: "0xFE4DC", parentHash: randomHash(), stateRoot: randomHash() } },
    "system_chain": { jsonrpc: "2.0", id: 1, result: "Portaldot Testnet" },
    "system_name": { jsonrpc: "2.0", id: 1, result: "Portaldot Node" },
    "system_version": { jsonrpc: "2.0", id: 1, result: "0.9.1-portaldot-volunteer" },
    "system_peers": { jsonrpc: "2.0", id: 1, result: [] },
  };

  const callRPC = async () => {
    setLoading(true);
    addLog("info", `RPC call: ${rpcMethod}`);

    if (realChain?.callRpc) {
      try {
        const result = await realChain.callRpc(rpcMethod);
        setRpcResult(JSON.stringify({ jsonrpc: "2.0", id: 1, result }, null, 2));
        addLog("ok", `✅ LIVE RPC response from node`);
        setLoading(false); return;
      } catch (e) {
        addLog("info", `Live RPC failed: ${e.message} — showing demo`);
      }
    }

    await sleep(700);
    const resp = DEMO_RESPONSES[rpcMethod] || { jsonrpc: "2.0", id: 1, result: null };
    setRpcResult(JSON.stringify(resp, null, 2));
    addLog("ok", "Demo RPC response");
    setLoading(false);
  };

  const chainInfo = realChain?.chainInfo;
  const bestBlock = realChain?.bestBlock;

  return (
    <div>
      {realChain?.isConnected && <div className="real-banner">🟢 LIVE — RPC calls go directly to your running node</div>}
      {chainInfo && (
        <>
          <div className="section-title">Live Chain Info {realChain?.isConnected && <span className="badge badge-success" style={{marginLeft:8}}>REAL DATA</span>}</div>
          <div className="chain-info-grid mb-4">
            {[
              ["Chain", chainInfo.chain, "accent"],
              ["Best Block", bestBlock ? `#${bestBlock.number.toLocaleString()}` : "—", "accent2"],
              ["Node Name", chainInfo.nodeName, ""],
              ["Version", chainInfo.nodeVersion, ""],
              ["Token", chainInfo.tokenSymbol, "yellow"],
              ["Decimals", chainInfo.tokenDecimals, ""],
            ].map(([k, v, c]) => (
              <div className="ci-item" key={k}>
                <div className="ci-key">{k}</div>
                <div className={`ci-val ${c ? "text-" + c : ""}`}>{v}</div>
              </div>
            ))}
          </div>
          <div className="divider" />
        </>
      )}

      <div className="grid2">
        <div>
          <div className="section-title">RPC Method Explorer</div>
          <div className="form-group">
            <label className="form-label">Method</label>
            <select className="form-input" value={rpcMethod} onChange={e => { setRpcMethod(e.target.value); setRpcParams(RPC_METHODS.find(m => m.label === e.target.value)?.params || "[]"); }}>
              {RPC_METHODS.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
            </select>
            <div className="text-sm mt-4" style={{ marginTop: 6 }}>{RPC_METHODS.find(m => m.label === rpcMethod)?.desc}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Parameters (JSON array)</label>
            <input className="form-input mono" value={rpcParams} onChange={e => setRpcParams(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={callRPC} disabled={loading} style={{ width: "100%" }}>
            {loading ? <><span className="spinner" /> Calling...</> : "▶ Execute RPC Call"}
          </button>
        </div>
        <div>
          <div className="section-title">Response {realChain?.isConnected && <span style={{fontSize:"0.7rem",color:"var(--accent)",marginLeft:8}}>← live from node</span>}</div>
          <pre className="log-area" style={{ maxHeight: 300, fontSize: "0.72rem" }}>
            {rpcResult || <span style={{ color: "var(--muted)" }}>// Response will appear here{"\n"}// Execute a method on the left</span>}
          </pre>
          <div className="divider" />
          <div className="section-title">Code Snippet</div>
          <pre className="log-area" style={{ maxHeight: 200, fontSize: "0.7rem" }}>
{`import { ApiPromise, WsProvider } from '@polkadot/api';

const api = await ApiPromise.create({
  provider: new WsProvider('ws://127.0.0.1:9944')
});

// ${rpcMethod}
const result = await api.rpc.${rpcMethod.replace("_", ".")}();
console.log(result.toHuman());`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MESSAGE BOARD
// ════════════════════════════════════════════════════════════════════════════
function MessageBoard({ wallet, realChain, addLog }) {
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [filter, setFilter] = useState("");
  const currentWallet = realChain?.wallet?.connected ? realChain.wallet : wallet;

  const postMessage = async () => {
    if (!newMsg.trim() || !currentWallet.connected) return;
    setLoading(true); setTxStatus(null);
    addLog("info", `Submitting message: "${newMsg.slice(0, 30)}"`);
    await sleep(2000);
    const hash = randomHash();
    const block = (realChain?.bestBlock?.number || 1042302) + messages.length;
    setMessages(m => [{ author: currentWallet.address, message: newMsg, block, time: ts() }, ...m]);
    setTxStatus({ hash, block });
    setNewMsg("");
    addLog("ok", `Message stored! Block #${block} | Tx: ${short(hash)}`);
    setLoading(false);
  };

  const filtered = filter ? messages.filter(m => m.message.toLowerCase().includes(filter.toLowerCase()) || m.author.includes(filter)) : messages;

  return (
    <div>
      <div className="alert alert-info mb-4">
        📋 Demo on-chain message board — shows how data gets stored on Portaldot using pallets.
      </div>
      <div className="grid2">
        <div>
          <div className="section-title">Post a Message</div>
          {!currentWallet.connected && <div className="alert alert-warn mb-4">⚠️ Connect your wallet in the Wallet tab first.</div>}
          <div className="form-group">
            <label className="form-label">Your Message</label>
            <textarea className="form-input" placeholder="Write something for the Portaldot blockchain..." value={newMsg} onChange={e => setNewMsg(e.target.value)} rows={4} disabled={!currentWallet.connected} />
          </div>
          {newMsg && <div className="text-sm mb-4">Characters: {newMsg.length}/280 | Fee: ~0.000024 POT</div>}
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={postMessage} disabled={!newMsg.trim() || !currentWallet.connected || loading}>
            {loading ? <><span className="spinner" /> Storing on-chain...</> : "📝 Post to Blockchain"}
          </button>
          {txStatus && <div className="alert alert-success mt-4">✅ Message stored! Block #{txStatus.block}</div>}
          <div className="divider" />
          <div className="section-title">How This Works</div>
          {["User signs a transaction with their wallet", "Transaction calls a custom pallet's write_message extrinsic", "Runtime stores (author, message, block#) in chain state", "Frontend reads storage and displays messages"].map((s, i) => (
            <div key={i} className="faucet-step">
              <div className="step-num">{i + 1}</div>
              <div style={{ fontSize: "0.82rem" }}>{s}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="flex-row mb-4">
            <div className="section-title" style={{ margin: 0 }}>Messages ({messages.length})</div>
            <input className="form-input" style={{ flex: 1, padding: "6px 10px", fontSize: "0.8rem" }} placeholder="Filter..." value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {filtered.map((m, i) => (
              <div className="msg-card" key={i}>
                <div className="msg-author">{short(m.author, 10)}</div>
                <div className="msg-text">{m.message}</div>
                <div className="msg-meta">
                  <span>Block #{m.block}</span>
                  <span>{m.time}</span>
                  {currentWallet.address && m.author === currentWallet.address && <span className="badge badge-info">You</span>}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-sm" style={{ textAlign: "center", padding: "20px 0" }}>No messages found</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
export default function App({ usePortaldot }) {
  const [tab, setTab] = useState("wallet");
  const [network, setNetwork] = useState("local");
  const [demoWallet, setDemoWallet] = useState({ connected: false, address: "", balance: "0" });
  const [logs, setLogs] = useState([
    { t: ts(), type: "info", msg: "Portaldot Developer Playground initialized" },
    { t: ts(), type: "info", msg: "Connecting to local node at ws://127.0.0.1:9944..." },
  ]);

  // Real blockchain hook
  const realChain = usePortaldot ? usePortaldot(network) : null;

  // Log connection events
  useEffect(() => {
    if (realChain?.isConnected && realChain?.chainInfo) {
      setLogs(l => [{ t: ts(), type: "ok", msg: `✅ Connected to ${realChain.chainInfo.chain} — ${realChain.chainInfo.nodeName} v${realChain.chainInfo.nodeVersion}` }, ...l]);
    }
    if (realChain?.error) {
      setLogs(l => [{ t: ts(), type: "err", msg: `Node connection failed: ${realChain.error}` }, ...l]);
    }
  }, [realChain?.isConnected, realChain?.error]);

  // Log new blocks
  useEffect(() => {
    if (realChain?.bestBlock) {
      setLogs(l => [{ t: ts(), type: "ok", msg: `⛏ New block #${realChain.bestBlock.number} — ${short(realChain.bestBlock.hash)}` }, ...l.slice(0, 49)]);
    }
  }, [realChain?.bestBlock?.number]);

  const addLog = useCallback((type, msg) => {
    setLogs(l => [{ t: ts(), type, msg }, ...l.slice(0, 49)]);
  }, []);

  const wallet = realChain?.wallet?.connected ? realChain.wallet : demoWallet;

  const TABS = [
    { id: "wallet", label: "🔐 Wallet" },
    { id: "explorer", label: "🔍 Explorer" },
    { id: "faucet", label: "🚰 Faucet" },
    { id: "playground", label: "⚙️ Playground" },
    { id: "messageboard", label: "💬 Message Board" },
  ];

  const nodeStatus = realChain?.isConnecting ? "connecting" : realChain?.isConnected ? "connected" : "offline";
  const dotColor = nodeStatus === "connected" ? "var(--accent)" : nodeStatus === "connecting" ? "var(--accent3)" : "var(--danger)";

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* HEADER */}
        <div className="header">
          <div className="logo">
            <div className="logo-mark">⬡</div>
            <div>
              <div className="logo-text">Portal<span>dot</span></div>
              <div className="logo-sub">Developer Playground</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <select className="form-input" style={{ width: 200, padding: "6px 10px", fontSize: "0.78rem" }} value={network} onChange={e => setNetwork(e.target.value)}>
              {Object.entries(NETWORKS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
            <div className="network-badge">
              <div className="dot" style={{ background: dotColor }} />
              <span>
                {nodeStatus === "connecting" ? "Connecting to node..." :
                 nodeStatus === "connected" ? (wallet.connected ? `${short(wallet.address, 8)} · ${wallet.balance}` : `Node connected ✓`) :
                 "Node offline"}
              </span>
            </div>
          </div>
        </div>

        {/* TOP STATS */}
        <div className="grid3 mb-4">
          <div className="stat-card">
            <div className="stat-label">Latest Block</div>
            <div className="stat-value blue">
              {realChain?.bestBlock ? `#${realChain.bestBlock.number.toLocaleString()}` : "#—"}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Chain</div>
            <div className="stat-value green">
              {realChain?.chainInfo?.chain || "—"}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Node</div>
            <div className="stat-value yellow">
              {realChain?.chainInfo?.nodeName || "Layer-0"}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* PANEL */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">{TABS.find(t => t.id === tab)?.label}</span>
            <span className={`badge ${nodeStatus === "connected" ? "badge-success" : nodeStatus === "connecting" ? "badge-warn" : "badge-fail"}`}>
              {nodeStatus === "connected" ? "Live" : nodeStatus === "connecting" ? "Connecting" : "Demo Mode"}
            </span>
          </div>
          <div className="panel-body">
            {tab === "wallet" && <WalletTester wallet={demoWallet} setWallet={setDemoWallet} addLog={addLog} network={NETWORKS[network]} realChain={realChain} />}
            {tab === "explorer" && <ExplorerLite addLog={addLog} realChain={realChain} />}
            {tab === "faucet" && <Faucet addLog={addLog} />}
            {tab === "playground" && <DevPlayground addLog={addLog} realChain={realChain} />}
            {tab === "messageboard" && <MessageBoard wallet={demoWallet} realChain={realChain} addLog={addLog} />}
          </div>
        </div>

        {/* CONSOLE */}
        <div style={{ marginTop: 24 }}>
          <div className="flex-row mb-2">
            <div className="section-title" style={{ margin: 0 }}>Console Log</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setLogs([])}>Clear</button>
          </div>
          <div className="log-area">
            {logs.map((l, i) => (
              <div className="log-line" key={i}>
                <span className="log-time">[{l.t}]</span>
                <span className={l.type === "ok" ? "log-ok" : l.type === "err" ? "log-err" : "log-info"}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: "center", marginTop: 40, color: "var(--muted)", fontSize: "0.78rem", fontFamily: "var(--mono)" }}>
          Portaldot Developer Playground · Built for the volunteer community ·{" "}
          <a href="https://github.com/Investorquab/portaldot-playground" target="_blank" style={{ color: "var(--accent2)" }}>github.com/Investorquab/portaldot-playground</a>
        </div>
      </div>
    </>
  );
}

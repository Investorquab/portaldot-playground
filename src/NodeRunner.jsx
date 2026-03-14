import { useState, useEffect, useRef, useCallback } from "react"

const PING_INTERVAL = 300
const POINTS_PER_PING = 10

const css = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');

.nr-root {
  font-family: 'Rajdhani', sans-serif;
  padding: 0;
  color: var(--color-text-primary);
}
.nr-header {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 24px;
}
.nr-title {
  font-size: 22px; font-weight: 700; letter-spacing: 1px;
  color: var(--color-text-primary);
}
.nr-subtitle {
  font-size: 13px; color: var(--color-text-secondary);
  font-family: 'Share Tech Mono', monospace;
}
.nr-icon {
  width: 44px; height: 44px; border-radius: var(--border-radius-md);
  background: var(--color-background-info);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; flex-shrink: 0;
}
.nr-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 12px; margin-bottom: 16px;
}
.nr-card {
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-lg);
  padding: 14px 16px;
}
.nr-card-label {
  font-size: 12px; color: var(--color-text-secondary);
  text-transform: uppercase; letter-spacing: 1px;
  margin-bottom: 4px; font-family: 'Share Tech Mono', monospace;
}
.nr-card-value {
  font-size: 26px; font-weight: 700;
  font-family: 'Share Tech Mono', monospace;
  color: var(--color-text-primary);
}
.nr-card-value.online { color: #1D9E75; }
.nr-card-value.offline { color: #D85A30; }
.nr-card-value.connecting { color: #BA7517; }
.nr-status-row {
  display: flex; align-items: center; gap: 8px;
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-lg);
  padding: 14px 16px; margin-bottom: 16px;
}
.nr-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
.nr-dot.online { background: #1D9E75; box-shadow: 0 0 0 3px rgba(29,158,117,0.2); }
.nr-dot.offline { background: #D85A30; }
.nr-dot.connecting {
  background: #BA7517;
  animation: nr-pulse 1s ease-in-out infinite;
}
@keyframes nr-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
.nr-status-text { font-size: 15px; font-weight: 600; flex: 1; }
.nr-next-ping {
  font-size: 12px; color: var(--color-text-secondary);
  font-family: 'Share Tech Mono', monospace;
}
.nr-progress-wrap {
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-lg);
  padding: 14px 16px; margin-bottom: 16px;
}
.nr-progress-label {
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--color-text-secondary);
  margin-bottom: 8px; font-family: 'Share Tech Mono', monospace;
}
.nr-progress-bar {
  height: 6px; background: var(--color-background-primary);
  border-radius: 3px; overflow: hidden;
}
.nr-progress-fill {
  height: 100%; border-radius: 3px;
  background: #1D9E75;
  transition: width 1s linear;
}
.nr-rpc-row {
  display: flex; gap: 8px; margin-bottom: 16px;
}
.nr-rpc-input {
  flex: 1; padding: 10px 12px;
  background: var(--color-background-secondary);
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  font-size: 13px; font-family: 'Share Tech Mono', monospace;
  color: var(--color-text-primary);
  outline: none;
}
.nr-rpc-input:focus { border-color: var(--color-border-primary); }
.nr-btn {
  padding: 10px 16px; border-radius: var(--border-radius-md);
  font-size: 14px; font-weight: 600; cursor: pointer;
  border: 0.5px solid var(--color-border-secondary);
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  font-family: 'Rajdhani', sans-serif;
  transition: background 0.15s;
  white-space: nowrap;
}
.nr-btn:hover { background: var(--color-background-primary); }
.nr-btn.primary {
  background: #0F6E56; border-color: #0F6E56; color: #fff;
}
.nr-btn.primary:hover { background: #1D9E75; border-color: #1D9E75; }
.nr-btn.danger {
  background: var(--color-background-danger);
  border-color: var(--color-border-danger);
  color: var(--color-text-danger);
}
.nr-leaderboard {
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-lg);
  padding: 14px 16px; margin-bottom: 16px;
}
.nr-lb-title {
  font-size: 14px; font-weight: 700; margin-bottom: 12px;
  letter-spacing: 1px; color: var(--color-text-secondary);
  font-family: 'Share Tech Mono', monospace;
  text-transform: uppercase;
}
.nr-lb-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0;
  border-bottom: 0.5px solid var(--color-border-tertiary);
  font-size: 14px;
}
.nr-lb-row:last-child { border-bottom: none; }
.nr-lb-rank {
  width: 22px; text-align: center; font-weight: 700;
  font-family: 'Share Tech Mono', monospace;
  color: var(--color-text-secondary); font-size: 13px;
}
.nr-lb-rank.gold { color: #BA7517; }
.nr-lb-rank.silver { color: #888780; }
.nr-lb-rank.bronze { color: #993C1D; }
.nr-lb-addr {
  flex: 1; font-family: 'Share Tech Mono', monospace;
  font-size: 13px; color: var(--color-text-primary);
}
.nr-lb-pts {
  font-weight: 700; font-family: 'Share Tech Mono', monospace;
  font-size: 13px; color: var(--color-text-primary);
}
.nr-lb-streak {
  font-size: 12px; color: #BA7517;
  font-family: 'Share Tech Mono', monospace;
}
.nr-log {
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-lg);
  padding: 12px 14px; max-height: 120px; overflow-y: auto;
}
.nr-log-entry {
  font-size: 12px; font-family: 'Share Tech Mono', monospace;
  color: var(--color-text-secondary); padding: 2px 0;
}
.nr-log-entry.ok { color: #1D9E75; }
.nr-log-entry.err { color: #D85A30; }
.nr-log-entry.info { color: var(--color-text-secondary); }
.nr-section-title {
  font-size: 11px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--color-text-secondary);
  margin-bottom: 8px; font-family: 'Share Tech Mono', monospace;
}
.nr-wallet-banner {
  background: var(--color-background-warning);
  border: 0.5px solid var(--color-border-warning);
  border-radius: var(--border-radius-md);
  padding: 10px 14px; font-size: 13px;
  color: var(--color-text-warning); margin-bottom: 16px;
}
`

function shortAddr(addr) {
  if (!addr) return "—"
  return addr.slice(0, 8) + "..." + addr.slice(-6)
}

function fmtTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function NodeRunner({ wallet, isConnected }) {
  const [rpcUrl, setRpcUrl] = useState("http://127.0.0.1:9933")
  const [running, setRunning] = useState(false)
  const [nodeStatus, setNodeStatus] = useState("idle")
  const [points, setPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [uptimeSeconds, setUptimeSeconds] = useState(0)
  const [countdown, setCountdown] = useState(PING_INTERVAL)
  const [log, setLog] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const pingTimer = useRef(null)
  const countdownTimer = useRef(null)
  const uptimeTimer = useRef(null)
  const logRef = useRef(null)

  const addLog = (type, msg) => {
    const ts = new Date().toLocaleTimeString()
    setLog(prev => [{ type, msg, ts }, ...prev].slice(0, 50))
  }

  const pingNode = useCallback(async () => {
    setNodeStatus("connecting")
    try {
      const res = await fetch(rpcUrl.replace("ws://", "http://").replace("wss://", "https://"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 1, jsonrpc: "2.0", method: "system_chain", params: [] }),
        signal: AbortSignal.timeout(5000)
      })
      const data = await res.json()
      if (data.result) {
        setNodeStatus("online")
        setPoints(p => p + POINTS_PER_PING)
        setStreak(s => s + 1)
        addLog("ok", `Ping OK — ${data.result} — +${POINTS_PER_PING} POT pts`)
        updateLeaderboard()
      } else {
        throw new Error("Bad response")
      }
    } catch {
      setNodeStatus("offline")
      setStreak(0)
      addLog("err", "Ping failed — node offline or unreachable")
    }
    setCountdown(PING_INTERVAL)
  }, [rpcUrl])

  const updateLeaderboard = useCallback(() => {
    if (!wallet?.address) return
    const stored = JSON.parse(localStorage.getItem("nr_leaderboard") || "[]")
    const existing = stored.find(e => e.addr === wallet.address)
    const newPts = (existing?.pts || 0) + POINTS_PER_PING
    const newStreak = (existing?.streak || 0) + 1
    const updated = existing
      ? stored.map(e => e.addr === wallet.address ? { ...e, pts: newPts, streak: newStreak } : e)
      : [...stored, { addr: wallet.address, pts: newPts, streak: newStreak }]
    const sorted = updated.sort((a, b) => b.pts - a.pts).slice(0, 10)
    localStorage.setItem("nr_leaderboard", JSON.stringify(sorted))
    setLeaderboard(sorted)
  }, [wallet])

  const loadLeaderboard = () => {
    const stored = JSON.parse(localStorage.getItem("nr_leaderboard") || "[]")
    setLeaderboard(stored.sort((a, b) => b.pts - a.pts))
  }

  const loadMyScore = () => {
    if (!wallet?.address) return
    const stored = JSON.parse(localStorage.getItem("nr_leaderboard") || "[]")
    const me = stored.find(e => e.addr === wallet.address)
    if (me) { setPoints(me.pts); setStreak(me.streak) }
  }

  useEffect(() => {
    loadLeaderboard()
    loadMyScore()
  }, [wallet])

  const startRunner = () => {
    setRunning(true)
    addLog("info", `Node Runner started — pinging ${rpcUrl} every ${PING_INTERVAL}s`)
    pingNode()
    pingTimer.current = setInterval(pingNode, PING_INTERVAL * 1000)
    uptimeTimer.current = setInterval(() => setUptimeSeconds(s => s + 1), 1000)
    countdownTimer.current = setInterval(() => setCountdown(c => c > 0 ? c - 1 : PING_INTERVAL), 1000)
  }

  const stopRunner = () => {
    setRunning(false)
    setNodeStatus("idle")
    clearInterval(pingTimer.current)
    clearInterval(uptimeTimer.current)
    clearInterval(countdownTimer.current)
    addLog("info", "Node Runner stopped")
  }

  useEffect(() => () => {
    clearInterval(pingTimer.current)
    clearInterval(uptimeTimer.current)
    clearInterval(countdownTimer.current)
  }, [])

  const rankClass = (i) => i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""
  const rankSymbol = (i) => i === 0 ? "1" : i === 1 ? "2" : i === 2 ? "3" : `${i + 1}`
  const progressPct = Math.round(((PING_INTERVAL - countdown) / PING_INTERVAL) * 100)

  return (
    <>
      <style>{css}</style>
      <div className="nr-root">

        <div className="nr-header">
          <div className="nr-icon">⚡</div>
          <div>
            <div className="nr-title">Node Runner</div>
            <div className="nr-subtitle">earn POT points for keeping your node alive</div>
          </div>
        </div>

        {!wallet?.connected && (
          <div className="nr-wallet-banner">
            Connect your wallet in the Wallet tab to track your score on the leaderboard.
          </div>
        )}

        <div className="nr-section-title">Node RPC</div>
        <div className="nr-rpc-row">
          <input
            className="nr-rpc-input"
            value={rpcUrl}
            onChange={e => setRpcUrl(e.target.value)}
            disabled={running}
            placeholder="http://127.0.0.1:9933"
          />
          {!running
            ? <button className="nr-btn primary" onClick={startRunner}>Start</button>
            : <button className="nr-btn danger" onClick={stopRunner}>Stop</button>
          }
        </div>

        {running && (
          <>
            <div className="nr-status-row">
              <div className={`nr-dot ${nodeStatus}`} />
              <div className="nr-status-text">
                {nodeStatus === "online" ? "Node online" : nodeStatus === "connecting" ? "Pinging..." : "Node offline"}
              </div>
              <div className="nr-next-ping">
                {nodeStatus === "online" ? `next ping in ${countdown}s` : ""}
              </div>
            </div>

            <div className="nr-progress-wrap">
              <div className="nr-progress-label">
                <span>next ping</span>
                <span>{countdown}s</span>
              </div>
              <div className="nr-progress-bar">
                <div className="nr-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </>
        )}

        <div className="nr-grid">
          <div className="nr-card">
            <div className="nr-card-label">POT Points</div>
            <div className="nr-card-value">{points.toLocaleString()}</div>
          </div>
          <div className="nr-card">
            <div className="nr-card-label">Streak</div>
            <div className="nr-card-value">{streak} pings</div>
          </div>
          <div className="nr-card">
            <div className="nr-card-label">Uptime</div>
            <div className="nr-card-value">{fmtTime(uptimeSeconds)}</div>
          </div>
          <div className="nr-card">
            <div className="nr-card-label">Rate</div>
            <div className="nr-card-value" style={{ fontSize: 18 }}>{POINTS_PER_PING} pts/ping</div>
          </div>
        </div>

        <div className="nr-leaderboard">
          <div className="nr-lb-title">Leaderboard</div>
          {leaderboard.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
              No scores yet — start your node to earn points!
            </div>
          )}
          {leaderboard.map((entry, i) => (
            <div key={entry.addr} className="nr-lb-row">
              <div className={`nr-lb-rank ${rankClass(i)}`}>{rankSymbol(i)}</div>
              <div className="nr-lb-addr">{shortAddr(entry.addr)}</div>
              <div className="nr-lb-streak">🔥{entry.streak}</div>
              <div className="nr-lb-pts">{entry.pts.toLocaleString()} pts</div>
            </div>
          ))}
        </div>

        <div className="nr-section-title">Activity Log</div>
        <div className="nr-log" ref={logRef}>
          {log.length === 0 && (
            <div className="nr-log-entry info">Waiting to start...</div>
          )}
          {log.map((entry, i) => (
            <div key={i} className={`nr-log-entry ${entry.type}`}>
              [{entry.ts}] {entry.msg}
            </div>
          ))}
        </div>

      </div>
    </>
  )
}

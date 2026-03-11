// WalletSelector.jsx - Drop this into src/
// Detects all installed Substrate wallets and shows a selection popup

import { useState, useEffect } from 'react'

const SUPPORTED_WALLETS = [
  {
    id: 'polkadot-js',
    name: 'Polkadot.js',
    icon: '🔴',
    extensionName: 'polkadot-js',
    installUrl: 'https://polkadot.js.org/extension/',
  },
  {
    id: 'subwallet-js',
    name: 'SubWallet',
    icon: '🟠',
    extensionName: 'subwallet-js',
    installUrl: 'https://www.subwallet.app/',
  },
  {
    id: 'talisman',
    name: 'Talisman',
    icon: '🟣',
    extensionName: 'talisman',
    installUrl: 'https://www.talisman.xyz/',
  },
]

const modalCss = `
  .ws-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; backdrop-filter: blur(4px);
  }
  .ws-modal {
    background: #0f1624; border: 1px solid #1e2d45;
    border-radius: 16px; padding: 28px; width: 360px;
    box-shadow: 0 0 40px rgba(0,229,200,0.15);
  }
  .ws-title {
    font-family: 'Space Mono', monospace; font-size: 1rem;
    color: #00e5c8; margin-bottom: 6px;
  }
  .ws-sub {
    font-size: 0.8rem; color: #6b7fa3; margin-bottom: 24px;
  }
  .ws-wallet {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px; border-radius: 10px; margin-bottom: 10px;
    cursor: pointer; transition: all 0.2s;
    border: 1px solid #1e2d45; background: #162035;
  }
  .ws-wallet:hover { border-color: #00e5c8; background: #1e2d45; }
  .ws-wallet.detected { border-color: #243550; }
  .ws-wallet.not-installed { opacity: 0.5; cursor: default; }
  .ws-wallet-left { display: flex; align-items: center; gap: 12px; }
  .ws-wallet-icon { font-size: 1.4rem; }
  .ws-wallet-name { font-size: 0.9rem; font-weight: 600; color: #e8edf5; }
  .ws-wallet-status { font-size: 0.72rem; color: #6b7fa3; margin-top: 2px; }
  .ws-badge-detected {
    font-size: 0.68rem; padding: 3px 8px; border-radius: 20px;
    background: rgba(0,229,200,0.1); color: #00e5c8;
    border: 1px solid rgba(0,229,200,0.2); font-family: monospace;
  }
  .ws-badge-install {
    font-size: 0.68rem; padding: 3px 8px; border-radius: 20px;
    background: rgba(107,127,163,0.1); color: #6b7fa3;
    border: 1px solid rgba(107,127,163,0.2); font-family: monospace;
    text-decoration: none;
  }
  .ws-close {
    width: 100%; padding: 10px; margin-top: 16px;
    background: transparent; border: 1px solid #1e2d45;
    border-radius: 8px; color: #6b7fa3; cursor: pointer;
    font-size: 0.85rem; transition: all 0.2s;
  }
  .ws-close:hover { border-color: #e8edf5; color: #e8edf5; }
  .ws-connecting {
    text-align: center; padding: 20px 0;
    font-size: 0.85rem; color: #6b7fa3;
  }
  .ws-spinner {
    width: 24px; height: 24px; border: 2px solid #1e2d45;
    border-top-color: #00e5c8; border-radius: 50%;
    animation: wsspin 0.7s linear infinite;
    margin: 0 auto 12px;
  }
  @keyframes wsspin { to { transform: rotate(360deg); } }
  .ws-accounts { margin-top: 8px; }
  .ws-account {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px; border-radius: 10px; margin-bottom: 8px;
    cursor: pointer; border: 1px solid #1e2d45; background: #162035;
    transition: all 0.2s;
  }
  .ws-account:hover { border-color: #00e5c8; }
  .ws-account-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #00e5c8, #0099ff);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; font-weight: 700; color: #000; flex-shrink: 0;
  }
  .ws-account-name { font-size: 0.85rem; font-weight: 600; color: #e8edf5; }
  .ws-account-addr { font-size: 0.7rem; color: #6b7fa3; font-family: monospace; }
  .ws-back {
    background: transparent; border: none; color: #6b7fa3;
    cursor: pointer; font-size: 0.8rem; margin-bottom: 16px;
    padding: 0; display: flex; align-items: center; gap: 4px;
  }
  .ws-back:hover { color: #e8edf5; }
`

export function WalletSelector({ onConnect, onClose, api }) {
  const [detected, setDetected] = useState([])
  const [step, setStep] = useState('select') // select | connecting | accounts
  const [accounts, setAccounts] = useState([])
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [error, setError] = useState(null)

  // Detect installed wallets
  useEffect(() => {
    const injected = window.injectedWeb3 || {}
    const found = SUPPORTED_WALLETS.filter(w => injected[w.extensionName])
    setDetected(found.map(w => w.id))
  }, [])

  const connectWallet = async (wallet) => {
    setSelectedWallet(wallet)
    setStep('connecting')
    setError(null)

    try {
      // Enable just this specific wallet
      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp')
      const extensions = await web3Enable('Portaldot Playground')

      if (extensions.length === 0) {
        throw new Error('No extensions approved. Please click Approve in the popup.')
      }

      const allAccounts = await web3Accounts()

      if (allAccounts.length === 0) {
        throw new Error('No accounts found. Please create an account in your wallet.')
      }

      setAccounts(allAccounts)
      setStep('accounts')

    } catch (err) {
      setError(err.message)
      setStep('select')
    }
  }

  const selectAccount = async (account) => {
    try {
      const { formatBalance } = await import('@polkadot/util')
      let balance = '0 POT'
      if (api) {
        const { data } = await api.query.system.account(account.address)
        balance = formatBalance(data.free, { forceUnit: '-', decimals: 12, withUnit: 'POT' })
      }
      onConnect({ address: account.address, name: account.meta?.name || 'Account', balance })
    } catch (err) {
      onConnect({ address: account.address, name: account.meta?.name || 'Account', balance: '0 POT' })
    }
  }

  const shortAddr = (addr) => addr ? `${addr.slice(0, 10)}...${addr.slice(-6)}` : ''

  return (
    <>
      <style>{modalCss}</style>
      <div className="ws-overlay" onClick={(e) => e.target.className === 'ws-overlay' && onClose()}>
        <div className="ws-modal">

          {step === 'select' && (
            <>
              <div className="ws-title">Connect Wallet</div>
              <div className="ws-sub">
                {detected.length > 0
                  ? `${detected.length} wallet${detected.length > 1 ? 's' : ''} detected — select one to connect`
                  : 'No Substrate wallets detected'}
              </div>

              {error && (
                <div style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#ff4d6d', marginBottom: 16 }}>
                  ⚠️ {error}
                </div>
              )}

              {SUPPORTED_WALLETS.map(wallet => {
                const isDetected = detected.includes(wallet.id)
                return (
                  <div
                    key={wallet.id}
                    className={`ws-wallet ${isDetected ? 'detected' : 'not-installed'}`}
                    onClick={() => isDetected && connectWallet(wallet)}
                  >
                    <div className="ws-wallet-left">
                      <div className="ws-wallet-icon">{wallet.icon}</div>
                      <div>
                        <div className="ws-wallet-name">{wallet.name}</div>
                        <div className="ws-wallet-status">{isDetected ? 'Ready to connect' : 'Not installed'}</div>
                      </div>
                    </div>
                    {isDetected
                      ? <span className="ws-badge-detected">Detected</span>
                      : <a href={wallet.installUrl} target="_blank" className="ws-badge-install" onClick={e => e.stopPropagation()}>Install</a>
                    }
                  </div>
                )
              })}

              <button className="ws-close" onClick={onClose}>Cancel</button>
            </>
          )}

          {step === 'connecting' && (
            <div className="ws-connecting">
              <div className="ws-spinner" />
              <div style={{ color: '#e8edf5', marginBottom: 8 }}>Connecting to {selectedWallet?.name}...</div>
              <div>Check your wallet extension for an approval popup</div>
            </div>
          )}

          {step === 'accounts' && (
            <>
              <button className="ws-back" onClick={() => setStep('select')}>← Back</button>
              <div className="ws-title">Select Account</div>
              <div className="ws-sub">{accounts.length} account{accounts.length > 1 ? 's' : ''} found</div>
              <div className="ws-accounts">
                {accounts.map((acc, i) => (
                  <div key={i} className="ws-account" onClick={() => selectAccount(acc)}>
                    <div className="ws-account-avatar">{(acc.meta?.name || 'A')[0].toUpperCase()}</div>
                    <div>
                      <div className="ws-account-name">{acc.meta?.name || `Account ${i + 1}`}</div>
                      <div className="ws-account-addr">{shortAddr(acc.address)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}

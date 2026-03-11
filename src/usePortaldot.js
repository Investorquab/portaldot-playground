import { useState, useEffect, useRef } from 'react'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp'
import { formatBalance } from '@polkadot/util'

const RPC_ENDPOINTS = {
  testnet: 'wss://testnet-rpc.portaldot.io',
  mainnet: 'wss://rpc.portaldot.io',
  local: 'ws://127.0.0.1:9944',
}

export function usePortaldot(networkKey = 'local') {
  const [api, setApi] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [chainInfo, setChainInfo] = useState(null)
  const [bestBlock, setBestBlock] = useState(null)
  const [wallet, setWallet] = useState({ connected: false, address: '', balance: '0', accounts: [] })
  const apiRef = useRef(null)
  const unsubRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const connect = async () => {
      if (apiRef.current) { try { await apiRef.current.disconnect() } catch {} }
      if (unsubRef.current) { try { unsubRef.current() } catch {} }

      setIsConnecting(true)
      setIsConnected(false)
      setError(null)
      setChainInfo(null)
      setBestBlock(null)

      try {
        const endpoint = RPC_ENDPOINTS[networkKey]
        console.log('Connecting to ' + endpoint)
        const provider = new WsProvider(endpoint)
        const newApi = await ApiPromise.create({ provider })
        if (cancelled) { await newApi.disconnect(); return }

        const chain = await newApi.rpc.system.chain()
        const nodeName = await newApi.rpc.system.name()
        const nodeVersion = await newApi.rpc.system.version()

        formatBalance.setDefaults({ decimals: 12, unit: 'POT' })

        if (cancelled) return

        setChainInfo({
          chain: chain.toString(),
          nodeName: nodeName.toString(),
          nodeVersion: nodeVersion.toString(),
          tokenSymbol: 'POT',
          tokenDecimals: 12,
        })

        const unsub = await newApi.rpc.chain.subscribeNewHeads((header) => {
          if (!cancelled) {
            setBestBlock({
              number: header.number.toNumber(),
              hash: header.hash.toHex(),
              parentHash: header.parentHash.toHex(),
            })
          }
        })

        unsubRef.current = unsub
        apiRef.current = newApi
        setApi(newApi)
        setIsConnected(true)
        setIsConnecting(false)

      } catch (err) {
        if (!cancelled) {
          console.error('Connection error:', err)
          setError(err.message)
          setIsConnecting(false)
          setIsConnected(false)
        }
      }
    }

    connect()
    return () => { cancelled = true }
  }, [networkKey])

  const connectWallet = async () => {
    try {
      const extensions = await web3Enable('Portaldot Playground')
      if (extensions.length === 0) throw new Error('No wallet extension found. Please install Polkadot.js extension.')
      const accounts = await web3Accounts({ extensions: ['polkadot-js'] })
      if (accounts.length === 0) throw new Error('No accounts found. Please create an account in your wallet.')
      const address = accounts[0].address
      let balance = '0'
      if (apiRef.current) {
        const { data } = await apiRef.current.query.system.account(address)
        balance = formatBalance(data.free, { forceUnit: '-' })
      }
      setWallet({ connected: true, address, balance, accounts })
      return { success: true, address, balance }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const refreshBalance = async (address) => {
    if (!apiRef.current || !address) return
    try {
      const { data } = await apiRef.current.query.system.account(address)
      const balance = formatBalance(data.free, { forceUnit: '-' })
      setWallet(w => ({ ...w, balance }))
      return balance
    } catch (err) {
      console.error('Balance refresh error:', err)
    }
  }

  const callRpc = async (method, params = []) => {
    if (!apiRef.current) throw new Error('Not connected to node')
    const [namespace, fn] = method.split('_')
    const result = await apiRef.current.rpc[namespace][fn](...params)
    return result.toHuman ? result.toHuman() : result.toString()
  }

  const disconnectWallet = () => {
    setWallet({ connected: false, address: '', balance: '0', accounts: [] })
  }

  return { api, isConnected, isConnecting, error, chainInfo, bestBlock, wallet, connectWallet, disconnectWallet, refreshBalance, callRpc }
}

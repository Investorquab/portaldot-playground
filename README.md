cat > ~/projects/portaldot/playground/README.md << 'EOF'
# ⬡ Portaldot Developer Playground

A developer toolkit and demo dApp for the [Portaldot](https://www.portaldot.io) ecosystem — a next-generation Layer-0 blockchain built on Substrate.

## Features

- 🔐 **Wallet Tester** — connect wallet, check balance, send POT tokens, sign messages
- 🔍 **Explorer Lite** — search addresses, transactions and blocks
- 🚰 **Faucet Interface** — request testnet POT tokens
- ⚙️ **Developer Playground** — RPC method explorer with live chain info
- 💬 **Message Board** — demo on-chain messaging dApp

## Quick Start
```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Open browser
http://localhost:5173
```

## Connecting to Portaldot

| Network | RPC Endpoint |
|---------|-------------|
| Local Node | ws://127.0.0.1:9944 |
| Testnet | wss://testnet-rpc.portaldot.io |
| Mainnet | wss://rpc.portaldot.io |

## Running a Local Node

Download the binary from [Portaldot-node](https://github.com/portaldotVolunteer/Portaldot-node):
```bash
./portaldot_dev --dev --rpc-external --rpc-cors all
```

## Built For

The [portaldotVolunteer](https://github.com/portaldotVolunteer) community.

## License

MIT
EOF
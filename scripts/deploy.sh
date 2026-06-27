#!/bin/bash
# ==============================================================================
# Stellar Soroban Contract Deployment Script
# This script compiles, optimizes, and deploys the TaskLedger contract
# to the Stellar Testnet.
# ==============================================================================

set -e

echo "🚀 Starting TaskLedger Smart Contract Deployment process..."

# 1. Check prerequisites
if ! command -v cargo &> /dev/null; then
    echo "⚠️ cargo (Rust) is not installed. Please install Rust and wasm32 target first."
    exit 1
fi

if ! command -v stellar &> /dev/null && ! command -v soroban &> /dev/null; then
    echo "⚠️ Stellar CLI is not installed. Installing the CLI is required to deploy to Testnet."
    echo "Run: cargo install --locked stellar-cli --features opt"
    exit 1
fi

# Determine CLI command (stellar vs legacy soroban)
CLI="stellar"
if ! command -v stellar &> /dev/null; then
    CLI="soroban"
fi

echo "✅ Prerequisites checked. Using CLI: $CLI"

# 2. Compile the Rust Smart Contract to WebAssembly
echo "📦 Compiling contract to WASM..."
cd contracts/task_ledger
cargo build --target wasm32-unknown-unknown --release

# 3. Optimize the compiled WASM binary
echo "🔍 Optimizing WASM binary..."
if command -v "$CLI" &> /dev/null; then
    $CLI contract optimize --wasm target/wasm32-unknown-unknown/release/task_ledger.wasm
else
    echo "⚠️ Optimization skipped: CLI not fully configured."
fi

# 4. Generate deployment keypair
echo "🔑 Preparing deployment keypair..."
$CLI keys generate --global deployer --network testnet || echo "Key deployer already exists."

echo "💧 Funding deployer account on Stellar Testnet friendbot..."
$CLI keys fund deployer --network testnet || echo "Account already funded."

# 5. Deploy WASM binary to Stellar Testnet
echo "🛰️ Deploying contract to Stellar Testnet..."
CONTRACT_ID=$($CLI contract deploy \
    --wasm target/wasm32-unknown-unknown/release/task_ledger.optimized.wasm \
    --source deployer \
    --network testnet)

echo "=========================================================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "Contract ID: $CONTRACT_ID"
echo "Network: Stellar Testnet"
echo "=========================================================================="

# 6. Save contract ID to React app config
echo "💾 Writing Contract ID to src/config.ts..."
cd ../..
cat <<EOF > src/config.ts
export const STELLAR_CONFIG = {
  network: "TESTNET",
  horizonUrl: "https://horizon-testnet.stellar.org",
  sorobanRpcUrl: "https://soroban-testnet.stellar.org",
  contractId: "$CONTRACT_ID",
};
EOF

echo "✅ Deployment finished and config.ts generated successfully!"

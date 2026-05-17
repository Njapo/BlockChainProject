#!/usr/bin/env bash
#
# Compiles the vote circuit and runs the full Groth16 trusted setup, producing:
#   build/circuit/vote_js/vote.wasm   - witness generator
#   build/circuit/vote_final.zkey     - proving key
#   build/circuit/verification_key.json
#   contracts/Verifier.sol            - on-chain Groth16 verifier
#
# The Powers of Tau ceremony is generated locally so the build is self-contained.
set -euo pipefail

POT_POWER=14
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CIRCUIT_DIR="$ROOT/build/circuit"
PTAU_DIR="$ROOT/build/ptau"
SNARKJS="npx snarkjs"

export PATH="$HOME/.local/bin:$PATH"

mkdir -p "$CIRCUIT_DIR" "$PTAU_DIR"

echo "==> Compiling circuit"
circom "$ROOT/circuits/vote.circom" --r1cs --wasm -o "$CIRCUIT_DIR" -l "$ROOT/node_modules"

echo "==> Powers of Tau (phase 1)"
$SNARKJS powersoftau new bn128 "$POT_POWER" "$PTAU_DIR/pot_0000.ptau" -v
$SNARKJS powersoftau contribute "$PTAU_DIR/pot_0000.ptau" "$PTAU_DIR/pot_0001.ptau" \
  --name="veil phase1" -v -e="$(openssl rand -hex 32)"
$SNARKJS powersoftau prepare phase2 "$PTAU_DIR/pot_0001.ptau" "$PTAU_DIR/pot_final.ptau" -v

echo "==> Groth16 setup (phase 2)"
$SNARKJS groth16 setup "$CIRCUIT_DIR/vote.r1cs" "$PTAU_DIR/pot_final.ptau" "$CIRCUIT_DIR/vote_0000.zkey"
$SNARKJS zkey contribute "$CIRCUIT_DIR/vote_0000.zkey" "$CIRCUIT_DIR/vote_final.zkey" \
  --name="veil phase2" -v -e="$(openssl rand -hex 32)"

echo "==> Exporting verification key and Solidity verifier"
$SNARKJS zkey export verificationkey "$CIRCUIT_DIR/vote_final.zkey" "$CIRCUIT_DIR/verification_key.json"
$SNARKJS zkey export solidityverifier "$CIRCUIT_DIR/vote_final.zkey" "$ROOT/contracts/Verifier.sol"

echo "==> Done"

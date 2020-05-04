#!/bin/bash

# Tested solidity versions
VERSIONS=(
"0.6.6" "0.6.5" "0.6.4" "0.6.3" "0.6.2" "0.6.1" "0.6.0"
"0.5.17" "0.5.16" "0.5.15" "0.5.14" "0.5.13" "0.5.12" "0.5.11" "0.5.10" "0.5.9" "0.5.8" "0.5.7" "0.5.6" "0.5.5" "0.5.4" "0.5.3" "0.5.2" "0.5.1" "0.5.0"
"0.4.26" "0.4.25" "0.4.24" "0.4.23" "0.4.22" "0.4.21" "0.4.20" "0.4.19" "0.4.18" "0.4.17" "0.4.16" "0.4.15" "0.4.14" "0.4.13"
)

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  remove_contracts
  remove_truffle_config
  kill_ganache
}

remove_contracts() {
  # Remove contracts dir
  rm -rf contracts
}

remove_truffle_config() {
  # Rollback any previous Truffle config file
  if [ -f truffle.js ]; then
    rm truffle.js
  fi
}

kill_ganache() {
  # Kill the RPC instance that we started (if we started one and if it's still running)
  if [ -n "$rpc_pid" ] && ps -p $rpc_pid > /dev/null; then
    kill -9 $rpc_pid
  fi
}

create_contracts_dir() {
  # Create contracts dir for Truffle if missing
  mkdir -p contracts
}

start_ganache() {
  # Start ganache
  echo "Starting ganache-cli..."
  node ./scripts/run-tests.js > /dev/null &
  rpc_pid=$!
  sleep 3
}

run_tests() {
  # Run tests for each solidity version
  for version in "${VERSIONS[@]}"
  do
    :
    echo "Running tests for solidity version ${version}..."
    remove_contracts
    remove_truffle_config

    # Copy Sample contract updating solidity version
    create_contracts_dir
    cp ./test/fixtures/Sample."${version:0:3}".sol.bak ./contracts/Sample.sol
    sed -i -e "s/{{version}}/$version/g" ./contracts/Sample.sol
    rm -f ./contracts/Sample.sol-e

    # Remove past build artifacts and compile
    cp ./test/fixtures/truffle.js.bak truffle.js
    sed -i -e "s/{{version}}/$version/g" truffle.js
    rm -f truffle.js-e

    # Remove past build artifacts and compile
    rm -rf build
    npx truffle compile

    # Run tests
    npx truffle test
  done
}

kill_ganache
start_ganache
run_tests

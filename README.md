# ERC165 off-chain

This library allows to verify whether a smart contract supports an interface or not computing it off-chain.

## Install

```bash
npm install --save facuspagnuolo/erc165-offchain#v1.0.0
```

## Usage

### Without a custom Ethereum provider

```js
const { bytecodeSatisfies } = require('erc165-offchain')

const ABI = contract.abi
const bytecode = contract.deployedBytecode

return bytecodeSatisfies(bytecode, ABI)
```

### With a web3 1.x compatible provider

```js
const { addressSatisfies } = require('erc165-offchain')

const ABI = contract.abi
const web3 = new Web3(...)

return addressSatisfies(contract.address, web3, ABI)
```

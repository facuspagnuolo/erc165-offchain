const { sha3, isAddress } = require('web3-utils')

const UNEXPECTED_ABI_ERROR = `Please provide an ABI matching the following structure:
[
  {
    "name": "fn1",
    "inputs": [{ "name": "arg1", "type": "type1" },...]
  },
  {
    "name": "fn2",
    "inputs": [{ "name": "arg1", "type": "type1" },...]
  },
  ...
]`

/**
 * Tells the signature for a function ABI specification
 * @param abiFn ABI specification for the requested function
 * @return Function signature for the declared ABI inputs and function name, e.g.: fn(uint256,address)
 */
function signature(abiFn) {
  if (!abiFn.name || !Array.isArray(abiFn.inputs)) throw Error(UNEXPECTED_ABI_ERROR)
  return `${abiFn.name}(${abiFn.inputs.map(input => input.type).join(',')})`
}

/**
 * Tells whether a provided bytecode supports or not some ABI. This function checks the selectors of the provided ABI
 * trying to see if they match the ones evaluated during the discovery phase Ethereum smart contracts go through when
 * they receive a transaction call. Note that this function doesn't tell if the provided bytecode implements exactly
 * the given ABI, but if it provides support for all the functions specified in the given ABI.
 * @param bytecode Arbitrary EVM bytecode
 * @param abi ABI to be checked for the provided bytecode
 * @returns True if the provided bytecode satisfies the provided ABI, false otherwise
 */
function bytecodeSatisfies(bytecode, abi) {
  if (!bytecode) throw Error(`Cannot assess contract ABI without a bytecode`)
  if (!abi) throw Error(`Cannot assess contract ABI without an ABI, please provide one`)
  if (!Array.isArray(abi)) abi = [abi]

  // This function will produce an object with the list of all possible PUSH opcodes like: { 60: 1, 61: 2, 62: 3, ..., 7f: 32 }
  const PUSH_OPCODES = [...Array(32).keys()].reduce((obj, i) => { obj[parseInt(0x60 + i).toString(16)] = i + 1; return obj }, {})

  // EVM assembly opcode
  const EQ_OPCODE = '14'
  const JUMPI_OPCODE = '57'
  const PUSH4_OPCODE = '63'

  return abi.every(fn => {
    // Obtain the selector based on each function signature
    const selector = sha3(signature(fn)).substring(2, 10) // The first two skipped chars are for '0x'

    // Assembly sequence that should appear in the given bytecode trying to match a function for the given selector:
    // - PUSH4 (63)
    // - SELECTOR [4 bytes]
    // - EQ (14)
    const selectorEval = `${PUSH4_OPCODE}${selector}${EQ_OPCODE}`

    // Return false if the ere is no assembly sequence matching the expecting selector eval
    const selectorEvalStartIndex = bytecode.indexOf(selectorEval)
    if (selectorEvalStartIndex < 0) return false

    // In case the smart contract matches the selector, it jumps to the position in the bytecode where the logic for the
    // corresponding function is located. Then, every selector eval sequence continues with a JUMPI instruction as follows:
    // - PUSHn (60 + n - 1)
    // - POSITION [n bytes]
    // - JUMPI (57)
    const selectorEvalEndIndex = selectorEvalStartIndex + selectorEval.length
    const fnPositionPushOpcode = bytecode.substring(selectorEvalEndIndex, selectorEvalEndIndex + 2)

    // Look for the length used for the PUSH opcode at the beginning of the jump instruction, return false if its not what we expect
    const fnPositionLength = PUSH_OPCODES[fnPositionPushOpcode]
    if (!fnPositionLength) return false

    // Look for the expected JUMPI instruction after the length used for the PUSH opcode
    const expectedJumpiOpcodePosition = selectorEvalEndIndex + 2 + fnPositionLength * 2
    const opcodeAtExpectedJumpiPosition = bytecode.substring(expectedJumpiOpcodePosition, expectedJumpiOpcodePosition + 2)
    return opcodeAtExpectedJumpiPosition === JUMPI_OPCODE
  })
}

/**
 * Tells whether a smart contract supports or not some ABI. This function checks the selectors of the provided ABI
 * trying to see if they match the ones evaluated during the discovery phase Ethereum smart contracts go through when
 * they receive a transaction call. Note that this function doesn't tell if the provided smart contract implements exactly
 * the given ABI, but if it provides support for all the functions specified in the given ABI.
 * @param web3 Web3 instance already set up that will be used to query the given smart contract
 * @param address Smart contract address to be checked
 * @param abi ABI to be checked for the provided smart contract
 * @returns True if the provided bytecode satisfies the provided ABI, false otherwise
 */
async function addressSatisfies(web3, address, abi) {
  if (!isAddress(address)) throw Error(`Cannot assess contract ABI with an invalid address: ${address}`)
  const bytecode = await web3.eth.getCode(address)
  return bytecodeSatisfies(bytecode, abi)
}

module.exports = {
  signature,
  addressSatisfies,
  bytecodeSatisfies,
}

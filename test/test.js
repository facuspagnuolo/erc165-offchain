const { signature, bytecodeSatisfies, addressSatisfies } = require('../index')

const Sample = artifacts.require('Sample')

const VALID_ABIS = [
  [{ name: "functionWithoutParams", inputs: [] }],
  [{ name: "functionWithOneParams", inputs: [{ type: "uint256" }] }],
  [{ name: "functionWithTwoParams", inputs: [{ type: "uint256" }, { type: "address" }] }],
  [{ name: "functionWithArrayParams", inputs: [{ type: "uint256" }, { type: "address[3]" }] }],
  [{ name: "functionWithArbitraryLengthParams", inputs: [{ type: "uint256" }, { type: "address[]" }] }],
  [{ name: "functionWithMultipleParams", inputs: [{ type: "uint8" }, { type: "bytes" }, { type: "uint256" }, { type: "bytes32[]" }, { type: "bytes2" }, { type: "address[3]" }] }]
]

const INVALID_ABIS = [
  [{ name: "functionWithout", inputs: [] }],
  [{ name: "functionWithOneParams", inputs: [{ type: "address" }] }],
  [{ name: "functionWithTwoParams", inputs: [{ type: "uint256" }, { type: "address" }, { type: "uint128" }] }],
  [{ name: "functionWithArrayParams", inputs: [{ type: "uint256" }, { type: "address[2]" }] }],
  [{ name: "functionWithArbitraryLengthParams", inputs: [{ type: "uint256" }, { type: "bytes32[]" }] }],
  [{ name: "functionWithMultipleParams", inputs: [{ type: "bytes" }, { type: "uint16" }, { type: "uint256" }, { type: "bytes32[]" }, { type: "bytes2" }, { type: "address[3]" }] }]
]

contract('Sample', () => {
  let sample

  before('deploy sample', async () => {
    sample = await Sample.new()
  })

  describe('addressSatisfies', () => {
    for (const abi of VALID_ABIS) {
      it(`should satisfy function ${signature(abi[0])}`, async () => {
        assert.isTrue(await addressSatisfies(web3, sample.address, abi), 'sample does not satisfy ABI')
      })
    }

    it('should satisfy all functions together', async () => {
      const abi = VALID_ABIS.reduce((abi, fn) => abi.concat(fn), [])
      assert.isTrue(await addressSatisfies(web3, sample.address, abi), 'sample does not satisfy entire ABI')
    })

    for (const abi of INVALID_ABIS) {
      it(`should not slightly different function: ${signature(abi[0])}`, async () => {
        assert.isFalse(await addressSatisfies(web3, sample.address, abi), 'sample does satisfy ABI')
      })
    }
  })

  describe('bytecodeSatisfies', () => {
    const bytecode = Sample.deployedBytecode

    for (const abi of VALID_ABIS) {
      it(`should satisfy function ${signature(abi[0])}`, async () => {
        assert.isTrue(await bytecodeSatisfies(bytecode, abi), 'sample does not satisfy ABI')
      })
    }

    it('should satisfy all functions together', async () => {
      const abi = VALID_ABIS.reduce((abi, fn) => abi.concat(fn), [])
      assert.isTrue(await bytecodeSatisfies(bytecode, abi), 'sample does not satisfy entire ABI')
    })

    for (const abi of INVALID_ABIS) {
      it(`should not slightly different function: ${signature(abi[0])}`, async () => {
        assert.isFalse(await bytecodeSatisfies(bytecode, abi), 'sample does satisfy ABI')
      })
    }
  })
})

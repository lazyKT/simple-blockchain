const Block = require('./block');
const { cryptoHash } = require('../utils');


class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }

    static isValidChain (chain) {

        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
            return false;
        }

        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const actualLastHash = chain[i - 1].hash;
            const lastDifficulty = chain[i - 1].difficulty;

            const { timestamp, lastHash, hash, data, nonce, difficulty } = block;

            if (lastHash !== actualLastHash) {
                return false;
            }

            const validatedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
            if (hash !== validatedHash) {
                return false;
            }

            if (Math.abs((lastDifficulty - difficulty)) > 1) {
                return false;
            }
        }

        return true;
    }

    addBlock({ data }) {
        const lastBlock = this.chain[this.chain.length - 1];
        const newBlock = Block.mineBlock({
            lastBlock,
            data
        });
        this.chain.push(newBlock);
    }

    replaceChain (chain) {
        if (chain.length <= this.chain.length) {
            console.error(`The length of the new chain (${chain.length}), must be less than or equal to current chain, (${this.chain.length})`);
            return;
        }
        if (!Blockchain.isValidChain(chain)) {
            console.error('The replacement chain must be valid');
            return;
        }
        this.chain = chain;
    }
}


module.exports = Blockchain;

const Block = require('./block');
const { cryptoHash } = require('../utils');
const { REWARD_INPUT, MINING_REWARD } = require('../config');
const Wallet = require('../wallet/index');
const Transaction = require('../wallet/transaction');


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

    replaceChain (chain, validateTransactions, onSuccess) {
        if (chain.length <= this.chain.length) {
            console.error(`The length of the new chain (${chain.length}), must be less than or equal to current chain, (${this.chain.length})`);
            return;
        }
        if (!Blockchain.isValidChain(chain)) {
            console.error('The replacement chain must be valid');
            return;
        }
        if (validateTransactions && !this.validTransactionData({ chain })) {
            console.error('The incoming chain has invalid transaction data!');
            return;
        }
        if (onSuccess) onSuccess();
        this.chain = chain;
    }

    validTransactionData ({ chain }) {
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const transactionSet = new Set();
            let rewardTransactionCount = 0;

            for (let transaction of block.data) {
                if (transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactionCount += 1;
                    // the number of reward transaction must be 1 in each block
                    if (rewardTransactionCount > 1) {
                        console.error('Miner rewards exceed limit!');
                        return false;
                    }

                    const miningRewardValue = Object.values(transaction.outputMap)[0];
                    if (miningRewardValue !== MINING_REWARD) {
                        console.error('Miner reward amount is invalid!');
                        return false;
                    }
                } else {
                    if (!Transaction.validateTransaction(transaction)) {
                        console.error('Invalid transaction!');
                        return false;
                    }

                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });

                    if (transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount!');
                        return false;
                    }

                    if (transactionSet.has(transaction)) {
                        console.error('An identical transaction appears more than once in the block');
                        return false;
                    } else {
                        transactionSet.add(transaction);
                    }
                }
            }
        }
        return true;
    }
}


module.exports = Blockchain;

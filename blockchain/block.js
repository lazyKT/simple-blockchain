const hextToBinary = require('hex-to-binary');
const { GENESIS_DATA, MINE_RATE } = require('../config');
const cryptoHash = require('../utils/crypto-hash');

class Block {
    constructor({timestamp, lastHash, hash, data, nonce, difficulty}) {
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty;
    }

    static genesis () {
        return new this(GENESIS_DATA);
    }

    static mineBlock ({ lastBlock, data }) {
        let hash, timestamp;
        const lastHash = lastBlock.hash;
        let difficulty = lastBlock.difficulty;
        let nonce = 0;

        do {
            // compute hash until the No.of.leadingZeros of the computed hash matches the difficulty
            nonce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp });
            hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
        } while (hextToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

        return new this({
            lastHash, data, timestamp, difficulty, nonce, hash
        });
    }

    static adjustDifficulty ({ originalBlock, timestamp }) {
        const { difficulty } = originalBlock;
        const timestampDifference = timestamp - originalBlock.timestamp;

        // difficulty will never be lower than 1
        if (difficulty < 2) return 1;

        // lowers the difficulty for a slower mined block, 
        // raises the difficulty for a quickly mined block
        return timestampDifference > MINE_RATE ? difficulty - 1:  difficulty + 1;
    }
}

module.exports = Block;

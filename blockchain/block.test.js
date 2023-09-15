const hextToBinary = require('hex-to-binary');
const Block = require('../blockchain/block');
const { GENESIS_DATA, MINE_RATE } = require('../config');
const { cryptoHash } = require('../utils');


describe('Block', () => {

    const timestamp = 'a-date';
    const lastHash = 'foo-hash';
    const hash = 'bar-hash';
    const data = ['blockchain', 'data'];
    const nonce = 1;
    const difficulty = 1;
    const block = new Block({
        timestamp, lastHash, hash, data, nonce, difficulty
    });

    it('has a timestamp, lastHash, hash and data property', () => {
        expect(block.timestamp).toEqual(timestamp);
        expect(block.nonce).toEqual(nonce);
        expect(block.difficulty).toEqual(difficulty);
    });
});


describe('Genesis Block', () => {
    const genesisBlock = Block.genesis();
    it('is a Block instance', () => {
        expect(genesisBlock instanceof Block).toBeTruthy();
    });

    it('returns genesis data', () => {
        expect(genesisBlock).toEqual(GENESIS_DATA);
    });
});


describe('Mine Block', () => {
    const lastBlock = Block.genesis();
    const data = 'mined data';
    const minedBlock = Block.mineBlock({ lastBlock, data });
    it('is a Block instance', () => {
        expect(minedBlock instanceof Block).toBeTruthy();
    });

    it('sets the `lastHash` to be `hash` of the lastBlock', () => {
        expect(minedBlock.lastHash).toEqual(lastBlock.hash);
    });

    it('sets the `data`', () => {
        expect(minedBlock.data).toEqual(data);
    });

    it('sets the `timestamp`', () => {
        expect(minedBlock.timestamp).not.toEqual(undefined);
    });

    it('creates a `SHA-256 hash` based on the proper inputs', () => {
        const computedHash = cryptoHash(
            minedBlock.timestamp, minedBlock.nonce, minedBlock.difficulty, lastBlock.hash, data
        );
        expect(minedBlock.hash).toEqual(computedHash);
    });

    it('sets a `hash` that matches the difficulty criteria', () => {
        const initialHash = hextToBinary(minedBlock.hash).substring(0, minedBlock.difficulty);
        expect(initialHash).toEqual('0'.repeat(minedBlock.difficulty));
    });

    it('adjusts the difficulty', () => {
        const possibleResults = [lastBlock.difficulty+1, lastBlock.difficulty-1];

        expect(possibleResults.includes(minedBlock.difficulty)).toBeTruthy();
    });
});


describe('Adjust difficulty()', () => {

    const timestamp = 2000;
    const lastHash = 'foo-hash';
    const hash = 'bar-hash';
    const data = ['blockchain', 'data'];
    const nonce = 1;
    const difficulty = 3;
    const block = new Block({
        timestamp, lastHash, hash, data, nonce, difficulty
    });

    it('raises the difficulty for a quickly mined block', () => {
        const increasedDifficulty = Block.adjustDifficulty({
            originalBlock: block ,
            timestamp: block.timestamp + MINE_RATE - 100
        });
        expect(increasedDifficulty).toEqual(block.difficulty + 1);
    });

    it('lowers the difficulty for a slower mined block', () => {
        const decreasedDifficulty = Block.adjustDifficulty({
            originalBlock: block ,
            timestamp: block.timestamp + MINE_RATE + 100
        });
        expect(decreasedDifficulty).toEqual(block.difficulty - 1);
    });

    it('has a lower limit of 1', () => {
        block.difficulty = -1;

        expect(Block.adjustDifficulty({ originalBlock: block })).toEqual(1);
    });
});

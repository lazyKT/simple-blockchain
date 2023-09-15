
const MINE_RATE = 1000; // 1s
const INITIAL_DIFFICULTY = 3;

const GENESIS_DATA = {
    timestamp: 1,
    lastHash: '000000',
    hash: '111111',
    data: [],
    nonce: 0,
    difficulty: INITIAL_DIFFICULTY
};

const STARTING_BALANCE = 1000;

module.exports = { GENESIS_DATA, MINE_RATE, STARTING_BALANCE };

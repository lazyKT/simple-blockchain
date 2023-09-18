const Blockchain = require('../blockchain');
const Block = require('./block');
const { cryptoHash } = require('../utils');
const Wallet = require('../wallet/index');
const Transaction = require('../wallet/transaction');


describe('Blockchain', () => {
    const blockchain = new Blockchain();

    it('contains a `chain` Array instance', () => {
        expect(blockchain.chain instanceof Array).toBeTruthy();
    });

    it('starts with the genesis block', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis());
    });

    it('adds a new Block to the chain', () => {
        const data = 'foo';
        blockchain.addBlock({ data });

        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(data)
    });
});


describe('Blockchain Validation', () => {
    
    let blockchain;

    beforeEach(() => {
        blockchain = new Blockchain();
        blockchain.addBlock({ data: 'foo' });
        blockchain.addBlock({ data: 'bar' });
        blockchain.addBlock({ data: 'baz' });
    });

    it('when the chain does not start with the genesis block', () => {
        blockchain.chain[0] = { data: 'fake-genesis' };
        expect(Blockchain.isValidChain(blockchain.chain)).toBeFalsy();
    });

    describe ('when the chain starts with the genesis block and has multiple blocks', () => {
        it('lastHash reference has changed', () => {
            blockchain.chain[2].lastHash = 'broken-lastHash';

            expect(Blockchain.isValidChain(blockchain.chain)).toBeFalsy();
        });

        it('contains a block with an invalid field', () => {
            blockchain.chain[2].data = 'bad-data';

            expect(Blockchain.isValidChain(blockchain.chain)).toBeFalsy();
        });

        it('contains a block with a jumped difficulty', () => {
            const lastBlock = blockchain.chain[blockchain.chain.length - 1];
            const lastHash = lastBlock.hash;
            const timestamp = Date.now();
            const nonce = 0;
            const data = [];
            const difficulty = lastBlock.difficulty - 3;

            const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data);
            const badBlock = new Block({ timestamp, lastHash, hash, nonce, difficulty, data });
            blockchain.chain.push(badBlock);

            expect(Blockchain.isValidChain(blockchain.chain)).toBeFalsy();
        });

        it('all blocks are valid', () => {
            expect(Blockchain.isValidChain(blockchain.chain)).toBeTruthy();
        });
    });
});


describe('Blockchain Replacement', () => {

    let blockchain, newChain, originalChain;
    let errorMock, logMock;

    beforeEach(() =>  {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        originalChain = blockchain.chain;

        errorMock = jest.fn();
        logMock = jest.fn();

        global.console.error = errorMock;
        global.console.log = logMock;
    });

    describe('when the new chain is not longer', () => {
        beforeEach(() => {
            newChain.chain[0] = { new: 'chain' };
            blockchain.replaceChain(newChain.chain);
        });

        it('does not replace the chain', () => {
            expect(blockchain.chain).toEqual(originalChain);
        });

        it('logs an error', () => {
            expect(errorMock).toHaveBeenCalled();
        });
    });

    describe('when the new chain is longer', () => {

        beforeEach(() =>  {
            blockchain = new Blockchain();
            newChain = new Blockchain();
            blockchain.addBlock({ data: 'foo' });
            blockchain.addBlock({ data: 'bar' });
            blockchain.addBlock({ data: 'baz' });
            originalChain = blockchain.chain;
            newChain.addBlock({ data: 'foo' });
            newChain.addBlock({ data: 'bar' });
            newChain.addBlock({ data: 'baz' });
            newChain.addBlock({ data: 'bush' });
        });

        it('the chain is invalid and does not replcae the chain', () => {
            newChain.chain[2].hash = 'some-fake-hash';
            blockchain.replaceChain(newChain.chain);
            expect(blockchain.chain).toEqual(originalChain);

            expect(errorMock).toHaveBeenCalled();
        });
    
        it('the chain is valid and does replace the chain', () => {
            blockchain.replaceChain(newChain.chain);
            expect(blockchain.chain).toEqual(newChain.chain);
        });

        it('the `validTransactionData` flag is true', () => {
            const validTransactionDataMockFn = jest.fn();
            blockchain.validTransactionData = validTransactionDataMockFn;
            blockchain.replaceChain(newChain.chain, true);
            expect(validTransactionDataMockFn).toHaveBeenCalled();
        });
    })
});


describe('validTransactionData()', () => {
    let transaction, rewardTransaction, wallet;
    let blockchain, newChain;

    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        wallet = new Wallet();
        transaction = wallet.createTransaction({ recipient: 'foo', amount: 65 });
        rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
    });

    it('the transaction data is valid', () => {
        newChain.addBlock({ data: [transaction, rewardTransaction] });

        const isValidData = blockchain.validTransactionData({ chain: newChain.chain });

        expect(isValidData).toBeTruthy();
    });

    it('the transaction data has multiple rewards', () => {
        newChain.addBlock({ data: [transaction, rewardTransaction, rewardTransaction] });

        const isValidData = blockchain.validTransactionData({ chain: newChain.chain });

        expect(isValidData).toBeFalsy();
    });

    describe('the transaction data has at least of one malformed outputMap', () => {
        it('transaction is not a reward transaction', () => {
            transaction.outputMap[wallet.publicKey] = 999999;

            newChain.addBlock({ data: [transaction, rewardTransaction] });

            const isValidData = blockchain.validTransactionData({ chain: newChain.chain });

            expect(isValidData).toBeFalsy();
        });

        it('transaction is a reward transaction', () => {
            rewardTransaction.outputMap[wallet.publicKey] = 999999;

            newChain.addBlock({ data: [transaction, rewardTransaction ] });

            const isValidData = blockchain.validTransactionData({ chain: newChain.chain });

            expect(isValidData).toBeFalsy();
        });
    });

    it('the transaction data has at least one malformed input', () => {
        wallet.balance = 9000;

        const evilOutputMap = {
            [wallet.publicKey]: 8900,
            fooRecipient: 100
        };

        const evilTransaction = {
            input: {
                timestamp: Date.now(),
                amount: wallet.balance,
                address: wallet.publicKey,
                signature: wallet.sign(evilOutputMap)
            },
            outputMap: evilOutputMap
        };

        newChain.addBlock({ data: [evilTransaction, rewardTransaction] });

        const isValidData = blockchain.validTransactionData({ chain: newChain.chain });

        expect(isValidData).toBeFalsy();
    });

    it('a block contains multiple identical transactions', () => {
        newChain.addBlock({
            data: [transaction, transaction, transaction]
        });
        const isValidData = blockchain.validTransactionData({ chain: newChain.chain });

        expect(isValidData).toBeFalsy();
    });
});

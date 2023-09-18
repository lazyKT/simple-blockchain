const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');
const Blockchain = require('../blockchain/index');


describe('TransactionPool', () => {
  let transaction, transactionPool, wallet;

  beforeEach(() => {
    transactionPool = new TransactionPool();
    wallet = new Wallet();
    transaction = new Transaction({
      senderWallet: wallet,
      recipient: 'fake-recipient',
      amount: 50
    });
  });

  describe('setTransaction()', () => {
    it('add a `transaction`', () => {
      transactionPool.setTransaction(transaction);
      
      const addedTransaction = transactionPool.transactionMap[transaction.id];
      expect(addedTransaction).toBe(transaction);
    });
  });

  describe('getTransaction()', () => {
    it('returns an existing transaction given an input address', () => {
      transactionPool.setTransaction(transaction);
      const addedTransaction = transactionPool.getTransaction({ inputAddress: wallet.publicKey });
      expect(addedTransaction).toBe(transaction);
    });
  });

  describe('getValidTransactions()', () => {
    let validTransactions, errorMock;

    beforeEach(() => {
      errorMock = jest.fn();
      global.console.error = errorMock;

      validTransactions = [];

      for (let i = 0; i < 10; i++) {
        transaction = new Transaction({
          senderWallet: wallet,
          recipient: 'foo-recipient',
          amount: 50
        });
        if (i%3 === 0) {
          // invalid amount
          transaction.input.amount = 99999;
        } else if (i%3 === 1) {
          // invalid signature
          transaction.input.signature = new Wallet().sign('foo');
        } else {
          validTransactions.push(transaction);
        }
        transactionPool.setTransaction(transaction);
      }
    });

    it('return the valid `transactions`', () => {
      expect(transactionPool.getValidTransactions()).toEqual(validTransactions);
    });

    it('logs errors for the invalid transactions', () => {
      transactionPool.getValidTransactions();
      expect(errorMock).toHaveBeenCalled();
    });
  });

  describe('clear()', () => {
    it('clears the transactions', () => {
      transactionPool.clear();

      expect(transactionPool.transactionMap).toEqual({});
    });
  });

  describe('clearBlockchainTransactions()', () => {
    it('clears the pool of any existing blockchain transactions', () => {
      const blockchain = new Blockchain();
      const expectedTransactionMap = {};

      for (let i = 0; i < 6; i++) {
        const walletTransaction = new Wallet().createTransaction({
          recipient: 'foo',
           amount: 20
        });
        transactionPool.setTransaction(walletTransaction);

        if (i%2 === 0) {
          blockchain.addBlock({ data: [walletTransaction] });
        } else {
          expectedTransactionMap[walletTransaction.id] = walletTransaction;
        }
      }

      transactionPool.clearBlockchainTransactions({ chain: blockchain.chain });
      expect(transactionPool.transactionMap).toEqual(expectedTransactionMap);
    });
  });

});


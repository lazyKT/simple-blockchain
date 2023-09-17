const TransactionPoll = require('./transaction-poll');
const Transaction = require('./transaction');
const Wallet = require('./index');


describe('TransactionPoll', () => {
  let transaction, transactionPoll, wallet;

  beforeEach(() => {
    transactionPoll = new TransactionPoll();
    wallet = new Wallet();
    transaction = new Transaction({
      senderWallet: wallet,
      recipient: 'fake-recipient',
      amount: 50
    });
  });

  describe('setTransaction()', () => {
    it('add a `transaction`', () => {
      transactionPoll.setTransaction(transaction);
      
      const addedTransaction = transactionPoll.transactionMap[transaction.id];
      expect(addedTransaction).toBe(transaction);
    });
  });

  describe('getTransaction()', () => {
    it('returns an existing transaction given an input address', () => {
      transactionPoll.setTransaction(transaction);
      const addedTransaction = transactionPoll.getTransaction({ inputAddress: wallet.publicKey });
      expect(addedTransaction).toBe(transaction);
    });
  });

});


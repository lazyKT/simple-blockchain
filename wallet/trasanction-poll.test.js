const TransactionPoll = require('./transaction-poll');
const Transaction = require('./transaction');
const Wallet = require('./index');


describe('TransactionPoll', () => {
  let transaction, transactionPoll;

  beforeEach(() => {
    transactionPoll = new TransactionPoll();
    transaction = new Transaction({
      senderWallet: new Wallet(),
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

});


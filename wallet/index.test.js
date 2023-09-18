const Wallet = require('./index');
const Transaction = require('./transaction');
const Blockchain = require('../blockchain/index');
const { verifySignature } = require('../utils');
const { STARTING_BALANCE } = require('../config');

describe('Wallet', () => {
  let wallet;

  beforeEach(() => {
    wallet = new Wallet();
  });

  it('it has `balance`', () => {
    expect(wallet).toHaveProperty('balance');
  });

  it('has `publicKey`', () => {
    expect(wallet).toHaveProperty('publicKey');
  });

  describe('signing data', () => {
    const data = 'foobar';

    it('verifies a signature', () => {
      const isVerfied = verifySignature({
        publicKey: wallet.publicKey,
        data,
        signature: wallet.sign(data)
      });
      expect(isVerfied).toBeTruthy();
    });

    it('does not verify. Invalid signature', () => {
      const isVerfied = verifySignature({
        publicKey: wallet.publicKey,
        data,
        signature: (new Wallet()).sign(data)
      });
      expect(isVerfied).toBeFalsy();
    });
  });

  describe('createTransaction()', () => {
    it('transaction amount exceeds the balance', () => {
      expect(
        () => wallet.createTransaction({ amount: 999999, recipient: 'foo-recipient' })
      ).toThrow('Amount exceeds balance');
    });

    describe('transaction amount is valid', () => {
      let transaction, amount, recipient;

      beforeEach(() => {
        amount = 50;
        recipient = 'foo-recipient';
        transaction = wallet.createTransaction({ amount, recipient });
      });

      it('cretaes an instance of Transaction', () => {
        expect(transaction instanceof Transaction).toBeTruthy();
      });

      it('matches the `transaction input` with the wallet', () => {
        expect(transaction.input.address).toEqual(wallet.publicKey);
      });

      it('outputs the amount of the recipient', () => {
        expect(transaction.outputMap[recipient]).toEqual(amount);
      });
    });

    describe('a chain is passed', () => {
      it('calls `Wallet.calculateBalance`', () => {
        const calculateBalanceMock = jest.fn();
        const originalCalculateBalanceFn = Wallet.calculateBalance;
        Wallet.calculateBalance = calculateBalanceMock;

        wallet.createTransaction({
          recipient: 'foo',
          amount: 10,
          chain: (new Blockchain()).chain
        });

        expect(calculateBalanceMock).toHaveBeenCalled();

        Wallet.calculateBalance = originalCalculateBalanceFn;
      });
    });
  });

  describe('calculateBalance()', () => {
    let blockchain;

    beforeEach(() => {
      blockchain = new Blockchain();
    });

    it('there are outputs for the wallet and returns the `STARTING_BALANCE`', () => {
      const balance = Wallet.calculateBalance({
        chain: blockchain.chain,
        address: wallet.publicKey
      });
      expect(balance).toEqual(STARTING_BALANCE);
    });

    describe('there are outputs for the wallet', () => {
      let transactionOne, transactionTwo;

      beforeEach(() => {
        transactionOne = (new Wallet()).createTransaction({ recipient: wallet.publicKey, amount: 50 });

        transactionTwo = (new Wallet()).createTransaction({
          recipient: wallet.publicKey,
          amount: 60
        });

        blockchain.addBlock({ data: [transactionOne, transactionTwo] });
      });

      it('adds the sum of all outputs to the wallet balance', () => {
        const balance = Wallet.calculateBalance({
          chain: blockchain.chain,
          address: wallet.publicKey
        });
        const expectedBalance = transactionOne.outputMap[wallet.publicKey]
          + transactionTwo.outputMap[wallet.publicKey] + STARTING_BALANCE;

        expect(balance).toEqual(expectedBalance);
      });
    });

    describe('the wallet has made a transaction', () => {
      let recentTransaction;

      beforeEach(() => {
        recentTransaction = wallet.createTransaction({
          recipient: 'foo',
          amount: 30
        });
  
        blockchain.addBlock({ data: [recentTransaction] });
      });

      it('returns the ouput amount of the recent transaction', () => {
        const balance = Wallet.calculateBalance({
          chain: blockchain.chain,
          address: wallet.publicKey
        });
        expect(balance).toEqual(recentTransaction.outputMap[wallet.publicKey]);
      })
    });

    describe('there are outputs next to and after the recent transaction', () => {
      let recentTransaction, sameBlockTransaction, nextBlockTransaction;

      beforeEach(() => {
        recentTransaction = wallet.createTransaction({
          recipient: 'later-foo-address',
          amount: 60
        });

        sameBlockTransaction = Transaction.rewardTransaction({ minerWallet: wallet });

        blockchain.addBlock({ data: [recentTransaction, sameBlockTransaction] });

        nextBlockTransaction = (new Wallet()).createTransaction({
          recipient: wallet.publicKey,
          amount: 75
        });

        blockchain.addBlock({ data: [nextBlockTransaction] });
      });

      it('includes the output amounts in the returned balance', () => {
        const balance = Wallet.calculateBalance({
          chain: blockchain.chain,
          address: wallet.publicKey
        });
        const expectedBalance = 
          recentTransaction.outputMap[wallet.publicKey] +
          sameBlockTransaction.outputMap[wallet.publicKey] + 
          nextBlockTransaction.outputMap[wallet.publicKey];
        expect(balance).toEqual(expectedBalance);
      });
    });
  });

});

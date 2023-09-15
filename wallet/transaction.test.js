const Wallet = require('.');
const { verifySignature } = require('../utils');
const Transaction = require('./transaction');

describe('Transaction', () => {

  let transaction, senderWallet, recipient, amount;

  beforeEach(() => {
    senderWallet = new Wallet();
    recipient = 'recipient-pub-key';
    amount = 50;

    transaction = new Transaction({
      senderWallet, recipient, amount
    });
  });

  it('has an `id`', () => {
    expect(transaction).toHaveProperty('id');
  });

  describe('outputMap', () => {
    it('has an `outputMap`', () => {
      expect(transaction).toHaveProperty('outputMap');
    });

    it('outputs the amount to the recipient', () => {
      expect(transaction.outputMap[recipient]).toEqual(amount);
    });

    it('outputs the `remaining balance` for the `sender wallet`', () => {
      const remainingBalance = senderWallet.balance - amount;
      expect(transaction.outputMap[senderWallet.publicKey]).toEqual(remainingBalance);
    });
  });

  describe('input', () => {
    it('has an `input`', () => {
      expect(transaction).toHaveProperty('input');
    });

    it('has a `timestamp` in the input', () => {
      expect(transaction.input).toHaveProperty('timestamp');
    });

    it('sets the `amount` to the `senderWallet` balance', () => {
      expect(transaction.input.amount).toEqual(senderWallet.balance);
    });

    it('sets the `address` to the `senderWallet` publicKey', () => {
      expect(transaction.input.address).toEqual(senderWallet.publicKey);
    });

    it('signs the input', () => {
      const isVerified = verifySignature({
        publicKey: senderWallet.publicKey,
        data: transaction.outputMap,
        signature: transaction.input.signature
      });
      expect(isVerified).toBeTruthy();
    })
  });

  describe('Validate transaction', () => {

    let errorMock;

    beforeEach(() => {
      errorMock = jest.fn();

      global.console.error = errorMock;
    });

    describe('when the traction is `valid`', () => {
      it('returns true', () => {
        expect(Transaction.validateTransaction(transaction)).toBeTruthy();
      });
    });

    describe('when the traction is `invalid`', () => {
      it('and a transaction outputMap value is invalid', () => {
        transaction.outputMap[senderWallet.publicKey] = 9999999;

        expect(Transaction.validateTransaction(transaction)).toBeFalsy();

        expect(errorMock).toHaveBeenCalled();
      });

      it('and a transaction input signature is invalid', () => {
        transaction.input.signature  = new Wallet().sign('foo');

        expect(Transaction.validateTransaction(transaction)).toBeFalsy();

        expect(errorMock).toHaveBeenCalled();
      });
    });
  });

});

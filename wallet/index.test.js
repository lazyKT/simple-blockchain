const Wallet = require('./index');
const Transaction = require('./transaction');
const { verifySignature } = require('../utils');

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
  });

});

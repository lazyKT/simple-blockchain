const Wallet = require('./index');
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

});

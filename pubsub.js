const PubNub = require('pubnub');
const { randomUUID } = require('crypto');
const credentials = require('./credentials');


const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN'
};


class PubSub {
    constructor({ blockchain }) {
        this.blockchain = blockchain;
        this.pubnub = new PubNub({
            ...credentials,
            uuid: randomUUID()
        });

        this.pubnub.subscribe({ channels: Object.values(CHANNELS) });

        this.pubnub.addListener(this.listener());
    }

    listener() {
        return {
            message: (messageObject) => {
                const { channel, message } = messageObject;

                console.log(`Message received. Channel: ${channel}. Message: ${message}`);

                if (channel === CHANNELS.BLOCKCHAIN) {
                    const chain = JSON.parse(message);
                    this.blockchain.replaceChain(chain);
                }
            }
        }
    }

    publish({ channel, message }) {
        this.pubnub.publish({ channel, message });
    }

    broadcastChain () {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        });
    }
}


module.exports = PubSub;

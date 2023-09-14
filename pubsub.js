const PubNub = require('pubnub');
const { randomUUID } = require('crypto');
const credentials = require('./credentials');
const Blockchain = require('./blockchain');

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN'
};


class PubSub {
    constructor({ blockchain }) {
        this.blockchain = blockchain;
        this.pubnub = new PubNub({
            ...credentials,
            logVerbosity: true,
            userId: randomUUID()
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

    async publish({ channel, message }) {

       try {
        // unsubscribe the current channel, to prevent publishing message to itself
        this.pubnub.unsubscribe({ channels: [channel] });
        // publish message
        this.pubnub.publish({ channel, message });
        // subscribe again
        this.pubnub.subscribe({ channels: [channel] })
       } catch (err) {
        console.error('[ERROR] publish message:', err);
       }
    }

    broadcastChain () {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        });
    }
}

const blockchain = new Blockchain();
const pubsub = new PubSub({ blockchain });
pubsub.publish({ channel: CHANNELS.TEST, message: 'Hello!' });

module.exports = PubSub;

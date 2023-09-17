const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const RedisPubSub = require('./app/redis-pubsub');
const Wallet = require('./wallet');
const TransactionPool = require('./wallet/transaction-pool');

const app = express();
app.use(bodyParser.json());

const blockchain = new Blockchain();
const wallet = new Wallet();
const transactionPool = new TransactionPool();
let pubsub = null;

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;


setTimeout(() => pubsub.broadcastChain(), 1000);

app.get('/api/blocks', (req, res) => {
    res.send(blockchain.chain);
});


app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
})


app.post('/api/mine', (req, res) => {
    const { data } = req.body;

    blockchain.addBlock(({ data }));

    pubsub.broadcastChain();

    res.redirect('/api/blocks');
});


app.post('/api/transact', (req, res) => {
    try {
        const { amount, recipient } = req.body;

        let transaction = transactionPool.getTransaction({ inputAddress: wallet.publicKey });
        if (transaction) {
            transaction.update({ senderWallet: wallet, recipient, amount });
        } else {
            transaction = wallet.createTransaction({ recipient, amount });
        }
        transactionPool.setTransaction(transaction);

        pubsub.broadcastTransaction(transaction);

        res.json({ transaction });
    } catch (error) {
        return res.status(400).json({ type: 'error', message: error.message });
    }
});


// sync the chain of new nodes with the chain and transaction polls of root node at the server start up
const syncWithRootState = () => {
    // making request to root node `GET:: /api/blocks`
    // sync the response with the current node's chain
    request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);
            console.log('replace chain on a sync with', rootChain);
            blockchain.replaceChain(rootChain);
        }
    });

    // making request to root node `GET:: /api/transaction-pool-map`
    // sync the response with the current node's transaction pool
    request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const transactionPoolMap = JSON.parse(body);
            console.log('replace transaction-pool-map on a sync with', transactionPollMap);
            transactionPool.setMap(transactionPoolMap);
        }
    });
}




let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = PEER_PORT || DEFAULT_PORT;

app.listen(PORT, async () => {
    console.log(`app is running at localhost:${PORT}`);
    pubsub = await RedisPubSub.builder({ blockchain, transactionPoll });
    // only sync for the non-root node
    if (PORT !== DEFAULT_PORT) {
        syncWithRootState();
    }
});

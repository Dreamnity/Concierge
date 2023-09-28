const { WebSocket } = require('ws');
const ws = new WebSocket('ws://localhost:8000');
ws.on('message', function incoming(message) {
    console.log('received: %s', message);
}).on('open', function open() {
    ws.send(JSON.stringify({ newName: 'receive' }));
    console.log('connected!')
}).on('close', e => { throw e });
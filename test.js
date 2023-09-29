const {WebSocket} = require('ws');
const ws = new WebSocket(process.argv[2]);
ws.on('message',msg=>{
        dat=JSON.parse(msg.toString());
        ws.send(JSON.stringify({target:dat.origin,message:dat.message.split(' ').reverse().join(' ').split('').reverse().join('')}))
    }).on('open',()=>ws.send('{"newName":"echo"}'))
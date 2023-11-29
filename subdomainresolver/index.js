const { WebSocket } = require('ws');
const { Worker } = require('worker_threads');
const { parse } = require('../microconf/index');
const worker_list = {};
new WebSocket('wss://cc.dreamnity.in/subdomainresolver').on('message',raw=>{
    const event = parse(raw.toString(),true);
    console.log(event);
    if(event.event==='connect') {
        const [name,port] = (e=event.name.match(/(.*?)(?::([0-9]+))/m))?[e[1],parseInt(e[2])]:[event.name,80];
        if(!worker_list[port]) {
            const worker = new Worker('./worker.js',{name:event.name,workerData:{port}});
            worker.port = port;
            worker_list[port] = worker;
        }
        worker_list[port].postMessage({name,rawName:event.name});
    }
});
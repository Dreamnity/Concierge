const ConciergeClient =require("./client");
const cc = new ConciergeClient('tester', 'ws://cc.dreamnity.in/');
setTimeout(()=>cc.list().then(console.log),2000);
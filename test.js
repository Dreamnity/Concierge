const ConciergeClient =require("./client");
const cc = new ConciergeClient('tester', 'ws://localhost:8000/');
setTimeout(()=>cc.list().then(console.log),2000);
//the websocket server
var d={},f={};function hb(){this.ia=true}const g=new (b=require('ws')).WebSocketServer({noServer:1});g.on("connection",e=>{e.ia=1;let a=Buffer.from(((e._socket.address().address+[...g.clients.values()].findIndex(b=>b===e)).toString(16)+Math.floor((1+Math.random())*0x10000).toString(16).substring(1)).split('').filter(e=>/[0-9a-fA-F]/g.test(e)).join('').toUpperCase(),'hex').toString('base64url');d[a]=a;f[a]=e;console.log("Connected: %s",a);e.on("message",b=>{var c;try{c=JSON.parse(b);}catch(j){return e.send('{"error":"invalid payload","detailed":"'+j.message+'"}')}"object"!==typeof c&&e.send('{"error":"invalid payload"}');c.newName&&((Object.values(d).includes(c.newName)&&d[a]!==c.newName)?e.send('{"error":"duplicated name"}'):(()=>{b=d[a],d[a]=c.newName,b!==c.newName&&console.log("Name changed: %s => %s",b,d[a])})());if(c.target&&c.message){b=get(c.target);if(!b)return e.send('{"error":"invalid target"}');b.send(JSON.stringify({origin:d[a],message:c.message}));console.log("Sent: %s => %s: %s",d[a],c.target,c.message)}else(c.target||c.message)&&e.send('{"error":"invalid payload"}')}).on("close",()=>{delete d[a];delete f[a];console.log("Closed: %s",a)}).on('pong',hb);return a});setInterval(()=>g.clients.forEach(ws=>ws.ia?ws.ping((ws.ia=0)||null):ws.terminate()),30000)
//function to lookup clients by name(or special tag)
function get(t){b=Object.keys(d).find(h=>d[h]===t||h===t);return '@a'===t?{send:msg=>g.clients.forEach(ws=>ws.send(msg))}:t.startsWith('@r[')?{send:msg=>g.clients.forEach(ws=>d[Object.keys(f).find(e=>f[e]===ws)].match(new RegExp(...((gr)=>(gr[3]?[gr[3]]:[gr[1]||'^$',gr[2]]))(t.match(/@r(?:\[(.+),((?:[gmiyuvsd]){1,8})\]|\[(.+)\])/)))!==null&&ws.send(msg)))}:f[b]||f[t]}
p=Number.isNaN(p1=parseInt(process.argv[2]))?80:p1;
//public websocket client(for http)
const pu=new b.WebSocket('ws:localhost:'+p).on('open',()=>pu.send('{"newName":"PUBLIC"}'))
//the http server
const url=require('url')
require('http').createServer().on('upgrade',(r,s,h)=>{
    s.on('error',e=>console.error('Socket error\n',e));
    g.handleUpgrade(r,s,h,ws=>g.emit('connection',ws));
}).on('request',(q,s)=>{
    let l=url.parse(q.url),u=Object.fromEntries(new url.URLSearchParams(l.query));
    t=setTimeout(()=>s.end('{"error":"No response from target"}'),20000)
    pu.once('message',m=>{
        try{
        let d=JSON.parse(m.toString());
        d.error&&s.writeHead(500,d.error)}catch{}
        s.end(m.toString())
        clearTimeout(t)
    });
    if(!u.target&&(pn=l.pathname.split('/').slice(1))[0]) u.target=pn.join('.')
    pu.send(JSON.stringify(u))
}).listen(p);
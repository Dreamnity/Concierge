const http = require('http');
const server = http.createServer((req, res) => {
    try {
        const url = new URL(req.url, `https://${req.headers.host}`)
        const sub = url.host.match(/(.+)\.dreamnity\.in/)[1];
        req.pipe(
            http.get('http://localhost:8002/' + sub + '?' + req.url, res2 => {
                res.writeHead(res2.statusCode, res2.headers);
                res2.on('error',e=>res.end(e.message))
                res2.pipe(res, { end: true })
            }).on('error',e=>res.end(e.message)),
            { end: true }
        )
    }catch(e){res.end(e.message)}
}).listen(8001)
process.on('uncaughtException',e=>console.error(e))

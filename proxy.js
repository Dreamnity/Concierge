if(process.platform!=='linux') {console.error('Unsupported operating system(linux required): '+process.platform)}
process.argv[0] = process.argv[0].match(/\/([^/]+)$/)[1]
try {require('ws');require('./microconf.js')}catch{console.error('Install dependency using "'+process.argv.join(' ')+' install" first');process.exit(1)}
//Install websocket
if(process.argv[2]==='install'||process.argv[2]==='update') {
    console.log('Installing websocket library(ws)...');
    require('child_process').execSync('npx -y pnpm i ws');
    console.log('Installing configuration library(microconf)...');
    require('child_process').execSync('wget https://github.com/Dreamnity/MicroConf/raw/main/index.js -O ./microconf.js');
}
if(!(/^[0-9]+$/.test(process.argv[2]||'')&&/^[a-zA-Z0-9\/._-]+$/.test(process.argv[3]||''))) {
    console.error('Dreamnity\'s subdomain proxy\nUsage:\n'+process.argv.join(' ')
    +' <port> <name>\nOptions:\n - port: port to forward to the subdomain\n - name: the name that will be on servicename.dreamnity.in'
    +'\nUpdate with "'+process.argv.join(' ')+' update"')
    process.exit();
}
const {WebSocket} = require('ws');
const {get} = require('http')
const {parse,stringify} = require('./microconf');
const [name,port] = [process.argv[3],parseInt(process.argv[2])];
const ws = new WebSocket('ws://cc.dreamnity.in/'+name).on('open',()=>console.log('Listening to '+name+'.dreamnity.in, Forwarding to http://localhost:'+port));
ws.on('message',async event=>{
    if(event.toString()==='ok') return;
    console.log(event.toString());
    const data = parse(event.toString());
    if(data.error) console.error(event.error);
    if(data.event!=='request') return;
    try {
        const res = stringify(await req(new URL('http://localhost:'+port+data.payload)));
        //console.log(res)
        ws.send('reply '+res)
    }catch(err){
        ws.send('reply '+stringify({options:{statusCode:500},result:err.message}))
    }
}).on('error',console.error).on('close',()=>'Connection closed unexpectedly');
function req(url) {
    return new Promise((resolve, reject) => {
      get({
        hostname: url.hostname,
        path: url.pathname,
        pathname: url.pathname,
        port: url.port
      }, (res) => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (data) => {
          rawData += data;
        });
  
        res.on('end', () => {
          /* Runs the resolve function when the request ends. */
          delete res.headers.date;
          resolve({result:rawData,options:{statusCode:res.statusCode,statusMessage:res.statusMessage,headers:res.headers}});
        });
        res.on('error', (err) => {
          /* Runs the reject function if an error occurs. */
          reject(err);
        });
      }).on('error',(err=>reject(err)));
    });
  }
process.on('uncaughtException',err=>console.error(err));
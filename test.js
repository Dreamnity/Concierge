const Client = require('./client')
//The socket will be available on yournickname.dreamnity.in
const client = new Client()//('nickname(optional)','customserver, also optional')
//Message from other sockets
client.on('message',({from,message})=>console.log('Got message from '+from+': '+message));
//Where the fun begin
client.on('request',(payload)=>client.reply('Here is what you sent using searchParams: '+payload));
//Get list of connected sockets
client.list().then(list=>console.log(list));
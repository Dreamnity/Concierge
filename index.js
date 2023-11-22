const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const MicroConf = require('./microconf/index');
function hb() {
	this.hb = true;
}
const server = new WebSocketServer({
	noServer: true,
})
  .on('connection', (client, req) => {
    client.sendData = client.send;
    client.send = data=>client.sendData(typeof data==='string'?data:MicroConf.stringify(data));
		const name = req.url.substr(1);
		if (name && (!/[a-zA-Z0-9\/._-]+/m.test(name) || find(name)))
      client.close(undefined, { error: name_incorrect_format });
		client.name = name || false; //unauthenticated
		let e = client;
		client.id = Buffer.from(
			(
				(
					e._socket.address().address +
					[...server.clients.values()].findIndex(b => b === e)
				).toString(16) +
				Math.floor((1 + Math.random()) * 0x10000)
					.toString(16)
					.substring(1)
			)
				.split('')
				.filter(e => /[0-9a-fA-F]/g.test(e))
				.join('')
				.toUpperCase(),
			'hex'
		).toString('base64url');
		broadcast({ 'event': 'connect', 'name': client.name || client.id });
		client
			.on('message', msg => {
				console.log('[' + (client.name || client.id) + '] ' + msg);
				const re = client.send;
				try {
					msg = msg.toString();
					const endpraw = msg.match(
						/^(?:(send) [^ ]+ .+|(reply) .+|(name) .+|(list))$/m
					);
					const endp = endpraw ? endpraw.slice(1).join('') : '';
					if (!client.name && endp != 'name')
            return client.send({ error: 'name_unspecified' });
					const e = {};
					switch (endp) {
						case 'name':
							e.reg = msg.match(/^name ([a-zA-Z0-9\/._-]+)$/m);
              if (!e.reg) return client.send({ error: 'name_incorrect_format' });
							if (find(e.reg[1])) return client.send({error: 'name_duplicated'});
							client.name = e.reg[1];
							return client.send('ok');
						case 'send':
							e.reg = msg.match(/^send ([a-zA-Z0-9\/._-]+) (.*)$/m);
              if (!e.reg) return client.send({ error: 'invalid_name' });
							e.target = find(e.reg[1]);
							if (!e.target) return client.send({error: 'target_not_found'});
              if (!e.reg[2]) return client.send({ error: 'content_empty' });
							e.target.lastsender = client;
              e.target.send({ event: 'message', origin: client.name, message: e.reg[2] });
							return client.send('ok');
						case 'reply':
							e.reg = msg.match(/^reply (.+)$/m);
							if (!e.reg[1]) return client.send({error: 'content_empty'});
							if (!client.lastsender)
								return client.send({error: 'target_not_found'});
							client.lastsender.lastsender = client;
							client.lastsender.send({ event: 'message', origin: client.name, message: e.reg[1] });
							return client.send('ok');
						case 'list':
							return client.send(
								JSON.parse('{' +
									[...server.clients.values()]
										.map(e => JSON.stringify(e.id) + ':' + JSON.stringify((e.name || '_unnamed_')))
										.join(',')+'}')
							);
						default:
              return client.send({ error: 'endpoint_not_found_or_wrong_usage' });
					}
				} catch (e) {
					client.send('error internal ' + e.message);
				}
			})
      .on('error', e => client.send({ 'error': 'internal ' + e.message }))
      .on('close', () => broadcast({ 'event': 'disconnect', 'name': client.name || client.id }))
			.on('pong', hb);
	})
	.on('error', () => {})
	.on('listening', () => console.log('Working.'));
function find(query) {
	return [...server.clients.values()].find(
		e =>
			e.id == query || e.name == query || e._socket.address().address == query
	);
}
function broadcast(msg) {
	console.log('[broadcast] ' + (typeof msg==='string'?msg:MicroConf.stringify(msg)));
	server.clients.forEach(ws => ws.send(msg));
}

const httpserver = createServer((req, res) => {
	let url = new URL(req.url, 'https://example.com');
	console.log('[http] ' + req.url);
	var data = '';
	req.on('data', e => (data += e));
	const path = url.pathname.substring(1);
	if (!path)
		return res.end(
			'list ' +
				MicroConf.stringify(JSON.parse('{' +
        [...server.clients.values()]
          .map(e => JSON.stringify(e.id) + ':' + JSON.stringify((e.name || '_unnamed_')))
          .join(',')+'}'))
		);
	const target = find(path);
  if (!target) return res.end(MicroConf.stringify({ 'error': 'target_not_found' }));
	target.lastsender = {
    send: msg => {
      const {options,result} = MicroConf.parse(msg.message);
      res.end(result||'ok',options||null);
    }
	};
  req.on('end', () => target.send({ event: 'request', payload: (data || url.search.substr(1)) }));
})
	.on('upgrade', (request, socket, head) =>
		server.handleUpgrade(request, socket, head, function done(ws) {
			server.emit('connection', ws, request);
		})
	)
	.listen(parseInt(process.argv[2]) || 8002);
//setInterval(()=>server.clients.forEach(ws=>ws.hb?ws.ping((ws.hb=0)||null):ws.terminate(console.log('[system] timedout '+(ws.name||ws.id)))),30000);
setInterval(() => server.clients.forEach(ws => ws.ping()), 30000);

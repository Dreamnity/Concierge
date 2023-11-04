const { WebSocketServer } = require("ws");
const { createServer } = require('http');
const server = new WebSocketServer({
	noServer: true,
})
	.on("connection", (client,req) => {
		client.name = req.url.substr(1)||false; //unauthenticated
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
				.split("")
				.filter(e => /[0-9a-fA-F]/g.test(e))
				.join("")
				.toUpperCase(),
			"hex"
		).toString("base64url");
		client
			.on("message", msg => {
				console.log('['+(client.name||client.id)+'] '+msg)
				const re = client.send;
                try {
                    msg = msg.toString();
					const endpraw = msg
						.match(/^(?:(send) [^ ]+ .+|(reply) .+|(name) .+|(list))$/m);
                    const endp = endpraw ? endpraw.slice(1).join("") : "";
					if (!client.name && endp != "name")
						return client.send("error name_unspecified");
					const e = {};
					switch (endp) {
						case "name":
                            e.reg = msg.match(/^name ([a-zA-Z0-9\/.]+)$/m);
							if (!e.reg) return client.send("error name_incorrect_format");
							if (find(e.reg[1])) return client.send("error name_duplicated");
							client.name = e.reg[1];
							return client.send("ok");
						case "send":
							e.reg = msg.match(/^send ([a-zA-Z0-9\/.]+) (.*)$/m);
							e.target = find(e.reg[1]);
							if (!e.target) return client.send("error target_not_found");
							if (!e.reg[2]) return client.send("error content_empty");
							e.target.lastsender = client;
							e.target.send("message " + client.name + " " + e.reg[2]);
							return client.send("ok");
						case "reply":
							e.reg = msg.match(/^reply (.+)$/m);
							if (!e.reg[1]) return client.send("error content_empty");
							if (!client.lastsender) return client.send("error target_not_found");
							client.lastsender.send("message " + client.name + " " + e.reg[1]);
							return client.send("ok");
						case "list":
							return client.send(
								"list " +
									[...server.clients.values()]
										.map(e => e.id + ":" + e.name)
										.join(",")
							);
						default:
							return client.send("error endpoint_not_found_or_wrong_usage");
					}
				} catch (e) {
					client.send("error internal " + e.message);
				}
			})
			.on("error", e => client.send("error internal " + e.message));
	})
	.on("error", () => { })
	.on('listening',()=>console.log('Working.'));
function find(query) {
	return [...server.clients.values()].find(
		e =>
			e.id == query || e.name == query || e._socket.address().address == query
	);
}

const httpserver = createServer((req, res) => {
	var data = "";
	req.on("data", e => (data += e));
	const path = req.url.substring(1);
	if(!path) return res.end(
		'list '+[...server.clients.values()].map(e => e.id + ":" + e.name).join(",")
	);
	const target = find(path);
	if (!target) return res.end('error target_not_found');
	target.lastsender = { send: msg => res.end(msg.match(/^message .+ (.+)$/s)[1]) };
	req.on("end", () => target.send("request " + data));
}).on('upgrade',(request, socket, head)=>server.handleUpgrade(request, socket, head, function done(ws) {
      server.emit('connection', ws, request);
    })
).listen(parseInt(process.argv[2])||80);
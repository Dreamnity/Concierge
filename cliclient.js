const { WebSocket } = require("ws");
const readline = require("readline");
const ws = new WebSocket(process.argv[2]).on("open", () =>
	console.log("Connected")
);
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
rl.on("line", line => {
	let text = line.toString();
	ws.send(text);
	//process.stdout.write('> ');
});
ws.on("message", msg => {
	process.stdout.write("\r↓ " + msg + "\n↑ ");
});

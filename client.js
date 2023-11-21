const {EventEmitter} = require("events");
const { WebSocket } = require("ws");
class ConciergeClient extends EventEmitter {
	#ws;
	constructor(name='', host='') {
		super();
		this.#ws = new WebSocket((host || "ws://cc.dreamnity.in/") + name).on('open',()=>this.emit('ready'));
		this.#ws.on('message', msgraw => {
			let msg = msgraw.toString();
			let match;
			match = msg.match(/^message (?<from>[^ ]+) (?<message>.+)$/m);
			if (match&&this.pendingRequest<=0) {
				return this.emit('message',match.groups);
			}
			match = msg.match(/^request (?<payload>.*)$/m);
			if (match) {
				return this.emit("request", match?.groups?.payload);
			}
			match = msg.match(/^connect (?<name>.+)$/m);
			if (match) {
				return this.emit("connect", match?.groups?.name);
			}
			match = msg.match(/^disconnect (?<name>.+)$/m);
			if (match) {
				return this.emit("disconnect", match?.groups?.name);
			}
			match = msg.match(/^error (?<message>.+)$/m);
			if (match&&this.pendingRequest<=0) {
				return this.emit("error", match?.groups?.message);
			}
		})
		this.#ws.on('open',()=>this.emit('ready'))
	}
	async list() {
		return (await this.#request("list")).substr(5).split(",").map(e => {
			const [id, name] = e.split(":");
			return { id, name };
		});
	}
	send(target, message) {
		return this.#request(`send ${target} ${message}`);
	}
	reply(message) {
		return this.#request(`reply ${message}`);
	}
	name(newName) {
		return this.#request(`name ${newName}`);
	}
	#request(data) {
		return new Promise((r, j) => {
			const fn = (data) => {
				data = data.toString()
				if (data.startsWith("error ")) return j(data);
				r(data);
				this.pendingRequest--;
			};
			setTimeout(() => {
				this.#ws.removeListener("message", fn);
				j("error client_timed_out");
			}, 5000);
			this.#ws.once("message", fn).send(data);
			this.pendingRequest++;
		});
	}
	pendingRequest=0;
}
module.exports=ConciergeClient;
import EventEmitter from "events";
import WebSocket from "ws";
class ConciergeClient extends EventEmitter {
	#ws: WebSocket;
	constructor(name?: string, host?: string) {
		super();
		this.#ws = new WebSocket((host || "https://cc.hop.sh/") + name).on('open',()=>this.emit('ready'));
		this.#ws.on('message', msgraw => {
			let msg: string = msgraw.toString();
			let match: RegExpMatchArray | null;
			match = msg.match(/^message (?<from>[^ ]+) (?<message>.+)$/m);
			if (match) {
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
			if (match) {
				return this.emit("error", match?.groups?.message);
			}
		})
	}
	async list() {
		return (await this.#request("list")).split(",").map(e => {
			const [id, name] = e.split(":");
			return { id, name };
		});
	}
	send(target: string, message: string) {
		return this.#request(`send ${target} ${message}`);
	}
	reply(message: string) {
		return this.#request(`reply ${message}`);
	}
	name(newName: string) {
		return this.#request(`name ${newName}`);
	}
	#request(data: string): Promise<string> {
		return new Promise((r, j) => {
			const fn = (data: string) => {
				if (data.startsWith("error ")) return j(data);
				r(data);
			};
			setTimeout(() => {
				this.#ws.removeListener("message", fn);
				j("error client_timed_out");
			}, 5000);
			this.#ws.once("message", fn).send(data);
		});
	}
}
export default ConciergeClient;
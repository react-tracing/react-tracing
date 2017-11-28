import * as express from "express";
import { Server } from "http";

export default function generateServer(timeout: number) {
	return new Promise<Server>(resolve => {
		const app = express();
		app.all("/", (req, res) => {
			setTimeout(
				() =>
					res.status(202).json({
						done: true
					}),
				timeout
			);
		});

		const server = app.listen(0);
		resolve(server);
	});
}

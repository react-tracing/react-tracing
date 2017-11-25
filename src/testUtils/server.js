import express from "express";

export default function generateServer(timeout) {
	return new Promise(resolve => {
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

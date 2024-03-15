/*
 * This is a pass-through proxy server that forwards all requests, including
 * headers, body, query parameters to the target domain with the same path.
 * 
 * e.g. localhost/cloud/v2/universes/%s/places/%s/instances/%s will be
 * forwarded to https://apis.roblox.com/cloud/v2/universes/%s/places/%s/instances/%s
 * 
 * This was originally developed for the new Open Cloud Engine API, but can be
 * used for any Roblox API.
*/

import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import https from "https";

const BASE_URL = "https://apis.roblox.com";

const agent = new https.Agent({
	rejectUnauthorized: false
});

const app = express();

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.get("/", (_, res) =>
{
	res.json({
		status: "ok",
	})
});

app.all("/cloud/*", async (req, res, next) =>
{
	try
	{
		console.log("\n", req.method, req.headers, req.body);

		const url = `${BASE_URL}${req.originalUrl}`;
		console.log(`Forwarding request to ${url}...`);

		const body = ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body);
		const response = await fetch(url, {
			method: req.method,
			headers: {
				"content-type": "application/json",
				"x-api-key": req.headers["x-api-key"],
			},
			body,
			agent
		});

		const data = await response.text();
		console.log(`Roblox responded with: [${response.status}] ${data}`);

		// Return the response from Roblox
		res.status(response.status).send(data);
	} catch (err)
	{
		next(err);
	}
});

// ensure that errors are caught
app.use((err, _, res) =>
{
	console.error(err);
	res.status(500).send(`An error occurred: ${err.message}`);
});

app.listen(3000, () => console.log("Server is running on port 3000"));

// Require minimist module
import minimist from 'minimist';
const args = minimist(process.argv.slice(2))
// See what is stored in the object produced by minimist
console.log(args)
// Store help text 
const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

import express from 'express';
import { coinFlip, coinFlips, countFlips, flipACoin } from './modules/coin.mjs';
import { db } from './database.js';
import fs from 'fs';
import morgan from 'morgan';

const HTTP_PORT = args.port || 5555;
const debug = args.debug || false;
const log = args.log || true;

const app = express();

const logger = function(req, res, next) {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }
    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const x = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent);
    next();
}

app.use(logger);

if (debug) {
    app.get('/app/log/access', (req, res) => {
        const stmt = db.prepare('SELECT * FROM accesslog').all();
        res.status(200).json(stmt);
    });

    app.get('/app/error', (req, res, next) => {
        throw new Error('Error Test Successful');
    });
}

if (log !== 'false') {
    // Use morgan for logging to files
    // Create a write stream to append (flags: 'a') to a file
    const accesslog = fs.createWriteStream('access.log', { flags: 'a' })
    // Set up the access logging middleware
    app.use(morgan('combined', { stream: accesslog }))
}
  

app.get('/app/', (req, res) => {
    res.statusCode = 200;
    res.statusMessage = 'OK';
    res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
    res.end(res.statusCode+ ' ' +res.statusMessage);
});

app.get('/app/flip/', (req, res) => {
    res.statusCode = 200;
    res.json({ "flip": coinFlip() });
});

app.get('/app/flips/:number', (req, res) => {
   res.statusCode = 200;
   const flips = coinFlips(parseInt(req.params.number));
   const stats = countFlips(flips);
   res.json({ "raw": flips, "summary": stats });
});

app.get('/app/flip/call/:guess', (req, res) => {
    res.statusCode = 200; 
    const guess = req.params.guess;
    if (guess === "heads" || guess === "tails") {
        res.json(flipACoin(req.params.guess));
    } else {
        res.json({ 'status': 400, 'msg': 'Wrong guess name.'});
    }
});

const server = app.listen(HTTP_PORT, () => {
    console.log(`App listening on port ${HTTP_PORT}`);
});
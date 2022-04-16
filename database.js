import Database from 'better-sqlite3';

const db = new Database('log.db');
const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`);
let row = stmt.get();
if (row === undefined) {
    console.log('Your database appears to be empty. I will initialize it now.');
    const sqlInit = `
        CREATE TABLE accesslog (id INTEGER PRIMARY KEY, time INTEGER, remoteaddr TEXT, remoteuser TEXT, method TEXT, url TEXT, protocol TEXT, httpversion TEXT, secure TEXT, status TEXT, referer TEXT, useragent TEXT );
    `;
    db.exec(sqlInit);
    console.log('Your database has been initialized with a new table and two entries containing a username and password.');
} else {
    console.log('Database exists.')
}

export {db};
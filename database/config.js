/*
    host: 'localhost',
    port: 8889,
    user: 'root',
    password: 'root',
    database: 'KlinkDB_local'
*/

var mysql = require('mysql');

// const dbconn = mysql.createConnection({
//     host: 'klinkdb-mysql.cjyqnatick03.ca-central-1.rds.amazonaws.com',
//     port: 3306,
//     user: 'admin',
//     password: 'admin123',
//     database: 'kLinkDB_aws'
// });


const dbconn = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    //user: 'admin',
    user: 'root',
    password: 'admin123',
    database: 'KlinkDB_local'
});


// Export the pool
module.exports = dbconn;


var connection;

function handleDisconnect() {
    connection = mysql.createConnection({

        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'admin123',
        database: 'KlinkDB_local'
        // host: 'klinkdb-mysql.cjyqnatick03.ca-central-1.rds.amazonaws.com',
        // port: 3306,
        // user: 'admin',
        // password: 'admin123',
        // database: 'kLinkDB_aws'
    }); // Recreate the connection, since
    // the old one cannot be reused.

    connection.connect(function(err) { // The server is either down
        if (err) { // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        } // to avoid a hot loop, and to allow our node script to
    }); // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect(); // lost due to either server restart, or a
        } else { // connnection idle timeout (the wait_timeout
            throw err; // server variable configures this)
        }
    });
}

handleDisconnect();

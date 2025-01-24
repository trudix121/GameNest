const { pool } = require('../db/postdb');

async function createClientLog(log, username) {
    try {
        await pool.query(
            'INSERT INTO client_logs (log, client_username) VALUES ($1, $2)', 
            [log, username]
        );
       // console.log('Inserted client log with success');
    } catch (error) {
        throw new Error(`Error in createClientLog, ${error.message}`);
    }
}

module.exports = createClientLog
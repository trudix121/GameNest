const { pool } = require('../db/postdb')



async function add_log(log_type, player_id, log_data){

    if(!log_type || !player_id || !log_data){
        return 'Need all data completed'
    }
    else{
        await pool.query('INSERT INTO logs (type, player_id,log) VALUES ($1, $2, $3)', [log_type, player_id, log_data]).then(()=>{
           // console.log('Log has been register')
        })
    }


}

module.exports = add_log
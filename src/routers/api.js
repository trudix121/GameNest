// API FOR GAMENEST CLIENT PYTHON
const generatesessiondId = require('../lib/_sessionId')
const createClientLog = require('../lib/_client_log')
const gen_token = require('../lib/_token')
const express = require('express')
const router = express.Router()
const cors = require('cors')
const corsOptions = require('../lib/corsoptions')
const { pool } = require('../db/postdb')
const bcrypt = require('bcrypt')
const cookiejwt = require('../middlewares/jwt')

router.use(cors(corsOptions))
router.use(express.urlencoded({extended:true}))
router.use(express.json())

router.get('/gen_client', cookiejwt , async (req,res)=>{
//    console.log(req.user)
    const rest = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id])
    if(rest.rows[0]['client_token'] !== null){
        res.render("libs/error", {'code':203, 'error':`Client Token Already Generated, Token: ${rest.rows[0]['client_token']}`, 'redirect':'/home'})
    }
    else if(rest.rows[0]['client_token'] == null){
        const token = gen_token()
        await pool.query('UPDATE users SET client_token = $1 WHERE id = $2', [token, req.user.id])
        res.render("libs/error", {'code':200, 'error':`Token: ${token}`, 'redirect':'/home'})
    }
})




router.post('/login', async (req,res)=>{
    if(req.body.token == undefined){
        const { password, username} = req.body
        const rest = await pool.query("SELECT * FROM users WHERE username = $1", [username])
        if(rest.rows.length <= 0 ){res.status(201).json({'reason':'username invalid'})}
        else if(rest.rows.length > 0 ){
            const compare = await bcrypt.compare(password, rest.rows[0].password)
            if(compare){
                await createClientLog('New Login with Credentials' , rest.rows[0]['username'])
                res.status(200).json({'_id': rest.rows[0]['id'], '_sessionId': generatesessiondId(rest.rows[0]['id'])})
            }
            else{
                res.status(201).json({'reason':'invalid password'})
            }
        }
    }
    else{
        const {token} = req.body
        const rest = await pool.query('SELECT * FROM users WHERE client_token = $1', [token])
        if(rest.rows.length <= 0 ){res.status(201).json({'reason':'token invalid'})}
        else if(rest.rows.length > 0 ){
            await createClientLog('New Login with Token' , rest.rows[0]['username'])
            res.status(200).json({'_id': rest.rows[0]['id'], '_sessionId': generatesessiondId(rest.rows[0]['id'])})
        }
        
        }
})

const game_ids = new Map()

router.post("/snake", async (req,res)=>{
    if(game_ids.has(req.body.game_id)){
        await createClientLog('Fraud Trying at Snake Game', req.body.id)
        res.status(400).json({'reason':'game_ids already exists in database'})

    }
    else if(game_ids.has(req.body.game_id) == false){
        await pool.query('UPDATE users SET money = $1 WHERE id = $2', [req.body.score, req.body.id]).then(()=>{
             createClientLog(`User with id ${req.body.id}`)
        })
        game_ids.set(req.body.game_id, req.body.id)
        res.status(200).json({'reason':'ok'})
    }
})
module.exports = router
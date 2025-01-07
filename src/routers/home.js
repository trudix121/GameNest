const express = require('express')
const router = express.Router()
const cookiejwt = require('../middlewares/jwt')
const { pool } = require('../db/postdb')

router.use(cookiejwt)



router.get('/', (req,res)=>{
    res.render('home/home', {user: req.user})
})

router.get('/profile', (req,res)=>{
    console.log(req.user)
    res.render('home/profile', {user:req.user})
})

router.post('/profile/search', async (req,res)=>{
    const { username } = req.body

    const profile = await pool.query(`SELECT * FROM users WHERE username = $1`, [ username ])

    if(profile.rows.length <= 0 ){
        return res.render('libs/error', { code:404, error:'Profile Not Found' })
    }
    else if(profile.rows.length > 0 ){
        //console.log(profile.rows[0])
        return res.render('home/profile', {user:profile.rows[0]})
    }

    
})

module.exports = router
// API FOR GAMENEST CLIENT PYTHON

const express = require('express')
const router = express.Router()
const cors = require('cors')
const corsOptions = require('../lib/corsoptions')

router.use(cors(corsOptions))
router.use(express.urlencoded({extended:true}))
router.use(express.json())

router.post('/login', (req,res)=>{
    if(req.body.token == undefined){
        res.status(200).json({'success':false})
    }
    else{
        res.status(200).json({'success':false})
    }
})


module.exports = router
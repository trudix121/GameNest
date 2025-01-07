const express = require('express')
const router = express.Router()

router.use(express.urlencoded({extended:true}))
router.use(express.json())


router.get('/', (req, res)=>{
    res.render('index/index')
})


module.exports = router
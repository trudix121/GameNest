const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

const jwt = require('jsonwebtoken')

const { createUser , login , pool } = require('../db/postdb')

router.use(express.urlencoded({ extended: true }));
router.use(express.json());
router.use(cookieParser()); // Add cookie parser middleware before csrf
const csrfProtection = csrf({ cookie: true });

router.get('/register', csrfProtection, (req, res) => {
    res.render('auth/register', { csrfToken: req.csrfToken() });
});

router.get('/login', csrfProtection,  (req, res) => {

    try {
        const rest = jwt.verify(req.cookies.token, process.env.JWT)
        res.redirect('/home')

    } catch (error) {
        res.render('auth/login', {csrfToken: req.csrfToken()});
    }

});

router.post('/login', csrfProtection,  async (req,res)=>{
    const { credentials, password } = req.body
    
    const rest = await login(credentials, password, true)
    if(rest.success == true){
        const signed = await jwt.sign({
            username: rest.data.username
        }, process.env.JWT)
        res.cookie('token', signed, {
            httpOnly: true, // Previne accesul JavaScript la cookie
            maxAge: 36000000 // 1 oră
        });

        res.redirect('/home')
    }
    else if(rest.success == false){
        res.render('libs/error', {'code': 400, 'error':rest.error})
    }
    
})

router.post('/register',csrfProtection, async (req,res)=>{
    const { username, email, password, securityCode, phone } = req.body;
    const rest = await createUser(username, email, password, securityCode, phone)
    if(rest.success == false){
        res.render('libs/error', {code: 400, error: rest.error.toString()})
    }
    else if(rest.success == true){
        res.redirect('/auth/login')
    }

})

router.get('/logout', async (req,res)=>{
    res.clearCookie('token')
    res.redirect('/')
})

module.exports = router;

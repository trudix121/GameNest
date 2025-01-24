const jwt = require('jsonwebtoken');
require('dotenv').config({path:'../../.env'})
const { getUserData } = require('../db/postdb')
const { getClientIp } = require('request-ip')
async function jwt_admin(req, res, next) {
    const token = req.cookies.token; // Extrage token-ul din cookie

    if (!token) {
        return res.render('libs/error', {code:401, error:'Authentication Needed', redirect:'/'})
    }

    try {
        const secretKey = process.env.JWT; // Cheia secretă
        const decoded = jwt.verify(token, secretKey); // Validează token-ul
        const rest = await getUserData(decoded.username)
        if(rest.role == 'admin' && decoded.ip == getClientIp(req) ){
            req.user = rest;
            next()
        }
        else if(rest.role != 'admin'){
            res.render('libs/error', {code: 401, error:'You cannot acces admin route', redirect:'/'})
        }
        else{
            return res.render('libs/error', {code:403, error:'Invalid or Expired Token', redirect:'/'})
        }
    } catch (err) {
        return res.status(403).json({ message: `${err}` });
    }
}

module.exports = jwt_admin;
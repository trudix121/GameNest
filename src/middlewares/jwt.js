const jwt = require('jsonwebtoken');
require('dotenv').config({path:'../../.env'})
const { getUserData } = require('../db/postdb')
async function cookiejwt(req, res, next) {
    const token = req.cookies.token; // Extrage token-ul din cookie

    if (!token) {
        return res.status(401).json({ message: 'Autentification needed' });
    }

    try {
        const secretKey = process.env.JWT; // Cheia secretă
        const decoded = jwt.verify(token, secretKey); // Validează token-ul
        const rest = await getUserData(decoded.username)
        req.user = rest; // Adaugă datele utilizatorului în req
        next(); // Trece la următorul middleware
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or Expired Token' });
    }
}

module.exports = cookiejwt;
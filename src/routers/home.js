const express = require('express')
const router = express.Router()
const cookiejwt = require('../middlewares/jwt')
const { pool } = require('../db/postdb')
const SHOP_CATEGORIES = require('../lib/shop_items')
const purchase = require('../middlewares/purchase')
router.use(cookiejwt)

const announcements = {
    announcements_1:{
        content:'<a href="/api/gen_client"  class="block px-4 py-2 text-center bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-200">Generate Client Token </a>' },
    announcements_2:{
        content:'text'
    }
}

router.get('/', (req,res)=>{
    res.render('home/home', {user: req.user, annon:announcements})
})

router.get('/profile', (req,res)=>{
    //console.log(req.user)
    res.render('home/profile', {user:req.user})
})
router.post('/profile/search', async (req, res) => {
    const { username } = req.body;

    try {
        // Căutăm profilul în baza de date
        const profile = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);

        if (profile.rows.length <= 0) {
            return res.render('libs/error', {
                code: 404,
                error: 'Profile Not Found',
                redirect: '/home',
            });
        }

        const profileData = profile.rows[0];

        // Adăugăm `vip = true` direct în profil dacă este cazul
        if (profileData.custom_role === 'VIP') {
            profileData.vip = true;
            profileData.username = `VIP ${profileData.username}`
        }

        return res.render('home/profile', { user: profileData });
    } catch (error) {
        console.error(error);
        return res.status(500).render('libs/error', {
            code: 500,
            error: 'Internal Server Error',
            redirect: '/home',
        });
    }
});



router.get('/shop', async (req, res) => {
    res.render('home/shop', {
        money: req.user.money,
        roles: SHOP_CATEGORIES.roles,
        gamePerks: SHOP_CATEGORIES.gamePerks,
        customItems: SHOP_CATEGORIES.customItems
    });
});

router.get('/purchase/:type/:id',  purchase, async (req,res)=>{
})

module.exports = router
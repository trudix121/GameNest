const { pool } = require('../db/postdb')
const SHOP_CATEGORIES = require('../lib/shop_items')




async function purchase(req,res){
    switch(req.params.type){
        case 'role':
            const item_id = req.params.id
            if(SHOP_CATEGORIES.roles[item_id]){
                const item = SHOP_CATEGORIES.roles[item_id]
                const rest = await pool.query('SELECT * FROM users WHERE custom_role = $1 AND id = $2', [item.name_db, req.user.id])
                if(rest.rowCount > 0){res.render('libs/error', {code:202, error:"You already purchased that item!", redirect:'/home'}) }
                else if(req.user.money < item.price){res.send('You do not have enough money for buy this item!') }
                else if(req.user.money >= item.price){
                    await pool.query('UPDATE users SET money = $1, custom_role = $2 WHERE id = $3', [req.user.money - item.price, item.name_db, req.user.id])
                    res.render('libs/error', {code:200, error:"Item Purchased", redirect:'/home'})

                }
            } 
            else{
                res.send('Item Not Found')
            }

    }
}


module.exports = purchase
const express = require('express')
const router = express.Router()
const jwt_admin = require('../middlewares/jwt_admin')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { pool } = require('../db/postdb')


router.use(jwt_admin)
router.use(cors())
router.use(cookieParser())

router.get('/', (req,res)=>{
    res.render('admin/selector')
})

router.get('/logs', async (req, res) => {
    try {
        const logs = await pool.query('SELECT * FROM logs');
        const totalLogs = logs.rowCount; // Get the total number of logs
        const page = parseInt(req.query.page) || 1; // Get current page from query
        const limit = 20; // Define limit for pagination
        const offset = (page - 1) * limit; // Calculate offset for SQL query

        // Fetch logs for the specific page
        const paginatedLogs = await pool.query('SELECT * FROM logs LIMIT $1 OFFSET $2', [limit, offset]);
      //  console.log(paginatedLogs)
        res.render('admin/log', {
            logs: paginatedLogs.rows,
            totalLogs: totalLogs,
            page: page,
            limit: limit
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router
const express = require('express');
const router = express.Router();
const jwtverify = require('../middlewares/jwt');
const crypto = require('crypto');
const cookiejwt = require('../middlewares/jwt');
const { pool } = require('../db/postdb');
const add_log = require('../lib/log');
const { type } = require('os');

// Statics
router.use(express.static('src/views/games/static'));

// JWT verification middleware
router.use(jwtverify);




router.get('/selector', (req,res)=>{
    res.render("games/selector")
})



function game_active(req,res, next, game){
    if(games[`${game}`] == false){ return res.send('Sorry, This game is For moment Dezactivated')}
    next();
}

games = {
    'snake':true
}


/*  SNAKE GAME */

const config = {
    'x_money': 5,
    'max_score_per_second': 2, // Maximum possible score per second
    'max_game_duration': 1000 * 60 * 30, // 30 minutes
    'min_game_duration': 1000 // Minimum 1 second game duration
};

const verifyGame = async (req, res, next) => {
    const { gameId, score } = req.body;
    const userId = req.user.id;

    try {
        // Check if game exists
        const gameData = activeGames.get(gameId);
        if (!gameData) {
            return res.status(400).json({ error: 'Invalid game session' });
        }

        // Verify game belongs to user
        if (gameData.userId !== userId) {
            await add_log('security_violation', userId, {
                type: 'game_snake',
                reason: 'unauthorized_game_session',
                gameId
            });
            return res.status(403).json({ error: 'Unauthorized game session' });
        }

        // Verify game hasn't expired
        const gameDuration = Date.now() - gameData.startTime;
        if (gameDuration > config.max_game_duration) {
            activeGames.delete(gameId);
            return res.status(400).json({ error: 'Game session expired' });
        }

        // Verify minimum game duration
        if (gameDuration < config.min_game_duration) {
            await add_log('security_violation', userId, {
                type: 'game_snake',
                reason: 'suspicious_game_duration',
                duration: gameDuration
            });
            return res.status(400).json({ error: 'Invalid game duration' });
        }

        // Verify score is possible based on duration
        const maxPossibleScore = Math.floor(gameDuration / 1000) * config.max_score_per_second;
        if (score > maxPossibleScore) {
            await add_log('security_violation', userId, {
                type: 'game_snake',
                reason: 'impossible_score',
                score,
                maxPossible: maxPossibleScore
            });
            return res.status(400).json({ error: 'Invalid score' });
        }

        // Verify game hasn't already been submitted
        if (gameData.submitted) {
            await add_log('security_violation', userId, {
                type: 'game_snake',
                reason: 'duplicate_submission',
                gameId
            });
            return res.status(400).json({ error: 'Score already submitted' });
        }

        next();
    } catch (error) {
        console.error('Game verification error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Store active games in memory with score tracking
const activeGames = new Map();

// Generate secure gameId
const generateGameId = (userId) => {
    const timestamp = Date.now().toString();
    const data = userId + timestamp + crypto.randomBytes(16).toString('hex');
    return crypto.createHash('sha256').update(data).digest('hex');
};

// Main snake game route
router.get('/snake',  (req, res,next) => {
    game_active(req,res,next,'snake')


    const gameId = generateGameId(req.user.id);
    
    // Store game session with enhanced security data
    activeGames.set(gameId, {
        userId: req.user.id,
        startTime: Date.now(),
        submitted: false
    });

    res.render('games/snake', {
        user: req.user,
        gameId: gameId
    });
});

// Secure score submission route
router.post('/api/snake', verifyGame, async (req, res) => {
    try {
        const { score, gameId } = req.body;
        const userId = req.user.id;
        const gameData = activeGames.get(gameId);

        // Calculate reward
        const money = Math.floor(score * config.x_money);

        // Update user's money and log the transaction
        await pool.query(
            "UPDATE users SET money = money + $1 WHERE id = $2",
            [money, userId]
        );

        // Log the successful game
        await add_log('game_snake', userId, {
            score: score,
            money_made: money,
            gameId: gameId,
            duration: Date.now() - gameData.startTime
        });

        // Mark game as submitted and remove from active games
        gameData.submitted = true;
        activeGames.delete(gameId);

        res.status(200).json({
            success: true,
            score: score,
            money: money
        });
    } catch (error) {
        console.error('Score submission error:', error);
        res.status(500).json({ error: 'Failed to process score' });
    }
});

// Cleanup expired games
const cleanupExpiredGames = () => {
    const now = Date.now();
    let cleaned = 0;

    for (const [gameId, gameData] of activeGames.entries()) {
        if (now - gameData.startTime > config.max_game_duration) {
            activeGames.delete(gameId);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`Cleaned ${cleaned} expired game sessions`);
    }
};

async function clearexpired() {
    await setInterval(cleanupExpiredGames, 1000 * 60 * 15);
    await console.log('Started expired sessions cleanup service');
}

// Start cleanup service
clearexpired();

module.exports = router;
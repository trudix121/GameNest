const express = require('express');
const router = express.Router();
const jwtverify = require('../middlewares/jwt');
const crypto = require('crypto');
const { pool } = require('../db/postdb');
const add_log = require('../lib/log');


// JWT verification middleware
router.use(jwtverify);

// Game status management
const games = {
   'snake': true,
    'tetris': true
};

router.get('/selector', (req, res) => {
    res.render("games/selector");
});

function game_active(req, res, next, game) {
    if (games[game] == false) {
        return res.send('Sorry, This game is currently deactivated');
    }

}

// Configuration for games
const config = {
    'x_money_snake': 5,
    'x_money_tetris': 2,
   'max_score_per_second': 2,
   'max_score_per_second_tetris': 50,
   'max_game_duration': 1000 * 60 * 30, // 30 minutes
   'min_game_duration': 1000 // Minimum 1 second game duration
};

// Store active games in memory with score tracking
const activeGames = new Map();

// Generate secure gameId
const generateGameId = (userId) => {
    const timestamp = Date.now().toString();
    const data = userId + timestamp + crypto.randomBytes(16).toString('hex');
    return crypto.createHash('sha256').update(data).digest('hex');
};

// Verify game submissions
const verifyGame = async (req, res, next, gameType) => {
    try {
        const { score, gameId } = req.body;
        const userId = req.user.id;
        const gameData = activeGames.get(gameId);
        if (!gameData) {
            return res.status(400).json({ error: 'Invalid game session' });
        }
        if (gameData.userId!== userId) {
            await add_log('security_violation', userId, { type: gameType, reason: 'unauthorized_game_session', gameId });
            return res.status(403).json({ error: 'Unauthorized game session' });
        }
        const gameDuration = Date.now() - gameData.startTime;
        if (gameDuration > config.max_game_duration) {
            activeGames.delete(gameId);
            return res.status(400).json({ error: 'Game session expired' });
        }
        if (gameDuration < config.min_game_duration) {
            await add_log('security_violation', userId, { type: gameType, reason:'suspicious_game_duration', duration: gameDuration });
            return res.status(400).json({ error: 'Invalid game duration' });
        }
        const maxScorePerSecond = gameType === 'game_snake'? config.max_score_per_second : config.max_score_per_second_tetris;
        const maxPossibleScore = Math.floor(gameDuration / 1000) * maxScorePerSecond;
        if (score > maxPossibleScore) {
            await add_log('security_violation', userId, { type: gameType, reason: 'impossible_score', score, maxPossible: maxPossibleScore });
            return res.status(400).json({ error: 'Invalid score' });
        }
        if (gameData.submitted) {
            await add_log('security_violation', userId, { type: gameType, reason: 'duplicate_submission', gameId });
            return res.status(400).json({ error: 'Score already submitted' });
        }

        next();
    } catch (error) {
        console.error('Game verification error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Main snake game route
router.get('/snake', (req, res, next) => {
    game_active(req, res, next,'snake');
    const gameId = generateGameId(req.user.id);
    activeGames.set(gameId, { userId: req.user.id, startTime: Date.now(), submitted: false });
    res.render('games/snake', { user: req.user, gameId });
});

// Secure score submission route for Snake
router.post('/api/snake', async (req, res) => {
    try {
        await verifyGame(req, res, () => { },'snake');
        if (res.headersSent) return; // Evită continuarea dacă răspunsul a fost trimis

        const { score, gameId } = req.body;
        const userId = req.user.id;
        const money = Math.floor(score * config.x_money_snake);

        await pool.query("UPDATE users SET money = money + $1 WHERE id = $2", [money, userId]);
        await add_log('game_snake', userId, { score: score, money_made: money, gameId });

        const gameData = activeGames.get(gameId);
        if (gameData) {
            gameData.submitted = true; // Mark as submitted
            activeGames.delete(gameId); // Optionally remove from active games
        }

        res.status(200).json({ success: true, score: score, money: money });
    } catch (error) {
        console.error('Score submission error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process score' });
        }
    }
});

// Main tetris game route
router.get('/tetris', (req, res, next) => {
    game_active(req, res, next,'tetris');
    const gameId = generateGameId(req.user.id);

    activeGames.set(gameId, { userId: req.user.id, startTime: Date.now(), submitted: false });

    res.render('games/tetris', { user: req.user, gameId });
});

// Secure score submission route for Tetris
router.post('/api/tetris', async (req, res) => {
    try {
        await verifyGame(req, res, () => { },'tetris');
        if (res.headersSent) return; // Evită continuarea dacă răspunsul a fost trimis

        const { score, gameId } = req.body;
        const userId = req.user.id;
        const money = Math.floor(score * config.x_money_tetris);

        await pool.query("UPDATE users SET money = money + $1 WHERE id = $2", [money, userId]);
        await add_log('game_tetris', userId, { score, money_made: money, gameId });

        const gameData = activeGames.get(gameId);
        if (gameData) {
            gameData.submitted = true; // Mark as submitted
            activeGames.delete(gameId); // Optionally remove from active games
        }

        res.status(200).json({ success: true, score, money });
    } catch (error) {
        console.error('Score submission error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process score' });
        }
    }
});

// Cleanup expired games periodically
const cleanupExpiredGames = () => {
    const now = Date.now();

    for (const [gameId, gameData] of activeGames.entries()) {
        if (now - gameData.startTime > config.max_game_duration) {
            activeGames.delete(gameId);
            console.log(`Removed expired session for ${gameId}`);
        }
    }
};

setInterval(cleanupExpiredGames, 1000 * 60 * 15); // Cleanup every 15 minutes

module.exports = router;
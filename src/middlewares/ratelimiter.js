const { Request, Response, NextFunction } = require('express');
const rateLimit = require('express-rate-limit');
const { MemoryStore } = require('express-rate-limit');

// Configurația de bază pentru rate limiter
const config = {
    windowMs: 3 * 60 * 1000, // 3 minute
    max: 100, // Maxim 10 request-uri
    message: {
        status: 'error',
        message: 'Too many requests, please try again later.',
        nextValidRequestTime: '',
    },
};

// Crearea middleware-ului rate limiter
const limiter = rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    // Folosim MemoryStore în loc de Redis pentru simplitate și compatibilitate
    store: new MemoryStore(),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const resetTime = new Date(Date.now() + config.windowMs).toLocaleTimeString();
        const responseMessage = {
            ...config.message,
            nextValidRequestTime: resetTime,
        };
        res.status(429).json(responseMessage);
    },
    skip: (req) => {
        const skipPaths = ['/health', '/metrics'];
        return skipPaths.includes(req.path);
    },
    keyGenerator: (req) => {
        return req.ip || 
               req.headers['x-forwarded-for']?.toString() || 
               req.socket.remoteAddress || 
               'unknown';
    },
});

// Middleware pentru logging
const rateLimiterWithLogging = (req, res, next) => {
    //console.log(req)
    console.log(`Rate limit request from IP: ${req.ip}`);
    
    try {
        limiter(req, res, (error) => {
            if (error) {
                console.error('Rate limiter error:', error);
                return res.status(500).json({
                    status: 'error',
                    message: 'Internal server error during rate limiting'
                });
            }
            next();
        });
    } catch (error) {
        console.error('Rate limiter error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error during rate limiting'
        });
    }
};

module.exports = rateLimiterWithLogging;

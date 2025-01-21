const express = require('express')
require('dotenv').config()
const rateLimiterWithLogging = require('./middlewares/ratelimiter')
const morgan = require('morgan')
const app = express();
const cookieParser = require('cookie-parser')
const cors = require('cors')

// Configurare EJS
app.set('view engine', 'ejs');
app.set('views', 'src/views');

// Import routes
const auth = require('./routers/auth');
const index = require('./routers/index');
const home = require('./routers/home');
const games = require('./routers/games');
const admin = require('./routers/admin');
const api_client = require('./routers/api')


// Aplică rate limiter
app.use(rateLimiterWithLogging);
app.use(morgan('dev'))
app.use(cookieParser());
//app.use(cors())
app.use(express.static('src/views/static'));

// Routes
app.use('/', index);
app.use('/auth', auth);
app.use('/home', home)
app.use('/home/game', games)
app.use('/admin', admin)
app.use('/api', api_client)

app.listen(process.env.PORT, () => {
    console.log(`Server Started on http://localhost:${process.env.PORT}`);
});

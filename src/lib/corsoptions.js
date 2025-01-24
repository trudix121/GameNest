const corsOptions = {
    // Permite doar originile specificate
    origin: [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://your-production-domain.com'
    ],
  
    // Metode HTTP permise
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
    // Headers permise în request
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
  
    // Permite trimiterea de credențiale (cookies, etc.)
    credentials: true,
  
    // Cât timp să fie cache-uit pre-flight request-ul (în secunde)
    maxAge: 86400,
  
    // Headers expuse clientului
    exposedHeaders: ['Content-Length', 'X-Total-Count'],
  
    // Permite headers personalizate în request
    preflightContinue: false,
  
    // Statusul pentru OPTIONS request
    optionsSuccessStatus: 204
  };
  
  module.exports = corsOptions;
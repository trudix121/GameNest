const crypto = require('crypto');
function gen_token(){
    const timestamp = Date.now().toString();
    const data =timestamp + crypto.randomBytes(16).toString('hex');
    return crypto.createHash('sha256').update(data).digest('hex');
};
module.exports = gen_token
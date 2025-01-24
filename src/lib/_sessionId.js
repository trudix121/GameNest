const crypto = require('crypto');
function generatesessiondId(id){
    const timestamp = Date.now().toString();
    const data = id + timestamp + crypto.randomBytes(16).toString('hex');
    return crypto.createHash('sha256').update(data).digest('hex');
};
module.exports = generatesessiondId
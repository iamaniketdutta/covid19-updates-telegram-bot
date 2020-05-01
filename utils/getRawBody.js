const request = require('request-promise');

module.exports = async (url) => {
    return await request(url);
};

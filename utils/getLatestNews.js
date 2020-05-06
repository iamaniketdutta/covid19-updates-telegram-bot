const request = require('request-promise')
const moment = require('moment')
const config = require('../configs/config');

module.exports = async () => {
    try {
        const options = {
            uri: 'http://newsapi.org/v2/top-headlines/',
            qs: {
                q: 'corona',
                sources: 'google-news-in',
                apiKey: config.NEWS_API_KEY,
            },
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true
        };

        const resp = await request(options);

        return {
            ...resp,
            lastUpdatedAt: moment().format()
        };
    } catch(e) {
        console.log(e);
    }
};

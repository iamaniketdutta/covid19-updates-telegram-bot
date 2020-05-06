let env = 'telegram_bot_live';

let path = {
    telegram_bot_live: './telegram_bot_live.json',
}[env];

module.exports = require(path);

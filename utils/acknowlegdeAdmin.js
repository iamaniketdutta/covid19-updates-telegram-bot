const Telegram = require('telegraf/telegram');
const config = require('../configs/config');
const telegram = new Telegram(config.TELEGRAM_TOKEN);

module.exports = (username, first_name, last_name, command) => {
    if (username === ''){
        username = first_name + ' ' + last_name;
    }
    telegram.sendMessage(config.ADMIN_CHAT_ID, `User: ${username} has used the command: ${command}`);
};

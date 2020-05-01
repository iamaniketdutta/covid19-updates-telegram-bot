const Telegram = require('telegraf/telegram');
const telegram = new Telegram(process.env.TELEGRAM_TOKEN);

module.exports = (username, first_name, last_name, command) => {
    if (username === ''){
        username = first_name + ' ' + last_name;
    }
    telegram.sendMessage(process.env.ADMIN_CHAT_ID, `User: ${username} has used the command: ${command}`);
};

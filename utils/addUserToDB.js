const telegramBotUserDb = require('../dbHandlers/telegramBotUserDb');

module.exports = (id, username, first_name, last_name,latitude, longitude, isBot, callback) => {
    let getCondition = {id};
    telegramBotUserDb.findOne(getCondition, function (err, findOneUserResponse) {
        if (!findOneUserResponse){
            let createUser = {id,username, first_name, last_name,latitude, longitude, isBot};
            telegramBotUserDb.create(createUser, function (err, createUserResponse) {
                if (createUserResponse){
                    if (username === ''){
                        username = first_name + ' ' + last_name;
                    }
                    console.log('User: ' + username + ' had been saved in DB successfully');
                }
            });
        } else {
            let findOneUserResponseData = JSON.parse(JSON.stringify(findOneUserResponse));
            findOneUserResponseData.username = username;
            findOneUserResponseData.first_name = first_name;
            findOneUserResponseData.last_name = last_name;
            if (latitude !== '')
            {
                findOneUserResponseData.latitude = latitude;
            }
            if (longitude !== '')
            {
                findOneUserResponseData.longitude = longitude;
            }
            findOneUserResponseData.isBot = isBot;
            telegramBotUserDb.update(getCondition, findOneUserResponseData, {}, function (err, updateResponse) {
                if (updateResponse){
                }
            });
        }
    });
};

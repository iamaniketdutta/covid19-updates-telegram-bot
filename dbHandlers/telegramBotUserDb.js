const mongoose = require('mongoose');
const moment = require('moment');

let telegramBotUserSchema = new mongoose.Schema(
    {
        id: {type: Number, default: null},
        username: {type: String, default: null},
        first_name: {type: String, default: null},
        last_name: {type: String, default: null},
        latitude: {type: String, default: null},
        longitude: {type: String, default: null},
        isBot: {type: Boolean, default: false},
        addedAt: {type: String, default: moment().format()}
    }
);

let telegramBotUser = new mongoose.model('telegramBotUser', telegramBotUserSchema);

exports.findOne = function (condition, callback) {
    telegramBotUser.findOne(condition).exec(callback);
};

exports.findAll = function (condition, callback) {
    telegramBotUser.find(condition).exec(callback);
};

exports.create = function (data, callback) {
    telegramBotUser(data).save(callback);
};

exports.delete = function (condition, callback) {
    telegramBotUser.deleteOne(condition).exec(callback);
};

exports.update = function (id, data, options, callback) {
    telegramBotUser.updateOne(id, {$set: data}, options, callback);
};

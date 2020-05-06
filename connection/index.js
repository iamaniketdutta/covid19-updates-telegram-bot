const mongoose = require('mongoose');
const Telegraf = require('telegraf');
const config = require('../configs/config');

exports.configureMongoClient = ()=>{
//mongo connection
// Create the database connection
    mongoose.connect(config.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true});

// CONNECTION EVENTS
// When successfully connected
    mongoose.connection.on('connected', function () {
        console.log('Mongoose default connection open to ' + config.DB_URL + ' and time is ' + new Date());
    });

// If the connection throws an error
    mongoose.connection.on('error', function (err) {
        console.log('Mongoose default connection error: ' + err);
    });

// When the connection is disconnected
    mongoose.connection.on('disconnected', function () {
        console.log('Mongoose default connection disconnected');
    });
}

exports.configureTelegramBot = ()=>{
    return new Telegraf(config.TELEGRAM_TOKEN);
}


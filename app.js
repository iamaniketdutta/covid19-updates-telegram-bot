require('dotenv').config();
const Extra = require('telegraf/extra');
const moment = require('moment');
const getLatestNews = require('./utils/getLatestNews');
const getInformation = require('./utils/getInformation');
const replyWithStateInformationInHTML = require('./utils/replyWithStateInformationInHTML');
const addUserToDB = require('./utils/addUserToDB');
const acknowledgeAdmin = require('./utils/acknowlegdeAdmin');
const generalErrorMessage = require('./utils/generalErrorMessage');
const wait = require('./utils/wait');
const getRawBody = require('./utils/getRawBody');
const commandParts = require('telegraf-command-parts');
const { configureMongoClient, configureTelegramBot} = require('./connection/index');
const resource = require('./utils/resource.js');
configureMongoClient();

const bot = configureTelegramBot();
bot.use(commandParts());

bot.launch()
    .then(() => {
        console.log('Bot Started');
        /*try {    // Use this to send daily or cron-job notification
            telegramBotUserDb.findAll({}, (err, findAllResponse) => {
                if (findAllResponse.length > 0){
                    async.eachOfSeries(findAllResponse, (currentItem, index, findAllResponseCallback) => {
                        if (currentItem.id){
                            let output = '<b>#COVID19LockdownUpdates';
                            output += ' !!\n\n' + 'Tamil Nadu joins growing list of states to extend lockdown till April 30</b>\n\n' +
                                'https://www.hindustantimes.com/india-news/tamil-nadu-joins-growing-list-of-states-to-extend-lockdown-till-april-30/story-0tZJuFEjzp7U1KN8qaBzvO.html';
                            bot.telegram.sendMessage(currentItem.id, output, {parse_mode: "HTML"});
                            return findAllResponseCallback(null);
                        }
                    }, (err) => {
                        if (!err){
                            bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, 'New featured updates sent successfully');
                        }
                    });
                }
            });
        }catch (e) {
            console.log(e.message);
        }*/

    })
    .catch((err) => {
        console.log("Bot launch failed: ", err);
        process.exit(1);
    });

let cache = {};
let newsCache = {};

const getData = async () => {
    if (
        Object.keys(cache).length === 0 ||
        moment().diff(moment(cache['lastUpdatedAt']), 'minutes') > 60
    ) {
        const results = await getInformation();
        cache = results;
        return results;
    } else {
        return cache;
    }
};

const getNews = async () => {
    if (
        Object.keys(newsCache).length === 0 ||
        moment().diff(moment(newsCache['lastUpdatedAt']), 'minutes') > 30
    ) {
        const results = await getLatestNews();
        newsCache = results;
        return results;
    } else {
        return newsCache
    }
};

const shouldAcknowledgeAdmin = (ctx, command) => {
    const { message: { chat, from } } = ctx;

    const { is_bot } = from;
    const username = from.username || '';
    const first_name = from.first_name || '';
    const last_name = from.last_name || '';
    let latitude = '';
    let longitude = '';
    if (ctx.message.location){
        latitude = ctx.message.location.latitude || '';
        longitude = ctx.message.location.longitude || '';
    }
    const { id } = chat;

    if (id.toString() !== process.env.ADMIN_CHAT_ID && username !== 'iamaniketdutta') {
        try{
            acknowledgeAdmin(username, first_name, last_name, command);
            addUserToDB(id, username, first_name, last_name,latitude, longitude, is_bot, function (response) {
            });
        } catch (e) {
            acknowledgeAdmin(username, first_name, last_name, command);
            console.log('Error occured while saving user in DB or acknowledgeAdmin at: ', moment().format());
            console.log('\nFull error message: ', e.message);
        }

    }
};


bot.start(async (ctx) => {
    try {
        const first_name = ctx.message.from.first_name || '';
        const last_name = ctx.message.from.last_name || '';
        const formattedName = 'Hi 👋 ' + first_name + ' ' + last_name;
        await ctx.replyWithHTML(formattedName + resource.botStartMessage);
        shouldAcknowledgeAdmin(ctx, '/start');
    }catch (e) {
        console.log('Error in /start: ', e);
        generalErrorMessage(ctx);
    }

});

bot.command('/info', async (ctx) => {
    try {
        await ctx.replyWithHTML(resource.botInfoMessage, Extra.HTML().markup((m) =>
            m.keyboard([
                ['ℹ Info related COVID-19'],
                ['📍 COVID-19 Tracker'],
                ['📰 Latest news by Google'],
                ['👥 Share', '👨‍💻 About Developer'],
                ['💰 Donate Now','📝 Feedback'],
            ]).removeKeyboard(false).resize(true)));
        shouldAcknowledgeAdmin(ctx, '/info');
    }catch (e) {
        console.log('Error in /info: ', e);
        generalErrorMessage(ctx);
    }
});

bot.hears('📍 COVID-19 Tracker', async (ctx)=>{
    try {
        shouldAcknowledgeAdmin(ctx, '📍 COVID-19 Tracker');
        await ctx.replyWithHTML(resource.covid19TrackerMessage);
        /*return ctx.replyWithHTML('<b>👪 COVID-19 Near You</b>\n\nAllow location access & find out how close an infected patient is from you!\n\n💡 Click on <b>\'Allow Location Access\'</b>', Extra.HTML().markup((markup) => {
           return markup.resize()
               .keyboard([
                   markup.locationRequestButton('Allow Location Access', false, true), 'Back'
               ])
       }));*/
    }catch (e) {
        console.log('Error in COVID-19 Tracker: ', e);
        generalErrorMessage(ctx);
    }
});
bot.on('location', async(ctx)=>{
    try {
        shouldAcknowledgeAdmin(ctx, 'location');
        await ctx.replyWithHTML(resource.botlocationMessage);
       /* await ctx.replyWithHTML('Fetching the nearest case. Please wait !!!\n\n💡 It might take some time.');
        shouldAcknowledgeAdmin(ctx, 'location');
        const location = ctx.message.location;
        const latitude = location.latitude || '';
        const longitude = location.longitude || '';
        const url = 'https://script.google.com/macros/s/AKfycbwqcrVhD9D6Oi2aIi9EG16ks3hLjbJqag_jznwxqpY88xdoBQun/exec?lat=' + latitude + '&long=' + longitude;
        let distInKm = await getRawBody(url) || '';
        distInKm = Math.round((Number(distInKm) + Number.EPSILON) * 100) / 100;
        await ctx.replyWithHTML('📍 You are <b>Approximately ' + distInKm + ' KM</b>' + ' away from the nearest confirmed case <b>*</b>' +
            '\n\n<b>*</b> This information is sourced from crowdsource data and can be inaccurate. Don\'t panic, there might be +/- 5km error in some cases & wait for government sources to verify this data.');*/
    }catch (e) {
        console.log('Error in location: ', e);
        await ctx.reply('Sorry, cannot find the nearest case at the moment. Try again later or report the problem to @iamaniketdutta');
    }

});

bot.command('/feedback', async(ctx,match) => {
    try {
        if (ctx.state.command.args === ''){
            await ctx.replyWithHTML('💡 Please give a feedback message followed by /feedback');
            return ;
        }
        const feedbackMsg = ctx.state.command.args;
        const username = ctx.message.from.username || ctx.message.from.first_name;
        await ctx.replyWithHTML('<b>Thank You 🙏, '
            + username +
            ' !!!</b>\n\nYour Feedback has been saved.\nWe will look into this & get back to you ASAP.');
        if (ctx.message.from.id !== process.env.ADMIN_CHAT_ID){
            await bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, 'User: '+username+' has sent this feedback : ' + feedbackMsg);
        }
    }catch (e) {
        console.log('Error in /feedback: ', e);
        generalErrorMessage(ctx);
    }

});

bot.hears('💰 Donate Now', async(ctx) => {
    try {
        await ctx.replyWithHTML(resource.donateNow);

        await ctx.replyWithPhoto({source: './assets/Master-Black-QR-PMCARES-BHIM-UPI.jpeg'});
        shouldAcknowledgeAdmin(ctx, '💰 Donate Now');
    }catch (e) {
        console.log('Error in Donate Now: ', e);
        generalErrorMessage(ctx);
    }
});

bot.hears('📝 Feedback', async (ctx) => {
    try {
        await ctx.replyWithHTML(resource.feedback);
        shouldAcknowledgeAdmin(ctx, '📝 Feedback');
    }catch (e) {
        console.log('Error in Feedback: ', e);
        generalErrorMessage(ctx);
    }

});

bot.hears('ℹ Info related COVID-19', async (ctx) => {
    try {
        await ctx.replyWithHTML(resource.infoRelatedCOVID19, Extra.HTML().markup((m) =>
            m.keyboard([
                ['🇮🇳 Current situation of PAN India'],
                ['State-wise status', '📅 Today\'s Status'],
                ['ℹ General Info'],
                ['✈ Travel advisory', '📰 Fake News-Buster'],
                ['Back'],
            ]).removeKeyboard(false).resize(true)));
        shouldAcknowledgeAdmin(ctx, 'ℹ Info related COVID-19');
    }catch (e) {
        console.log('Error in Info related COVID-19: ', e);
        generalErrorMessage(ctx);
    }

});

bot.hears('ℹ General Info', async (ctx)=>{
    try {
        await ctx.replyWithHTML(resource.generalInfo, Extra.HTML().markup((m) =>
            m.keyboard([
                ['Symptoms', 'Cause of Spread'],
                ['Precaution', 'Doctor\'s Advice'],
                ['Test Centre', 'Helpline'],
                ['Back'],
            ]).removeKeyboard(false).resize(true)));
        shouldAcknowledgeAdmin(ctx, 'ℹ General Info');
    }catch (e) {
        console.log('Error in General Info: ', e);
        generalErrorMessage(ctx);
    }

});

bot.hears('Test Centre', async(ctx) => {
    try {
        await ctx.replyWithHTML('https://covid.icmr.org.in/index.php/testing-facilities');
        shouldAcknowledgeAdmin(ctx, 'Test Centre');
    }catch (e) {
        console.log('Error in Test Centre: ', e);
        generalErrorMessage(ctx);
    }

});

bot.hears('Helpline', async(ctx)=>{
    try {
        await ctx.replyWithHTML(resource.helpline);
        shouldAcknowledgeAdmin(ctx, 'Helpline');
    }catch (e) {
        console.log('Error in Helpline: ', e);
        generalErrorMessage(ctx);
    }

});

bot.hears('Doctor\'s Advice', async(ctx)=>{
    try {
        await ctx.replyWithHTML(resource.doctorAdvice);
        shouldAcknowledgeAdmin(ctx, 'Doctor\'s Advice');
    }catch (e) {
        console.log('Error in Doctor\'s Advice: ', e);
        generalErrorMessage(ctx);
    }

});

bot.hears('Precaution', async(ctx)=>{
    try {
        await ctx.replyWithHTML(resource.precaution);
        shouldAcknowledgeAdmin(ctx, 'Precaution');
    }catch (e) {
        console.log('Error in Precaution: ', e);
        generalErrorMessage(ctx);
    }

});

bot.hears('Cause of Spread', async(ctx)=>{
    try {
        await ctx.replyWithHTML(resource.causeOfSpread);
        shouldAcknowledgeAdmin(ctx, 'Cause of Spread');
    }catch (e) {
        console.log('Error in Cause of Spread: ', e);
        generalErrorMessage(ctx);
    }

});

bot.hears('Symptoms', async(ctx)=>{
    try {
        await ctx.replyWithHTML(resource.symptoms);
        shouldAcknowledgeAdmin(ctx, 'Symptoms');
    }catch (e) {
        console.log('Error in Symptoms: ', e);
        generalErrorMessage(ctx);
    }

});

bot.hears('Back', async (ctx)=>{
    try {
        await ctx.replyWithHTML(resource.botInfoMessage, Extra.HTML().markup((m) =>
            m.keyboard([
                ['ℹ Info related COVID-19'],
                ['📍 COVID-19 Tracker'],
                ['📰 Latest news by Google'],
                ['👥 Share', '👨‍💻 About Developer'],
                ['💰 Donate Now','📝 Feedback'],
            ]).removeKeyboard(false).resize(true)));
        shouldAcknowledgeAdmin(ctx, 'Back');
    }catch (e) {
        console.log('Error in Back: ', e);
        generalErrorMessage(ctx);
    }

});

bot.hears('📅 Today\'s Status', async (ctx)=>{
    try{
        await ctx.reply('Fetching Today\'s info... Please wait');
        shouldAcknowledgeAdmin(ctx, '📅 Today\'s Status');
        let todaysData = await getRawBody('https://api.covid19india.org/data.json');
        todaysData = JSON.parse(todaysData) || '';
        if (todaysData && todaysData.statewise && todaysData.statewise.length > 0) {
            let latestCase = todaysData.statewise;
            latestCase = latestCase[0];
            const confirmesCases = latestCase.deltaconfirmed;
            const recoveredCases = latestCase.deltarecovered;
            const deathCases = latestCase.deltadeaths;
            const lastUpdatedTime = latestCase.lastupdatedtime;
            const output = 'Today\'s reported case -  <b>PAN India</b>\n\nLast Updated: '+lastUpdatedTime + '\n\n' +
            'Confirmed cases: <b>' + confirmesCases + '</b>\n' +
            'Recovered cases: <b>' + recoveredCases + '</b>\n' +
            'Death cases: <b>' + deathCases + '</b>\n';

            await ctx.replyWithHTML(output);
        } else {
            await ctx.replyWithHTML('Sorry, cannot find toady\'s Info about covid-19 at the moment. Try again later or report the problem to @iamaniketdutta');
        }
    }catch (e) {
        console.log('Error in Today\'s Status: ', e);
        generalErrorMessage(ctx);
    }
});

bot.hears('State-wise status', async (ctx) => {
    try{
        await ctx.reply('Fetching the latest list... Please wait');
        const { stateData } = await getData();
        let output = '';
        for (let i = 1; i< stateData.length; i++){
            output += '<b>' + i + '. ' + '</b>' + stateData[i][0] + '\n';
        }
        await ctx.replyWithHTML( resource.stateWiseStatusMessage +
            output);
        shouldAcknowledgeAdmin(ctx, 'State-wise status');
    }catch (e) {
        console.log('Error in State-wise status: ', e);
        generalErrorMessage(ctx);
    }
});

bot.hears('🇮🇳 Current situation of PAN India', async (ctx) => {
    try {
        await ctx.reply('Getting the latest data... Please wait');
        const { stateData } = await getData();

        await replyWithStateInformationInHTML(stateData, ctx.replyWithHTML);
        await ctx.reply('Finished Loading the info !!!');
        shouldAcknowledgeAdmin(ctx, '🇮🇳 Current situation of PAN India');


    } catch (e) {
        console.log('Error in Current situation of PAN India: ', e);
        generalErrorMessage(ctx);
    }
});

bot.hears('👥 Share', async (ctx) => {
    try {
        await ctx.replyWithHTML(resource.shareMessage);
        shouldAcknowledgeAdmin(ctx, '👥 Share');

    } catch (e) {
        console.log('Error in Share: ', e);
        generalErrorMessage(ctx);
    }
});

bot.hears('📰 Fake News-Buster', async (ctx) => {
    try {
        shouldAcknowledgeAdmin(ctx, '📰 Fake News-Buster');
        await ctx.replyWithHTML(resource.fakeNewsBuster);
    } catch (e) {
        console.log('Error in Fake News-Buster: ', e);
        generalErrorMessage(ctx);
    }
});

bot.hears('✈ Travel advisory', async (ctx) => {
    try {
        shouldAcknowledgeAdmin(ctx, '✈ Travel advisory');
        await ctx.replyWithHTML( resource.travelAdvisory);

    } catch (e) {
        console.log('Error in Travel advisory: ', e);
        generalErrorMessage(ctx);
    }
});
bot.hears('📰 Latest news by Google', async (ctx) => {
    try {
        await ctx.reply('Fetching latest news!');
        const { articles } = await getNews();
        shouldAcknowledgeAdmin(ctx, '📰 Latest news by Google');

        if (articles && articles.length > 0) {
            const url = articles[0].url;
            await ctx.replyWithHTML(url);
            await wait(2);

            await ctx.reply('Please click on Next to see next news article', Extra.HTML().markup((m) =>
                m.inlineKeyboard([
                    m.callbackButton('Next', '1')
                ])
            ));
        } else {
            await ctx.reply('Sorry, cannot find news at the moment. Try again later or report the problem to @iamaniketdutta');
        }
    } catch (e) {
        console.log('Error in showing news: ', e);
        generalErrorMessage(ctx)
    }
});

bot.action(/.+/, async ({ answerCbQuery, reply, replyWithHTML, match }) => {

    try {
        const articleIndex = parseInt(match[0]);

        await answerCbQuery(`Loading next news`);

        const { articles } = await getNews();

        if (articleIndex < articles.length) {
            const url = articles[articleIndex].url;
            await replyWithHTML(url);
            await wait(2);

            if (articleIndex + 1 < articles.length) {

                await reply('Click Next to see next news', Extra.HTML().markup((m) =>
                    m.inlineKeyboard([
                        m.callbackButton('Next', (articleIndex + 1).toString())
                    ])
                ));
            } else {
                await reply('Finished Loading News article !!!');
            }
        }
    } catch (e) {
        console.log('Error in showing news: ', e);
    }

});

bot.hears('👨‍💻 About Developer', async (ctx) => {
    try {
        await ctx.replyWithMarkdown(resource.aboutDeveloper);
        shouldAcknowledgeAdmin(ctx, '👨‍💻 About Developer');
    }catch (e) {
        console.log("Error in About Developer: ", e);
        generalErrorMessage(ctx);
    }

});

bot.on('text', async (ctx) => {
    try {
        let message = parseInt(ctx.message.text);
        const { stateData } = await getData();
        if (ctx.message.text.length < 3 && message > 0 && message < stateData.length) {
            const title = stateData[0];
            let output = '';
            let totalConfirmedCases = 0;
            let totalCuredCases = 0;
            let totalDeathCases = 0;
            let stateWideActiveCase = 0;
            for (let i = 0; i < title.length; i++){
                output += title[i] + ': <b>' + stateData[message][i] + '</b>\n\n' ;
                totalConfirmedCases = Number(stateData[message][1]);
                totalCuredCases = Number(stateData[message][2]);
                totalDeathCases = Number(stateData[message][3]);
            }
            stateWideActiveCase = totalConfirmedCases - totalCuredCases - totalDeathCases;
            if (stateWideActiveCase < 1) {
                stateWideActiveCase = 0;
            }
            output += `Active cases: <b>${stateWideActiveCase}</b> \n\n`;
            await ctx.replyWithHTML(output);
        } else {
            await ctx.replyWithHTML(`Sorry, I am an automated system & didn't understand your reply.\n\nPlease use the <b>/info</b> command to check the features provided by me.\n\n💡 Click on the [4 dot] icon below if the menu items are hidden`);
        }
    }catch (e) {
        generalErrorMessage(ctx)
    }

});

bot.catch((err) => console.log(err));

const wait = require('./wait');

module.exports = async (data, reply) => {
    let output = '';
    const title = data[0];
    for(let i = 1; i < data.length ; i++) {  /*Statewide list of all states of India*/
        for(let j = 0; j < data[i].length; j++) {
            output += `${title[j]}: <b>${data[i][j]}</b> \n\n`;
        }

        output += '------------------------------------ \n\n';

        if(i % 5 === 0) {
            await reply(output);
            await wait(2);
            output = ''
        }
    }

    if(output !== '') {
        await reply(output);
        await wait(2);
        output = ''
    }

};

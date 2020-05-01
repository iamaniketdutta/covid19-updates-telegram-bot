const wait = require('./wait');

module.exports = async (data, reply) => {
    let output = '';
    const title = data[0];

    let totalConfirmedCases = 0;
    let totalCuredCases = 0;
    let totalDeathCases = 0;
    let totalActiveCases;
    for(let i = 1; i < data.length ; i++) {  /*Statewide list of all states of India*/
        totalConfirmedCases += Number(data[i][1]);
        totalCuredCases += Number(data[i][2]);
        totalDeathCases += Number(data[i][3]);
        let stateWideActiveCase = 0;
        for(let j = 0; j < data[i].length; j++) {
            output += `${title[j]}: <b>${data[i][j]}</b> \n\n`;
            if (j === 3){
                stateWideActiveCase = Number(data[i][1]) - Number(data[i][2]) - Number(data[i][3]);
                if (stateWideActiveCase < 1){
                    stateWideActiveCase = 0;
                }
                output += `Active cases: <b>${stateWideActiveCase}</b> \n\n`;
            }
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

    /*Total count of India*/
    totalActiveCases = totalConfirmedCases - totalCuredCases - totalDeathCases;
    if (totalActiveCases < 1) {
        totalActiveCases = 0;
    }
    output += `<b>Total number of cases in India</b> \n\n`;
    output += `${title[1]}: <b>${totalConfirmedCases}</b> \n\n`;
    output += `${title[2]}: <b>${totalCuredCases}</b> \n\n`;
    output += `${title[3]}: <b>${totalDeathCases}</b> \n\n`;
    output += `Total Active cases: <b>${totalActiveCases}</b> \n\n`;
    await reply(output)
};

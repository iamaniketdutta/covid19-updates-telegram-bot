const cheerio = require('cheerio');
const moment = require('moment');
const _ = require('lodash');

const getRawBody = require('./getRawBody');


module.exports = async () => {
    let stateData = [];

    try {
        const html = await getRawBody(process.env.DATA_BASE_URL);
        const $ = cheerio.load(html);

        const table = $('div.data-table table');

        const tableHead = $(table).find('thead');

        tableHead.children().each((_, elem) => {
            const titles = [];
            const rows = $(elem).find('th');

            rows.each((i, row) => {
                if(i !== 0) {
                    titles.push($(row).text().trim())
                }
            });

            stateData.push(titles)
        });

        const tableBody = $(table).find('tbody');

        tableBody.children().each((index, element) => {
            const rows = $(element).find('td');
            if (rows.length === 5 ) {
                const perStateData = [];
                rows.each((i, row) => {
                    if (i !== 0) {
                        perStateData.push($(row).text().replace(/[^\w\s]/gi, ''));
                    }
                });
                if (perStateData.length !== 0) {
                    stateData.push(perStateData)
                }
            }
        });
        const title = stateData.shift();

        let sortedArray = stateData.sort(function(a, b) {
            if (Number(a[1]) < Number(b[1])) return 1;
            if (Number(a[1]) > Number(b[1])) return -1;
            return 0;
        });
        stateData = [];
        stateData.push(title);
        stateData = [].concat(stateData, sortedArray);
        return {
            stateData,
            lastUpdatedAt: moment().format()
        }

    } catch(e) {
        if(e.statusCode === 500) {
            console.log("Cannot load data")
        } else {
            console.log("Error: ", e)
        }

        return {
            stateData: [],
            lastUpdatedAt: moment().format()
        }
    }
};

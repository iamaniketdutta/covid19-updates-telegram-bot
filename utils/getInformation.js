const cheerio = require('cheerio');
const moment = require('moment');
const _ = require('lodash');
const config = require('../configs/config');
const getRawBody = require('./getRawBody');


module.exports = async () => {
    let stateData = [];

    try {
        /*earlier I had used web-scrapping method from
        * by scrapping data from https://www.mohfw.gov.in/
        * */

        /*const html = await getRawBody(config.DATA_BASE_URL);
        const $ = cheerio.load(html, { decodeEntities: false });

        const table = $('div.data-table table');
        table.contents().map((i, el) => {
            if (el.type === 'comment') {
                el.data = '';
                console.log(el.data)  // You can get the contents of html comment
                console.log($(el).html())  // This is null
                console.log($(el).text())  // This is ' '
            }
        })
        const tableHead = $(table).find('thead');

        tableHead.children().each((index, elem) => {
            const titles = [];
            const rows = $(elem).find('th');
            if (rows.length > 0 && index === 1) {
                rows.each((i, row) => {
                    if (i !== 0) {
                        titles.push($(row).text().trim().replace(/\*!/g, ''))
                    }
                });
                if (titles.length > 0) {
                    stateData.push(titles)
                }
            }
        });

        const tableBody = $(table).find('tbody');

        tableBody.children().each((index, element) => {
            const rows = $(element).find('td');
            if (rows.length === 8 && $(rows[0]).text() !== '') {
                const perStateData = [];
                rows.each((i, row) => {
                    if (i !== 0 && (i % 2 === 0 || i === 1)) {
                        perStateData.push($(row).text().replace(/[^\w\s]/gi, ''));
                    }
                });
                if (perStateData.length > 0) {
                    stateData.push(perStateData)
                }
            }
        });
        const title = stateData.shift();

        let sortedArray = stateData.sort(function (a, b) {
            if (Number(a[1]) < Number(b[1])) return 1;
            if (Number(a[1]) > Number(b[1])) return -1;
            return 0;
        });
        stateData = [];
        stateData.push(title);
        stateData = [].concat(stateData, sortedArray);*/

        /*
        * Changed to API method
        * */
        stateData[0] = ['Name', 'Confirmed', 'Recovered', 'Deaths'];
        let inputData = await getRawBody(config.DATA_BASE_URL);
        inputData = JSON.parse(inputData);
        let inputStateWiseData = inputData.statewise || '';
        if (inputStateWiseData && inputStateWiseData.length > 0) {
            inputStateWiseData.forEach((state, index) => {
                if (index > 0) {
                    let data = [];
                    data.push(state.state, state.confirmed, state.recovered, state.deaths);
                    stateData.push(data);
                }
            });
        }
        return {
            stateData,
            lastUpdatedAt: moment().format()
        }

    } catch (e) {
        if (e.statusCode === 500) {
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

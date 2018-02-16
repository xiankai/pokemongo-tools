const moment = require('moment');
const fetch = require('node-fetch');
const google = require('googleapis');
const sheets = google.sheets('v4');

/**
 * @param {string} auth Google API Token
 * @param {string} spreadsheetId Google Spreadsheets ID
 * @param {string} gymSheet The sheet name which contains Gyms
 * @param {string} parkSheet The park name which contains Parks
 * @param {[string]} [excluded] Optional array of sheets to ignore
 */
module.exports = async ({
	auth,
	spreadsheetId,
	gymSheet,
	parkSheet,
	excluded = [],
}) => {
	let resp = await new Promise(resolve =>
		sheets.spreadsheets.get(
			{
				auth,
				spreadsheetId,
			},
			(err, resp) => resolve(resp)
		)
	);

	const dates = resp.data.sheets
		.map(sheet => sheet.properties.title)
		.filter(
			name =>
				[].concat([gymSheet], [parkSheet], excluded).indexOf(name) < 0
		);

	resp = await new Promise(resolve =>
		sheets.spreadsheets.values.batchGet(
			{
				auth,
				spreadsheetId,
				ranges: [
					gymSheet,
					parkSheet,
					...dates.map(date => `${date}!B2:C100`),
				],
			},
			(err, resp) => resolve(resp)
		)
	);

	const exraids_combined = {};
	resp.data.valueRanges
		.filter(
			valueRange =>
				![gymSheet, parkSheet].find(name =>
					valueRange.range.match(name)
				)
		)
		.forEach(valueRange => {
			const date = moment(
				valueRange.range.match(/'(.*)'/)[1],
				'Do MMM YYYY',
				true
			).format('YYYY-MM-DD');
			valueRange.values.forEach(([name, timing]) => {
				if (exraids_combined[name.trim()]) {
					exraids_combined[name.trim()].push(date);
				} else {
					exraids_combined[name.trim()] = [date];
				}
			});
		});

	const gyms = resp.data.valueRanges
		.filter(valueRange => valueRange.range.match(gymSheet))
		.map(valueRange => valueRange.values)[0];

	const parks = resp.data.valueRanges
		.filter(valueRange => valueRange.range.match(parkSheet))
		.map(valueRange => valueRange.values)[0];

	return {
		exraids_combined,
		gyms,
		parks,
	};
};

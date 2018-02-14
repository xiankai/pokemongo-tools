require('dotenv').config();

const Raven = require('raven');
process.env.SENTRY_DSN && Raven.config(process.env.SENTRY_DSN).install();

const fs = require('fs');
const moment = require('moment');
const fetch = require('node-fetch');
const google = require('googleapis');
const d3 = require('d3-geo');
const sheets = google.sheets('v4');

const auth = process.env.GOOGLE_API_KEY;
const spreadsheetId = process.env.SPREADSHEET_ID;
const reserved = [process.env.GYMS, process.env.PARKS];
const excluded = process.env.EXCLUDED.split(',');
const s2 = process.env.S2_LEVELS.split(',').map(s2Cell => ({
	s2Cell: +s2Cell,
	s2Url: process.env.S2_URL.replace('{c}', s2Cell),
}));

const fetchSheets = async () => {
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
		.filter(name => [].concat(reserved, excluded).indexOf(name) < 0);

	resp = await new Promise(resolve =>
		sheets.spreadsheets.values.batchGet(
			{
				auth,
				spreadsheetId,
				ranges: [...reserved, ...dates.map(date => `${date}!B2:C100`)],
			},
			(err, resp) => resolve(resp)
		)
	);

	const exraids_combined = {};
	resp.data.valueRanges
		.filter(
			valueRange => !reserved.find(name => valueRange.range.match(name))
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
		.filter(valueRange => valueRange.range.match(reserved[0]))
		.map(valueRange => valueRange.values)[0];

	const parks = resp.data.valueRanges
		.filter(valueRange => valueRange.range.match(reserved[1]))
		.map(valueRange => valueRange.values)[0];

	return {
		parks,
		exraids_combined,
		gyms,
	};
};

const init = async () => {
	// gets gyms, parks and raid data
	const { parks, exraids_combined, gyms } = await fetchSheets();
	// gets s2 data
	const s2Cells = await Promise.all(
		s2.map(async ({ s2Cell, s2Url }) => {
			const resp = await fetch(s2Url);
			const data = await resp.json();
			return {
				s2Cell,
				geoJSON: data.features,
			};
		})
	);

	const assignGym = ([name, lat, lng], i) => {
		// requires LngLat for d3.geoContains, and also GeoJSON spec.
		const coordinates = [+lng, +lat];
		const terrains = [];
		const s2CellRef = {};

		if (
			parks.find(([parkName]) => {
				return name === parkName;
			})
		) {
			terrains.push('Park L20 Cell');
		}

		s2Cells
			.filter(({ s2Cell }) => s2Cell !== 10)
			.forEach(({ s2Cell, geoJSON }) => {
				geoJSON.forEach(s2Feature => {
					if (
						!s2CellRef[`S2L${s2Cell}`] &&
						d3.geoContains(s2Feature, coordinates)
					) {
						s2CellRef[`S2L${s2Cell}`] = s2Feature.properties.order;
					}
				});
			});

		s2Cells
			.filter(({ s2Cell }) => s2Cell === 10)
			.forEach(({ s2Cell, geoJSON }) => {
				geoJSON.forEach(s2Feature => {
					if (
						!s2CellRef[`S2L${s2Cell}`] &&
						!d3.geoContains(s2Feature, coordinates)
					) {
						s2CellRef[`S2L${s2Cell}`] = s2Feature.properties.order;
					}
				});
			});

		const dates = exraids_combined[name.trim()] || [];

		return {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates,
			},
			properties: {
				name,
				terrains,
				dates,
				...s2CellRef,
			},
		};
	};

	const fileName = process.env.OUTPUT_FILENAME || 'all.geojson';
	const content = JSON.stringify({
		type: 'FeatureCollection',
		features: gyms.map(assignGym),
	});

	if (process.env.GIST_ID) {
		// make the magic happen
		const resp = await fetch(
			`https://api.github.com/gists/${process.env.GIST_ID}`,
			{
				method: 'PATCH',
				headers: new fetch.Headers({
					Authorization: `token ${process.env.GITHUB_TOKEN}`,
				}),
				body: JSON.stringify({
					files: {
						[fileName]: {
							content,
						},
					},
				}),
			}
		);
	} else {
		fs.writeFileSync(fileName, content);
	}
};

init();

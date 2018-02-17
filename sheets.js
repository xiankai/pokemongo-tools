require('dotenv').config();

const Raven = require('raven');
process.env.SENTRY_DSN && Raven.config(process.env.SENTRY_DSN).install();

const fs = require('fs');
const fetch = require('node-fetch');
const { matchGyms, fetchFromSheets, pushToGist } = require('./lib');

const auth = process.env.GOOGLE_API_KEY;
const spreadsheetId = process.env.SPREADSHEET_ID;
const gymSheet = process.env.GYMS;
const parkSheet = process.env.PARKS;
const excluded = process.env.EXCLUDED.split(',');
const s2 = process.env.S2_LEVELS.split(',').map(s2Cell => ({
	s2Cell: +s2Cell,
	s2Url: process.env.S2_URL.replace('{c}', s2Cell),
}));
const gistId = process.env.GIST_ID;
const githubToken = process.env.GITHUB_TOKEN;
const prettyFormat = +process.env.PRETTY_FORMAT;

const init = async () => {
	// gets gyms, parks and raid data
	const { parks, exraids_combined, gyms } = await fetchFromSheets({
		auth,
		spreadsheetId,
		gymSheet,
		parkSheet,
		excluded,
	});

	// gets s2 data
	const s2Cells = await Promise.all(
		s2.map(async ({ s2Cell, s2Url }) => {
			const resp = await fetch(s2Url);
			const geoJSON = await resp.json();
			return {
				s2Cell,
				geoJSON,
			};
		})
	);

	const content = matchGyms({
		exraids_combined,
		gyms,
		parks,
		s2Cells,
		prettyFormat,
	});

	// fs.writeFileSync('all.geojson', content);

	pushToGist({ gistId, githubToken, content });
};

init();

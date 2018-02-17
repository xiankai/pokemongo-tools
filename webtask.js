const Raven = require('raven');
const { matchGyms, pushToGist, fetchFromSheets } = require('pokemongo-tools');

module.exports = (context, callback) => {
	const {
		SENTRY_DSN,
		GOOGLE_API_KEY: auth,
		SPREADSHEET_ID: spreadsheetId,
		GYMS: gymSheet,
		PARKS: parkSheet,
		EXCLUDED: excluded,
		S2_LEVELS: s2Levels,
		S2_URL: s2Url,
		GIST_ID: gistId,
		GITHUB_TOKEN: githubToken,
		PRETTY_FORMAT: prettyFormat,
	} = context.secrets;

	const s2 = s2Levels.split(',').map(s2Cell => ({
		s2Cell: +s2Cell,
		s2Url: s2Url.replace('{c}', s2Cell),
	}));

	Raven.config(SENTRY_DSN).install();

	fetchFromSheets({
		auth,
		spreadsheetId,
		gymSheet,
		parkSheet,
		excluded,
	}).then(({ parks, exraids_combined, gyms }) => {
		Promise.all(
			s2.map(({ s2Cell, s2Url }) =>
				fetch(s2Url)
					.then(resp => Promise.resolve(resp.json()))
					.then(geoJSON =>
						Promise.resolve({
							s2Cell,
							geoJSON,
						})
					)
			)
		).then(s2Cells => {
			const content = matchGyms({
				exraids_combined,
				gyms,
				parks,
				s2Cells,
				prettyFormat: +prettyFormat,
			});

			pushToGist({ gistId, githubToken, content });
		});
	});
};

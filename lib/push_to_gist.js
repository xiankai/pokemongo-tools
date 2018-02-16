const fetch = require('node-fetch');

/**
 * @param {string} gistId
 * @param {string} githubToken
 * @param {string} content GeoJSON format
 * @param {string} [fileName=all.geojson]
 *
 * @return {object} Fetch response data
 */
module.exports = async ({
	gistId,
	githubToken,
	content,
	fileName = 'all.geojson',
}) => {
	const resp = await fetch(`https://api.github.com/gists/${gistId}`, {
		method: 'PATCH',
		headers: new fetch.Headers({
			Authorization: `token ${githubToken}`,
		}),
		body: JSON.stringify({
			files: {
				[fileName]: {
					content,
				},
			},
		}),
	});
	return await resp.json();
};

const moment = require('moment');
const google = require('googleapis');
const drive = google.drive('v3');

/**
 * @param {string} auth Google API Token
 * @param {string} fileID Google Drive File ID. Same as Spreadsheets ID
 */
const checkSheets = async ({ auth, fileId }) => {
	const metadata = await new Promise(resolve =>
		drive.files.get(
			{
				auth,
				fileId,
				fields: ['modifiedTime'],
			},
			(err, resp) => resolve(resp)
		)
	);

	if (
		moment(metadata.modifiedTime)
			.add(10, 'minute')
			.isAfter(moment.now())
	) {
		return true;
	}

	console.log(
		`last modified time was ${
			metadata.modifiedTime
		}, so no update was performed.`
	);
	return false;
};

module.exports = checkSheets;

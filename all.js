const fs = require('fs');
const d3 = require('d3-geo');
const parse = require('csv-parse/lib/sync');
const matchGyms = require('./lib/match_gyms');

const gyms = parse(fs.readFileSync('gyms.csv'));
const parks_s2 = parse(fs.readFileSync('parks.csv'));
const exraids = parse(fs.readFileSync('exraids.csv'));

const dateLabels = exraids.shift();
dateLabels.shift();

const exraids_combined = {};
exraids.forEach(([name, ...dates]) => {
	exraids_combined[name] = dates
		.map(
			(date, index) =>
				date.length > 0 ? `${dateLabels[index]} ${date}` : ''
		)
		.filter(v => v.length > 0);
});

const s2Cells = fs
	.readdirSync('.')
	.filter(fileName => fileName.match(/s2_L(\d+).geojson/))
	.map(fileName => ({
		s2Cell: +fileName.match(/s2_L(\d+).geojson/)[1],
		geoJSON: JSON.parse(fs.readFileSync(fileName)),
	}));

fs.writeFileSync(
	'all.geojson',
	JSON.stringify(matchGyms({ parks_s2, exraids_combined, gyms, s2Cells }))
);

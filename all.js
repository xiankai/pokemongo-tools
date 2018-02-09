let start = +new Date();
let elapsed = 0;

const fs = require('fs');
const d3 = require('d3-geo');
const parse = require('csv-parse/lib/sync');

const gyms = parse(fs.readFileSync('gyms.csv'));
const parks_s2 = parse(fs.readFileSync('parks.csv'));
const exraids = parse(fs.readFileSync('exraids.csv'));
const dateLabels = exraids.shift();
dateLabels.shift();
const exraids_combined = exraids.map(([name, ...dates]) => ({
	name,
	dates: dates
		.map(
			(date, index) =>
				date.length > 0 ? `${dateLabels[index]} ${date}` : ''
		)
		.filter(v => v.length > 0),
}));

const parks = fs
	.readdirSync('.')
	.filter(fileName => fileName.match('.park.geojson'))
	.map(fileName => ({
		name: fileName.slice(0, -'.park.geojson'.length),
		geoJSON: JSON.parse(fs.readFileSync(fileName)),
	}))

const s2L12 = JSON.parse(fs.readFileSync('s2_L12.geojson')).features;
const s2L10 = JSON.parse(fs.readFileSync('s2_L10.geojson')).features;

const matched_gyms = gyms.map(([name, lat, lng], i) => {
	// requires LngLat for d3.geoContains, and also GeoJSON spec.
	const coordinates = [+lng, +lat];
	let terrains = [];
	let S2L12;
	let S2L10;
	console.log(i);

	if (parks_s2.find(([parkName]) => name === parkName)) {
		terrains.push('Park L20 Cell');
	}

	parks.forEach(({ geoJSON, name }) => {
		if (
			d3.geoContains(geoJSON, coordinates) &&
			terrains.indexOf(name) < 0
		) {
			terrains.push(name);
		}
	});

	s2L12.forEach(s2Feature => {
		if (!S2L12 && d3.geoContains(s2Feature, coordinates)) {
			S2L12 = s2Feature.properties.order;
		}
	});

	s2L10.forEach(s2Feature => {
		if (!S2L10 && !d3.geoContains(s2Feature, coordinates)) {
			S2L10 = s2Feature.properties.order;
		}
	});

	const exraid = exraids_combined.find(r => r.name.trim() === name.trim());
	const dates = exraid ? exraid.dates.map(d => d.slice(0, 'YYYY-MM-DD'.length)) // trim out time for now
	 : [];

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
			S2L12,
			S2L10,
		},
	};
});

elapsed = `${((+new Date() - start) / 1000).toFixed(2)}s`;
console.log(`finished assigning ${matched_gyms.length} gyms in ${elapsed}`);

fs.writeFileSync(
	'all.geojson',
	JSON.stringify({
		type: 'FeatureCollection',
		features: matched_gyms,
	})
);

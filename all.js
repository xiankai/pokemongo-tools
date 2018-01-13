let start = +new Date();
let elapsed = 0;

const fs = require('fs');
const d3 = require('d3-geo');
const parse = require('csv-parse/lib/sync');

const gyms = parse(fs.readFileSync('gyms.csv'));
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
		data: JSON.parse(fs.readFileSync(fileName)),
	}))
	.map(terrain => ({
		name: terrain.name,
		features: terrain.data.features.filter(
			feature => feature.geometry.type === 'Polygon'
		),
	}));

const s2 = JSON.parse(fs.readFileSync('s2.geojson')).features;

const matched_gyms = gyms.map(([gym, ...coordinates], i) => {
	// requires LngLat for d3.geoContains
	coordinates.reverse();
	let terrains = [];
	let s2Cell;
	console.log(i);

	parks.forEach(({ features, name }) => {
		features.forEach(feature => {
			if (
				d3.geoContains(feature, coordinates) &&
				terrains.indexOf(name) < 0
			) {
				terrains.push(name);
			}
		});
	});

	s2.forEach(s2Feature => {
		if (d3.geoContains(s2Feature, coordinates)) {
			s2Cell = s2Feature.properties.order;
			return false;
		}
	});

	// reverse back
	coordinates.reverse();
	return {
		type: 'Feature',
		geometry: {
			type: 'Point',
			coordinates,
		},
		properties: {
			name: gym,
			terrains,
			dates: exraids_combined[gym] || [],
			s2Cell,
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

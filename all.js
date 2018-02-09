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
	}));

const s2Cells = fs
	.readdirSync('.')
	.filter(fileName => fileName.match(/s2_L(\d+).geojson/))
	.map(fileName => ({
		s2Cell: fileName.match(/s2_L(\d+).geojson/)[1],
		geoJSON: JSON.parse(fs.readFileSync(fileName)).features,
	}));

const matched_gyms = gyms.map(([name, lat, lng], i) => {
	// requires LngLat for d3.geoContains, and also GeoJSON spec.
	const coordinates = [+lng, +lat];
	let terrains = [];
	let s2CellRef = {};
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

	s2Cells
		.filter(({s2Cell}) => s2Cell !== 10)
		.forEach(({s2Cell, geoJSON}) => {
		geoJSON.forEach(s2Feature => {
			if (!s2CellRef[`S2L${s2Cell}`] && d3.geoContains(s2Feature, coordinates)) {
				s2CellRef[`S2L${s2Cell}`] = s2Feature.properties.order;
			}
		});
	});

	s2Cells
		.filter(({s2Cell}) => s2Cell === 10)
		.forEach(({s2Cell, geoJSON}) => {
		geoJSON.forEach(s2Feature => {
			if (!s2CellRef[`S2L${s2Cell}`] && !d3.geoContains(s2Feature, coordinates)) {
				s2CellRef[`S2L${s2Cell}`] = s2Feature.properties.order;
			}
		});
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
			...s2CellRef,
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

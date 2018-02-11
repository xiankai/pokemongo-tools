const s2 = require('@mapbox/s2');
const fs = require('fs');
const d3 = require('d3-geo');

const coordinates = fs.readFileSync('coordinates.txt');
const rectangle = coordinates
	.toString()
	.split('\n')
	.map(c => c.split(', ').map(Number));
const parks = fs
	.readdirSync('.')
	.filter(fileName => fileName.match('.park.geojson'))
	.map(fileName => ({
		name: fileName.slice(0, -'.park.geojson'.length),
		data: JSON.parse(fs.readFileSync(fileName)),
	}))
	.map(terrain => ({
		name: terrain.name,
		geoJSON: {
			type: 'FeatureCollection',
			features: terrain.data.features.filter(
				feature => feature.geometry.type === 'Polygon'
			),
		},
	}));

const sg = new s2.S2LatLngRect(
	new s2.S2LatLng(rectangle[0][0], rectangle[0][1]),
	new s2.S2LatLng(rectangle[1][0], rectangle[1][1])
);

const isCellValid = cell => {
	const center = new s2.S2LatLng(cell.getCenter()).toGeoJSON();

	const geoJSON = parks[0].geoJSON;
	return d3.geoContains(geoJSON, center.coordinates);
};

const getValidCells = (cells, level = 12) => {
	const covering = s2.getCoverSync(cells, {
		min: level,
		max: level,
	});

	return covering.filter(isCellValid);
};

const combineValidCells = (cells, level) => {
	const combinedCells = [].concat(
		...cells.map((cell, index) => {
			console.log(
				`completed cell ${index + 1} of ${cells.length} for L${level}`
			);
			return getValidCells(cell, level);
		})
	);
	return combinedCells;
};

L12 = getValidCells(sg, 12);
L14 = combineValidCells(L12, 14);
L16 = combineValidCells(L14, 16);
L18 = combineValidCells(L16, 18);
L20 = combineValidCells(L18, 20);

const geoJSON = {
	type: 'FeatureCollection',
	features: L20.map(cell => ({ geometry: cell.toGeoJSON() })),
};

fs.writeFileSync('July 2016.s2.geojson', JSON.stringify(geoJSON, null, 4));

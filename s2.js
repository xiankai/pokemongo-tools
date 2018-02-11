const s2 = require('@mapbox/s2');
const fs = require('fs');
const coordinates = fs.readFileSync('coordinates.txt');
const rectangle = coordinates
	.toString()
	.split('\n')
	.map(c => c.split(', ').map(Number));

const sg = new s2.S2LatLngRect(
	new s2.S2LatLng(rectangle[0][0], rectangle[0][1]),
	new s2.S2LatLng(rectangle[1][0], rectangle[1][1])
);

const cellLevel = +process.argv[2] || 12;
const covering = s2.getCoverSync(sg, {
	min: cellLevel,
	max: cellLevel,
});

const coveredGeoJSON = covering
	.map(c => c.toGeoJSON())
	.sort((feature_1, feature_2) => {
		const polygon_1_origin = feature_1.coordinates[0][0];
		const polygon_2_origin = feature_2.coordinates[0][0];

		// compare lat
		return polygon_1_origin[0] - polygon_2_origin[0];
	})
	.sort((feature_1, feature_2) => {
		const polygon_1_origin = feature_1.coordinates[0][0];
		const polygon_2_origin = feature_2.coordinates[0][0];

		// compare lng (reversed for LTR direction)
		return polygon_2_origin[1] - polygon_1_origin[1];
	});

const key = process.argv[3] || 'order';
let counter = 0;
let charCodeCounter = 65; // A
const geoJSON = {
	type: 'FeatureCollection',
	features: coveredGeoJSON.map((feature, index) => {
		if (
			index === 0 ||
			feature.coordinates[0][0] >
				coveredGeoJSON[index - 1].coordinates[0][0]
		) {
			counter++;
		} else {
			// advance to next alphabet
			counter = 1;
			charCodeCounter++;
		}

		feature.properties = {
			[key]: String.fromCharCode(charCodeCounter) + counter,
		};

		return feature;
	}),
};

fs.writeFileSync(`s2_L${cellLevel}.geojson`, JSON.stringify(geoJSON));

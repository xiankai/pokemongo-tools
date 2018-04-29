const d3 = require('d3-geo');

/**
 * @param {[string][]} parks Imported CSV of park gym names
 * @param {{string: Date[]}} exraids_combined Imported CSV of ex raids indexed by gym name
 * @param {[string, number, number][]} gyms Imported CSV of gyms with latitude and longitude coordinates
 * @param {{s2Cell: number, geoJSON: GeoJSONFeature[]}[]} s2Cells Array of s2Cells to check and their associated GeoJSON.
 *
 * @return GeoJSONFeatureCollection
 */
const matchGyms = ({
	parks = [],
	exraids_combined = {},
	gyms = [],
	s2Cells = [],
	prettyFormat = 4,
}) => {
	const matchGym = ([name, lat, lng, supercededBy = '']) => {
		// requires LngLat for d3.geoContains, and also GeoJSON spec.
		const terrains = [];
		const s2CellRef = {};
		const coordinates = [+lng, +lat];

		if (
			parks.find(park => {
				return name === park[0];
			})
		) {
			terrains.push('Park L20 Cell');
		}

		s2Cells
			.filter(({ s2Cell }) => s2Cell !== 10)
			.forEach(({ s2Cell, geoJSON }) => {
				geoJSON.features.forEach(s2Feature => {
					if (
						!s2CellRef[`S2L${s2Cell}`] &&
						d3.geoContains(s2Feature, coordinates)
					) {
						s2CellRef[`S2L${s2Cell}`] = s2Feature.properties.order;
					}
				});
			});

		s2Cells
			.filter(({ s2Cell }) => s2Cell === 10)
			.forEach(({ s2Cell, geoJSON }) => {
				geoJSON.features.forEach(s2Feature => {
					if (
						!s2CellRef[`S2L${s2Cell}`] &&
						!d3.geoContains(s2Feature, coordinates)
					) {
						s2CellRef[`S2L${s2Cell}`] = s2Feature.properties.order;
					}
				});
			});

		const dates = exraids_combined[name.trim()] || [];

		const properties = {
			name,
			terrains,
			dates,
			supercededBy,
		};

		for (const s2Cell in s2CellRef) {
			properties[s2Cell] = s2CellRef[s2Cell];
		}

		return {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates,
			},
			properties,
		};
	};

	return JSON.stringify(
		{
			type: 'FeatureCollection',
			features: gyms.map(matchGym),
		},
		null,
		prettyFormat
	);
};

module.exports = matchGyms;

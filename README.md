# Tools for generating compiled datasets for EX-raid map
Demo: https://xiankai.github.io/sg-pokemongo-ex-raid-map/  
Linked Repo: https://github.com/xiankai/sg-pokemongo-ex-raid-map

# Installation
This assumes basic knowledge of `node`, `npm` or `yarn`.

1. `yarn add pokemongo-tools`
2. `yarn` to install dependencies. 
    - You must be on node 6 to compile @mapbox/s2-node on OSX, but you should switch to node 8+ for better performance afterwards.
    - For reference, it takes 55s to process 1.8k gyms on v6.12.2 yet only 17s on v9.3.0

# overpass.c
OSM query template for https://overpass-turbo.eu/, copied from [this reddit thread](https://www.reddit.com/r/TheSilphRoad/comments/7pq1cx/how_i_created_a_map_of_potential_exraids_and_how/)

Also modified to only show valid park tags.

I originally had one myself but it is outdated with the current research thus far and thus invalid.

It has the `c` extension for formatting as the syntax is derived from C.

After running the query you should have the option to Export as a GeoJSON file. There is also the option to backdate the query to what the OSM map was at a certain date.

# all.js
This will generate the `all.geojson` required.

## Input
The following CSV files are required to be in the same folder.

Some general notes about gym data and CSV files:
- There may be multiple gyms with the same name. You should make sure the names are unique (possibly by appending (2) to the duplicate), because the script will rely on string matching.
- `"` should be used to enclose gym names, `,` for delimiters.
- You can include `"` in names by using `""` instead.
    - eg. `"New ""Old"" TPY 240 Playground",1.3408059999999997,103.850371`

### gyms.csv
- This should rarely change.
- Headers **should not be present**.
- You can name these headers anything, but your columns must be in the correct order.
```
| Gym Name           | Latitude           | Longitude  |
|--------------------|--------------------|------------|
| Nicoll Highway MRT | 1.3002109999999998 | 103.863283 |
| Marymount Station  | 1.347791           | 103.840229 |
```

### parks.csv
- Generated from https://github.com/MzHub/osmcoverer
- Provide the above `gyms.csv` and appropriate park `GeoJSON` from overpass file to it

### exraids.csv
- This will likely be updated frequently as your data arrives in. Each column gets its own date, and empty cells means that the location did not have a raid for that wave. 
- **The first row should first contain any string ("Gym Name"), and then ex raid dates (in YYYY-MM-DD format)**.
- In the columns, either put the start timing of the raid (in 24 hour format) or any other non-empty string (if you don't know, or don't want to add the raid time). All raids are assumed to be 45 minutes long.
```
| Gym Name           | 2017-12-03 | 2017-12-18 | 2018-01-09 |
|--------------------|------------|------------|------------|
| Nicoll Highway MRT |            | 10.30      | 16.30      |
| Tablet of Flora    |            |            | 12.30      |
| Foliage Garden     | x          |            |            |
```

### s2_L*.geojson (generated from [s2.js](https://github.com/xiankai/s2-grid))
- For every cell level you wish to show as a grid, have the corresponding file present.
    - eg. `s2_L12.geojson`
- Currently cell levels 10, 12 and 13 are being/have been used in EX-raid distribution.

### Usage
The above file names are assumed to be in the same directory.

`node all.js`

# sheets.js

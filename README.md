# Tools for generating compiled datasets for EX-raid map
Demo: https://xiankai.github.io/sg-pokemongo-ex-raid-map/  
Linked Repo: https://github.com/xiankai/sg-pokemongo-ex-raid-map

# Installation
This assumes basic knowledge of `node`, `npm` or `yarn`.

1. Clone this repo
2. Run `yarn` to install dependencies. 
    - You must be on node 6 to compile @mapbox/s2-node on OSX, but you should switch to node 8+ for better performance afterwards.

# overpass.c
OSM query template for https://overpass-turbo.eu/

It has the `c` extension for formatting as the syntax is derived from C.

After running the query you should have the option to Export as a GeoJSON file. There is also the option to backdate the query to what the OSM map was at a certain date.

# s2.js
This will generate the `s2.geojson` required. You should only need to run this once.

Given 2 coordinates to define a rectangular boundary for your desired area, it will produce a GeoJSON file containing S2 level 12 cells, labelled with a grid with A-Z for columns and numbers for rows.

## Input

### coordinates.txt
```
1.2404, 104.0152
1.4714, 103.6318
```

### Usage
`node s2.js coordinates.txt`

# all.js
This will generate the `all.geojson` required.

## Input
The following CSV files are required. 

### gyms.csv
- This should rarely change.
- Headers are assumed to be present, so the first row will be skipped. 
- You can name these headers anything, but your columns must be in the correct order.
```
| Gym Name           | Latitude           | Longitude  |
|--------------------|--------------------|------------|
| Nicoll Highway MRT | 1.3002109999999998 | 103.863283 |
| Marymount Station  | 1.347791           | 103.840229 |
```

### exraids.csv
- This will likely be updated frequently as your data arrives in. Each column gets its own date, and empty cells means that the location did not have a raid for that wave. 
- The first row will contain the gym name and ex raid dates (in YYYY-MM-DD format).
- In the columns, either put the start timing of the raid (in 24 hour format) or any other non-empty string (if you don't know, or don't want to add the raid time). All raids are assumed to be 45 minutes long.
```
| Gym Name           | 2017-12-03 | 2017-12-18 | 2018-01-09 |
|--------------------|------------|------------|------------|
| Nicoll Highway MRT |            | 10.30      | 16.30      |
| Tablet of Flora    |            |            | 12.30      |
| Foliage Garden     | x          |            |            |
```

### parks.geojson (generated from `overpass.c`)

### s2.geojson (generated from `s2.js`)

### Usage
The above file names are assumed to be in the same directory.

`node all.js`

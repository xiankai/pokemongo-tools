[date:"2016-07-10T00:00:00Z"]
[timeout:620]
[bbox:{{bbox}}];
(

//Tags that are confirmed to classify gyms as 'parks' for EX Raids
    way[leisure=park];
    way[landuse=recreation_ground];
    way[leisure=recreation_ground];
    way[leisure=pitch];
    way[leisure=garden];
    way[leisure=golf_course];
    way[leisure=playground];
    way[landuse=meadow];
    way[landuse=grass];
    way[landuse=greenfield];
    way[natural=scrub];
    way[natural=grassland];
    way[landuse=farmyard];

//Tags that have been linked to nests but not yet proven to work for EX Raids
//    way[natural=plateau];
//    way[boundary=national_park]; 
//    way[leisure=nature_reserve];
//    way[natural=heath];
//    way[natural=moor];
//    way[landuse=farmland];
//    way[landuse=orchard];
//    way[landuse=vineyard];
);
out body;
>;
out skel qt;

//Confirmed OSM tags will appear in blue
//Unconfirmed OSM tags will appear in grey

{{style:

    way[leisure=park],
    way[landuse=recreation_ground], 
    way[leisure=recreation_ground],
    way[leisure=pitch],
    way[leisure=garden],
    way[leisure=golf_course],
    way[leisure=playground],
    way[landuse=meadow],
    way[landuse=grass],
    way[landuse=greenfield],
    way[natural=scrub],
	way[natural=grassland],
    way[landuse=farmyard]
{ color:blue; fill-color:blue; }


    way[leisure=nature_reserve],
	way[natural=plateau],
    way[natural=heath],
    way[natural=moor],
    way[landuse=farmland],
    way[landuse=orchard],
    way[landuse=vineyard]
{ color:grey; fill-color:grey; }
}}

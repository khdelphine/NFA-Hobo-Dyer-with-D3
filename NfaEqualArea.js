/* Credits: To develope this code I used several examples from the community, such as:
      Cylindrical Equal-Area Projection: http://blockbuilder.org/mbostock/3712408
      Chropleth map: https://bl.ocks.org/mbostock/4060606
      Tooltips: https://bl.ocks.org/d3noob/257c360b3650b9f0a52dd8257d7a2d73
      Zoom to Bounding Box: https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
*/


// ***********************************
// Set up the most crucial elements for the map

// Get the SVG from the DOM and define its size:
var svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

//Add a group where the zoomable map will be built
var gMain = svg.append("g")
  .attr("class", "main")
  .attr("width", "100%")
  .attr("height", "100%");

// Add a light gray rectangle for the background
gMain.append("rect")
  .attr("class", "background")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("fill", "#eeeeee")


// ***********************************
// Define the general zooming behavior

// We start as scale 1:
var currentScale = 1;

// Define the width of the country boundary stroke, based on the scale:
var strokeScale = d3.scaleLinear()
  .domain([1, 8])
  .range([0.5, 0.15]);

// Define the width of the highlighted country boundary stroke, based on the scale:
var highlightedStrokeScale = d3.scaleLinear()
  .domain([1, 8])
  .range([3, 0.4]);

// Define the general zooming behavior
var zoom = zoomingBehavior()

// Apply zooming to the SVG to enable mouse-wheel based zooming:
svg.call(zoom);

// ***********************************
// Define the map projection, SVG "path", and scales

// First, the projection:
var projection = d3.geoCylindricalEqualArea()
  .parallel(37.5) // Hobo-Dyer's projection
  .scale(172)
  .translate([width / 2, height / 2])
  .precision(0.1);

// Define the SVG "path" for the map:
var path = d3.geoPath()
  .projection(projection);

// Define the linear scale to draw the legend:
var legendY = d3.scaleLinear()
  .domain([0, 10])
  .rangeRound([0, 200]);

// Define the color ramp:
var color = d3.scaleThreshold()
  .domain(d3.range(0, 11))
  .range(d3.schemeReds[9]);

// ***********************************
// Add extra elements to the map

// First, create the legend:
var gKey = svg.append("g")
  .attr("class", "key")
  .attr("transform", "translate(18  ,240)");
addLegendColorSquares();
addLegendText();

// Add the data credit line at the bottom of the map
var footer = svg.append("text")
  .attr("class", "footer")
  .attr("x",width - 15)
  .attr("y", height - 12 )
  .text("Data credit: Natural Earth and Global Footprint Network");

// Define the behavior and position of the zooming buttons:
defineZoomingButtonBehavior();

// Tooltips: this variable will be used to create the informational tooltips later on:
var tooltip = d3.select(".tooltip");

// ***********************************
// Download all the data:
var promises = [
  //The first dataset contains all country polygons,
  // including the arctic region, greenland, and antarctica
  // and will be used as a background:
  d3.json("data/world-50m.json"),
  // The second dataset contains polygons and property data for NFA countries
  // And will be used for the thematic layer:
  d3.json("data/NFACountries_WGC_1984_topojson.json")
]

// Start downloading, and proceed only when the data is ready:
Promise.all(promises).then(function(data){
  ready(data[0], data[1]);
}).catch(function(error){
  console.log(error);
});

// ***********************************
// FUNCTIONS

// Define the main zooming behavior
function zoomingBehavior(){
  return d3.zoom()
  // We are allowing zooming between scale 1 and 8:
  .scaleExtent([1, 8])
  .on("zoom", function() {
    // Get the new scale:
    currentScale = d3.event.transform.k;
    // Set the new stroke width for the country boundaries:
    d3.selectAll(".country")
      .style("stroke-width", strokeScale(currentScale) + "px");
    // Apply the zooming transformation to the gMain group:
    // (not SVG, which would make also the legend and footer zoom in and out):
    gMain.attr("transform", d3.event.transform);
  })
}


// Draw the legend's small colored rectangles:
function addLegendColorSquares(){
  gKey.selectAll("rect")
      // Get the break numbers for each color of the ramp:
      .data(color.range().map(function(d) {
          d = color.invertExtent(d);
          if (d[0] == null) d[0] = legendY.domain()[0];
          if (d[1] == null) d[1] = legendY.domain()[1];
          return d;
      }))
      // Create the small colored rectangles and place them at the right location:
      .enter().append("rect")
      .attr("height", 20)
      .attr("width", 20)
      .attr("x", 0)
      // find the Y value for each break value of the ramp:
      .attr("y", function(d) {return legendY(d[0]); })
      // find the corresponding color for each break value:
      .attr("fill", function(d) { return color(d[0])})
  }

// Add the legend's text:
function addLegendText(){
  gKey.append("text").attr("y", 10).text("Low");
  gKey.append("text").attr("y", 24).text("Footprint");
  gKey.append("text").attr("y", 150).text("High");
  gKey.append("text").attr("y", 164).text("Footprint");

  d3.selectAll("text").attr("class", "legend-text").attr("x",28)
}

// Define the behavior and position of the zooming buttons
function defineZoomingButtonBehavior(){
  // First, find the left side of the SVG, to which the buttons will be aligned:
  var middleX = window.innerWidth / 2;
  var buttonX = (middleX - (width/2)) + 15;
  // Decide on the fixed Y value:
  var buttonY = 180;

  var zoomIn = d3.select("#zoom_in");
  zoomIn.on("click", function() {
    zoom.scaleBy(gMain, 1.2);
    })
    .style("left", buttonX + "px")
    .style("top", buttonY + "px");

  var zoomOut = d3.select("#zoom_out");
    zoomOut.on("click", function() {
      zoom.scaleBy(gMain, 0.8);
    })
    .style("left", buttonX + "px")
    .style("top", buttonY + 35 + "px");
}

// Draw the map's vector features (once the data has been downloaded):
function ready(worldBackground, NfaWorld) {
  // First draw the continents' land, which will serve as a basemap:
  displayBasemap(worldBackground);

  // Draw the choropleth thematic map:
  displayThematicLayer(NfaWorld);

  // Define behavior when the mouse hovers above a country:
  defineMouseOverBehavior();

  // Define behavior when the mouse moves away from a country:
  defineMouseOutBehavior()

}

// Draw the continents' land, which will serve as a basemap:
function displayBasemap(worldBackground){
  gMain.append("path")
    .datum(topojson.feature(worldBackground, worldBackground.objects.land))
    .attr("class", "land")
    .attr("d", path)
}

// Draw the choropleth thematic map:
function displayThematicLayer(NfaWorld){
  gMain.append("g")
    .selectAll(".countries")
       // Get all the countries and display them:
       .data(topojson.feature(NfaWorld, NfaWorld.objects.Countries).features)
       .enter()
       .append("path")
       // Choose the color of each country based on its Ecological Footprint value:
       .attr("fill", function(d) {
          return color(d.properties.TotFtprntCons); })
       .attr("class", "country")
       .attr("d", path);
}

// Define behavior when the mouse hovers above a country:
function defineMouseOverBehavior(){
  d3.selectAll(".country")
      .on("mouseover", function(d) {
        // First, reattach the country feature to make sure it is at the uttermost top
        // (Otherwise, the highlighting styling will get partly hidden by the neighboring countries)
        d3.select(this)
          .each(function() {
              this.parentNode.appendChild(this);
            })
          // Apply the highlight color of the boundary:
          .style("stroke"," #444444")
          // Get the width of the highlighted stroke based on the current scale:
         .style("stroke-width", highlightedStrokeScale(currentScale) + "px");
      // Next build the tooltip;
       tooltip.transition()
         .duration(400)
         .style("opacity", 0.8);
       // We put together the text we want to display:
       var tooltipContent = d.properties.Name +":<br/>" + d.properties.TotFtprntCons + " gha";
       tooltip.html(tooltipContent)
         // And we define the location at which the tooltip should appear (ie, where the mouse is):
         .style("left", (d3.event.pageX) + "px")
         .style("top", (d3.event.pageY - 28) + "px");
   })
 }

// Define behavior when the mouse moves away from a country:
function defineMouseOutBehavior(){
  d3.selectAll(".country")
  .on("mouseout", function() {
    // Go back to the non-highlighted stroke style:
     d3.select(this).style("stroke","white");
     d3.select(this).style("stroke-width", strokeScale(currentScale) + "px");
     //remove the tooltip from sight on "mouseout":
     tooltip.transition()
       .duration(500)
       .style("opacity", 0);
   })
}

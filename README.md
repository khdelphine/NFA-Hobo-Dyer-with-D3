# NFA-Hobo-Dyer-with-D3
Used D3 and TopoJson to display the Global Footprint Network NFA 2018 data in the equal-area projection Hobo-Dyer.

(Also uses HTML, JS, CSS, Bootstrap, and Natural Earth data for the basemap.)

I wanted to use a projection other than Web Mercator for my project. More precisely, 
Intead of using Web Mercator, uses Hobo-Dyer, which is an equal-area projection, to allow for a more realistic comparison of different continents and countries. Hobo-Dyer is a type of cylindrical Equal Area projection with standard parallels at 37.5 North and South of the equator. It can be defined with the D3 function: d3.geoCylindricalEqualArea().

I generated the TopoJson out of a GeoJson file using Mapshaper (http://mapshaper.org/)

I implemented the following features:
* Basic basemap and thematic layer display
* Highlighting the current country when the mouse is hovering over it
* Implementing tooltips  
* Adding a legend 
* Implementing zooming both through the “mouse wheel” and zooming buttons.
* Adjust the width of the country boundaries (highlighted or non highlighted) based on the current zooming level.

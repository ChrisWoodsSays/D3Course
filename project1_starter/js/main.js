const topRockAlbums = [
    { artist: "Queen", title: "Greatest Hits", eq_albums: 929000 },
    { artist: "Elton John", title: "Diamonds", eq_albums: 743000 },
    { artist: "Fleetwood Mac", title: "Rumours", eq_albums: 721000 },
    { artist: "CCR", title: "The 20 Greatest Hits", eq_albums: 630000 },
    { artist: "Journey", title: "Journey's Greatest Hits", eq_albums: 561000 }
 ];
 //d3.select('body').style('background-color', 'pink');
 const topAlbumsSection = d3.select('#top-albums');
 topAlbumsSection
 .append('h3')
    .text('Top Rock Albums');

// Create SVG for Bar Chart
const barChartWidth = 500;
const barChartHeight = 130;
const barChart = topAlbumsSection
    .append('svg')
        .attr('viewbox', [0, 0, barChartWidth, barChartHeight])
        .attr('width', barChartWidth)
        .attr('height', barChartHeight);

const marginLeft = 200;
// Add vertical line (kinda Y axis)
barChart
    .append('line')
        .attr('x1', marginLeft)
        .attr('y1', 0)
        .attr('x2', marginLeft)
        .attr('y2', barChartHeight)
        .attr('stroke', '#333')
        .attr('stroke-width', 2);

// Create Bar Chart Linear Scale
const barLengthScale = d3.scaleLinear()
    .domain([0, 1000000]) // In our data, the number of album-equivalent goes up to about 1,000,000
    .range([0, barChartWidth - marginLeft - 100]); // Based on the space that we have on screen and the space we need for the labels

console.log(barLengthScale(700000))

const barThickness = 20;
const barMargin = 5;

// Add bars
barChart.selectAll('rect')
    .data(topRockAlbums)
    .join('rect')
        .attr('width', d => barLengthScale(d.eq_albums))
        // re-write the width .attr() function so we can add the
        // console log to see the whole contents of each datum (d)
        // .attr('width', d => {
        //     console.log(d);
        //     return barLengthScale(d.eq_albums)
        //  })
        .attr('height', barThickness)
        .attr('x', marginLeft + 1)
        .attr('y', (d, i) => barMargin + (barThickness + barMargin) * i)
        .attr('fill', '#a6d854');

// Add Value (Volume) Labels
barChart.selectAll('.label-value')
    .data(topRockAlbums)
    // When using a class name as a selector for data-binding, we still need to pass 
    // an HTML or SVG element tag to the .join() function and then apply the 
    // class name (text) as an attribute to that element.
    .join('text')
         // We'll add two classes, one for the value (volume) and one for the name
        .attr('class', 'label label-value')
        .attr('x', d => marginLeft + barLengthScale(d.eq_albums) + 10)
        .attr('y', (d, i) => (barMargin + (barThickness + barMargin) * i) + 14)
        .text(d => d.eq_albums / 1000000 + 'M');

// Add Artist and Album Title Labels
barChart.selectAll('.label-artist-album')
    .data(topRockAlbums)
    .join('text')
        .attr('class', 'label label-artist-album')
        .attr('x', 10)
        .attr('y', (d, i) => (barMargin + (barThickness + barMargin) * i) + 14)
        .text(d => d.artist + ", " + d.title);

const topSongsSection = d3.select('#top-songs');
topSongsSection
    .append('p')
    .append('h3')
        .text('Top Rock Songs');

// Create SVG for Circles Chart
const circlesChartWidth = 600;
const circlesChartHeight = 140;
const circlesChart = topSongsSection
    .append('svg')
        .attr('viewbox', [0, 0, circlesChartWidth, circlesChartHeight])
        .attr('width', circlesChartWidth)
        .attr('height', circlesChartHeight);

// Add horizotnal line (kinda X axis)
circlesChart
    .append('line')
        .attr('x1', 0)
        .attr('y1', circlesChartHeight / 2)
        .attr('x2', circlesChartWidth)
        .attr('y2', circlesChartHeight / 2)
        .attr('stroke', '#333')
        .attr('stroke-width', 1);

// Add Circle Groups
// Select them using the human readable class name of g elements
circlesChartGroup = circlesChart.selectAll('.circleGroup')
    .data(topRockSongs)
    .join('g')
        .attr('class', 'circle-group');

// Create Circle Linear Scale
// Circles should always be sized based on their area, not their radius!
const radiusMax = 40;
const circlesScale = d3.scaleLinear()
    .domain([0, d3.max(topRockSongs, d => d.sales_and_streams)]) 
    .range([0, Math.PI * Math.pow(radiusMax, 2)]);

// We can now APPEND circles to the Groups
const marginMargin = 15;
circlesChartGroup
    .append('circle')
        .attr('r', d => Math.sqrt(circlesScale(d.sales_and_streams) / Math.PI))
        .attr('cx', (d, i) => radiusMax + marginMargin + (i * 2 * (radiusMax + marginMargin)))
        .attr('cy', circlesChartHeight / 2)
        .attr('fill', '#a6d854');

// Add APPEND Songs Sold Labels
circlesChartGroup
    .append('text')
        .attr('class', 'label label-sales')
        .attr('x', (d, i) => radiusMax + marginMargin + (i * 2 * (radiusMax + marginMargin)))
        .attr('y', circlesChartHeight - 5)
        .attr('text-anchor', 'middle')
        .text(d => d.sales_and_streams/ 1000000 + 'M');

// Add APPEND Song Title Labels
circlesChartGroup
    .append('text')
        .attr('class', 'label label-titles')
        .attr('x', (d, i) => radiusMax + marginMargin + (i * 2 * (radiusMax + marginMargin)))
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .text(d => d.title);


const topRockSongs = [
    { artist: "Fleetwod Mac", title: "Dreams", sales_and_streams: 1882000 },
    { artist: "AJR", title: "Bang!", sales_and_streams: 1627000 },
    { artist: "Imagine Dragons", title: "Believer", sales_and_streams: 1571000 },
    { artist: "Journey", title: "Don't Stop Believin'", sales_and_streams: 1497000 },
    { artist: "Eagles", title: "Hotel California", sales_and_streams: 1393000 }
 ];

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


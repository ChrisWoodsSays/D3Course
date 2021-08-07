const margin = {top: 30, right: 20, bottom: 50, left: 60};
const width = 1200;
const height = 600;
const padding = 10;
const color = 'steelblue';

d3.csv('./data/pay_by_gender_tennis.csv').then(data => {
    //console.log(data);
    createHistogram(data);
});

function createHistogram(data) {

    const players = [];
    data.forEach(datum => {
        // Remove commas and then use unary + to convert to a number
        datum.earnings_USD_2019 = +datum.earnings_USD_2019.replace(/,/g, '');
        // Get list of players
        players.push(datum.name);
    });

    const HistoBin = d3.bin().value(d => d.earnings_USD_2019);;
    binnedData = HistoBin(data)

    // Create Linear X Earnings Scale
    const earningsScale = d3.scaleLinear()
        .domain([binnedData[0].x0, binnedData[binnedData.length - 1].x1])
        .range([margin.left, width - margin.right]);
    // Create Linear Y Players Scale
    const playersScale = d3.scaleLinear()
        .domain([0, d3.max(binnedData, d => d.length)])
        .range([height - margin.bottom, margin.top]);

    const histogramDiv = d3.select('#viz')
    histogram = histogramDiv
        .append('svg')
            .attr('viewbox', [0, 0, width, height])
            .attr('width', width)
            .attr('height', height);

    // Define X Earnings Axis
    const xAxis = d3.axisBottom(earningsScale)
        .ticks((width - margin.left - margin.right) / 100)
        .tickSizeOuter(0);

    // Create xAxis Group at BOTTOM of histogram
    const xAxisGroup = histogram
        .append('g')
            .attr('class', 'x-axis-group')
            .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(xAxis);
    // Add axis title
    xAxisGroup
        .append('text')
            .attr('text-anchor', 'end')
            .attr('x', width - margin.right)
            .attr('y', 40) // just 40 as this group is already at the bottom
            .text('Earnings in 2019 (USD)')
            .attr('fill', 'black')
            .style('font-size', 15);

    // Add Y Players Axis
    histogram
        .append('g')
            .attr('transform', `translate(${margin.left})`)
                .call(d3.axisLeft(playersScale));
    // Add bars
    histogram
        .append("g")
            .attr('class', 'bars-group')
        .selectAll(".rect")
        .data(binnedData)
        .join("rect")
            .attr("x", d => earningsScale(d.x0) + 0 *padding/2)
            .attr("y", d => playersScale(d.length))
            .attr("width", d => earningsScale(d.x1) - earningsScale(d.x0) - 0 * padding)
            .attr("height", d => playersScale(0) - playersScale(d.length))
            .style("fill", color)

    
    // Add Line
    var trendLine = d3.line()
        .x(d => (earningsScale(d.x0) + earningsScale(d.x1))/2)
        .y(d => playersScale(d.length))
        .curve(d3.curveCatmullRom)
    histogram
        .append("path")
            .attr("d", trendLine(binnedData))
            .attr("fill", "none")
            .attr("stroke", "#fe9a22")
            .attr("stroke-width", 2);

    // Shade in area below like a density plot
    var shadedArea = d3.area()
        .x(d => (earningsScale(d.x0) + earningsScale(d.x1))/2)
        .y0(d => playersScale(d.length))
        .y1(height - margin.bottom)
        .curve(d3.curveCatmullRom);
    histogram
       .append("path")
       .attr("d", shadedArea(binnedData))
       .attr("fill", "yellow")
       .attr("stroke", "#75739F")
       // Dont need the stroke as line above this adds it
       // But normally. we'd just use stroke and not the separate line
       //.attr("stroke-width", 2)
       //.style("stroke-opacity", .75)
       .style("fill-opacity", .5);


}


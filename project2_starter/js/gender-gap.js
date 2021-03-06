const margin = {top: 30, right: 20, bottom: 50, left: 60};
const width = 1200;
const height = 600;
const widthPerHalfViolin = 60;

const colorMen = '#F2C53D';
const colorWomen = '#A6BF4B';
const colorMenCircles = '#BF9B30';
const colorWomenCircles = '#718233';

// Load data here
d3.csv('./data/pay_by_gender_all.csv').then(data => {
  console.log(data);
  data.forEach(datum => {
    // Remove commas and then use unary + to convert to a number
    datum.earnings_USD_2019 = +datum.earnings_USD_2019.replace(/,/g, '');
  });
  createViz(data);
});


// Create Visualization
createViz = (data) => {

  // Create bins for each sport, men and women
  const sports = [ 'basketball', 'golf', 'tennis'];
  const genders = ['men', 'women'];
  const bins = [];

  const sportGenderBin = d3.bin().value(d => d.earnings_USD_2019);  
  sports.forEach(sport => {
    genders.forEach(gender => {
      const binsSet = {
        sport: sport,
        gender: gender,
        bins: sportGenderBin(data.filter(d => d.gender == gender && d.sport == sport))
        // Anne Marie suggested using map as per below, but with predefined bin function
        // which takes earnings value, this isn't necessary
        //bins: d3.bin()(data.filter(datum => datum.sport === sport && datum.gender === gender).map(datum => datum.earnings_USD_2019))
      };
      bins.push(binsSet);
    });
  });
  console.log(bins)

  // Create Linear X for Sports Scale
  // We need to know the max length of a bin in order to generate our horizontal domain
  // Here we pass the bins array within bins to the map function which then
  // gets the length of each element in the array

  const vizDiv = d3.select('#viz')
  svg = vizDiv
    .append('svg')
      .attr('viewbox', [0, 0, width, height])
      .attr('width', width)
      .attr('height', height);

  // Create Scales
  const maxEarnings = d3.max(data, d => d.earnings_USD_2019)
  const binsMaxLength = d3.max(bins.map(bin => bin.bins), d => d.length);  
  console.log(binsMaxLength)

  const xScale = d3.scaleLinear()
    .domain([0, binsMaxLength])
    .range([0, widthPerHalfViolin]);
  // Create Linear Y Earnings Scale
  const yScale = d3.scaleLinear()
    .domain([0, maxEarnings + 5000000])
    .range([height - margin.bottom, margin.top])
    .nice();

  // Create X Sports Axis
  const spaceBetweenSports = (width - margin.left - margin.right) / (sports.length + 1);
  const xAxisGroup = svg
    .append('g')
    .attr('class', 'x-axis-group');
  xAxisGroup
    .append('line')
      .attr('class', 'x-axis')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', height - margin.bottom + 1)
      .attr('y2', height - margin.bottom + 1)
      .attr('stroke', 'black');
  xAxisGroup
    .selectAll('.sport-label')
    .data(sports)
    .join('text')
      .attr('x', (d, i) => margin.left + ((i + 1) * spaceBetweenSports))
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      // Get the first char & capitalise it then get the rest (after 1)
      .text(d => d.charAt(0).toUpperCase() + d.slice(1));

  // Create Y Earnings Axis
  const yAxis = d3.axisLeft(yScale)

  // Create yAxis Group 
  const yAxisGroup = svg
      .append('g')
          .attr('class', 'y-axis-group')
          .attr('transform', `translate(${margin.left})`)
      .call(yAxis);
  // Add axis title
  yAxisGroup
      .append('text')
          .attr('text-anchor', 'start')
          .attr('x', -margin.left)
          .attr('y', margin.top - 10)
          .text('Earnings in 2019 (USD)')
          .attr('fill', 'black')
          .style('font-size', 15);

  // Create Violins
  // Women's Violin Half
  var womensViolin = d3.area()
    .x0(d => margin.left - xScale(d.length))
    .x1(margin.left)
    .y(d => yScale(d.x1) + ((yScale(d.x0) - yScale(d.x1)) / 2))
    .curve(d3.curveCatmullRom);
  // Men's Violin Half
  var mensViolin = d3.area()
    .x0(margin.left)
    .x1(d => margin.left + xScale(d.length))
    .y(d => yScale(d.x1) + ((yScale(d.x0) - yScale(d.x1)) / 2))
    .curve(d3.curveCatmullRom);
  // Append Violins within a group
  svg
    .append('g')
      .attr('class', 'violins')
    .selectAll('.violin')
    .data(bins)
    .join('path')
      .attr('class', d => `violin violin-${d.sport} violin-${d.gender}`)
      .attr('d', d => d.gender === 'women' ? womensViolin(d.bins) : mensViolin(d.bins))
      // Now transform each sport to its own place
      .attr('transform', d => {
        const index = sports.indexOf(d.sport) + 1;
        const translationX = index * spaceBetweenSports;
        return `translate(${translationX}, 0)`; // The margin.left part of the translation is applied in the areaGenerator functions to avoid negative x values for women
      })
      .attr('fill', d => d.gender === 'women' ? colorWomen : colorMen)
      .attr('fill-opacity', 0.8)
      .attr('stroke', 'none')
      .style("filter", "url(#glow)");

  // Add circles for each player
  const circlesRadius = 2.5;
  const circlesPadding = 0.7;
  tennisDataMen = data;
  const simulation = d3.forceSimulation(data)
    // Place them around the margin as we'll transform this to the specific sport x position
    // on the circle append later
    .force('forceX', d3.forceX(margin.left).strength(0.1))
    .force('forceY', d3.forceY(d => yScale(d.earnings_USD_2019)).strength(10))
    .force('collide', d3.forceCollide(circlesRadius + circlesPadding))
    // if x is left of violin centre then change velocity to positive (moving to the right)
    .force('axis', () => {
      data.forEach(datum => {
        if (datum.gender == "men" && datum.x < (margin.left)) {
            datum.vx += 0.01 * datum.x;
          } else 
          if (datum.gender == "women" && datum.x > (margin.left)) {
            datum.vx -= 0.01 * datum.x;
        }
        if (datum.y > (height - margin.bottom)) {
          datum.vy -= 0.01 * datum.y;
        }
      });
    })
    .stop();

  // Run for 300 ticks (not until is cools) to get a good enough set of positions
  const numIterations = 300;
  for (let i = 0; i < numIterations; i++) {
    simulation.tick();
  }
  simulation.stop();

  // Add Circles
  svg
    .append('g')
      .attr('class', 'circles-group')
    .selectAll('.circle')
    .data(tennisDataMen)
    .join('circle')
      .attr('r', d => circlesRadius)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('fill', d => d.gender == "men"?colorMenCircles:colorWomenCircles)
      // Now transform each sport to its own place on the x axis
      .attr('transform', d => {
        const index = sports.indexOf(d.sport) + 1;
        const translationX = index * spaceBetweenSports;
        return `translate(${translationX}, 0)`; 
      })

  // Add tooltip    
  d3.selectAll('circle')
      .on('mouseover', (event, d) => {
        handleMouseOver(event, d);
      })
      .on('mouseout',  d => handleMouseOut());

  const tooltip = d3.select('.tooltip');

  function handleMouseOver(e, d) {
    //  Call and populate the tooltip

    // Populate tooltip information
    tooltip.select('.name').text(d.name);
    tooltip.select('.home').text(d.country);
    tooltip.select('.earnings .salary').text(d3.format('~s')(d.earnings_USD_2019));
    
    // Position and reveal tooltip
    tooltip
      .style('top', `${e.pageY + 20}px`)
      .style('left', `${e.pageX + 20}px`)
      // turn a class on and off without affecting the other classes that this element might have
      .classed('visible', true);
  }

  function handleMouseOut() {
    // Hide tooltip
    tooltip
      .classed('visible', false);
  }

  // Add legend
  const legendWidth = 30;
  const legendHeight = 15;
  const legend = svg
    .append('g')
      .attr('class', 'legend-group')
      .attr('transform', `translate(${margin.left + 30}, ${margin.top + 10})`);
  legend
    .append('rect')
      .attr('y', 0)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', colorWomen);
  legend
    .append('rect')
      .attr('y', legendHeight + 5)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', colorMen);
  legend
    .append('text')
      .attr('x', legendWidth + 7)
      .attr('y', 12)
      .style('font-size', '14px')
      .text('Women');
  legend
    .append('text')
      .attr('x', legendWidth + 7)
      .attr('y', legendHeight + 18)
      .style('font-size', '14px')
      .text('Men');

  // Append container for the glow effect: defs
  const defs = svg.append('defs');

  // Add filter for the glow effect
  const filter = defs
     .append('filter')
        .attr('id', 'glow');
  filter
     .append('feGaussianBlur')
        .attr('stdDeviation', '3.5')
        .attr('result', 'coloredBlur');
  const feMerge = filter
     .append('feMerge');
  feMerge.append('feMergeNode')
     .attr('in', 'coloredBlur');
  feMerge.append('feMergeNode')
     .attr('in', 'SourceGraphic');


};

    
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

  // Create xAxis Group at BOTTOM of chaty
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
      .attr('stroke', 'none');
};

    
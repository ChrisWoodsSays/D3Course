const margin = {top: 100, right: 20, bottom: 50, left: 50};
const width = 1160;
const height = 600;
const groups = [
  { key: 'nominees_caucasian', label: 'caucasian or another', color: '#EFC7C2' },
  { key: 'nominees_afrodescendant', label: 'afrodescendant', color: '#68A691' },
  { key: 'nominees_hispanic', label: 'hispanic', color: '#694F5D' },
  { key: 'nominees_asian', label: 'asian', color: '#BFD3C1' },
];

// Load the data here
d3.csv('./data/academy_awards_nominees.csv').then(data => {
  data.forEach(datum => {
    // Remove commas and then use unary + to convert to a number
    //datum.earnings_USD_2019 = +datum.earnings_USD_2019.replace(/,/g, '');
  });
  console.log(data);
  createViz(data);
});
// Create your visualization here
const createViz = (data) => {
  const dataFormatted = [];
  data.forEach(datum =>{
      // If dataFormatted doesn't already contain the data's year, add an entry for that year to dataFormatted
      if (!dataFormatted.find(ceremony => ceremony.year == datum.year)) {
        const ceremony = {
          year: +datum.year, // Convert the year from string to number
          nominees_total: 1, // Initialize the number of nominees to 1
          nominees_caucasian: datum.ethnic_background == "" ? 1:0, // If ethnic_background contains an empty string, nominees_caucasian equals 1, otherwise 0
          nominees_afrodescendant: datum.ethnic_background == "black" ? 1:0, // If ethnic_background is 'black', nominees_black equals 1, otherwise 0
          nominees_hispanic: datum.ethnic_background == "hispanic" ? 1:0, // If ethnic_background is 'hispanic', nominees_hispanic equals 1, otherwise 0
          nominees_asian: datum.ethnic_background == "asian" ? 1:0 // If ethnic_background is 'asian', nominees_asian equals 1, otherwise 0
        };
        dataFormatted.push(ceremony); // Add ceremony to dataFormatted
      } else {
        // If dataFormatted already contains the current year, find the related data
        const ceremony = dataFormatted.find(ceremony => ceremony.year == datum.year);

        // Update the counters
        ceremony.nominees_total += 1;
        switch (datum.ethnic_background) {
            case '':
              ceremony.nominees_caucasian++;
              break;
            case 'black':
              ceremony.nominees_afrodescendant++;
              break;
            case 'hispanic':
              ceremony.nominees_hispanic++;
              break;
            case 'asian':
              ceremony.nominees_asian++;
              break;
        }
      }
  });
  
  console.log(dataFormatted)
  //Create an ordinal color scale, attaching a color to each group of nominees. You can use the colors from the array groups at the top of the main.js file, use one of the palettes available in d3, or even create your own (go check coolors.co)!
  //Create a linear x-scale that will position the data horizontally. While you could potentially use d3.scaleTime(), a linear scale can also do the trick since we only work with years.
  //Finally, create a y-scale for the vertical axis, linearly proportional to the number of nominees.

  // Create Ordinal Circle Colour Scale
  const groupsColourScale = d3.scaleOrdinal()
    .domain(groups.map(group => group.key))
    .range(groups.map(group => group.color));

  // Create Linear X Year Scale
  const xScale = d3.scaleLinear()
    .domain(d3.extent(dataFormatted, d => d.year))
    .range([margin.left, width - margin.right]);
  // Create Linear Y Nominees Scale
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(dataFormatted, d => d.nominees_total)])
    .range([height - margin.bottom, margin.top]);

  const svg = d3.select('#viz')
      .append('svg')
        .attr('viewbox', [0, 0, width, height])
        .attr('width', width)
        .attr('height', height);

  // Create the stack generator based om the groups we want to stack
  const stack = d3.stack()
    .keys(groups.map(group => group.key))
    .order(d3.stackOrderAscending)
    .offset(d3.stackOffsetNone);

  let years = stack(dataFormatted);

  console.log(years)

  // Initialize the area generator
  const area = d3.area()
    .x(d => xScale(d.data.year))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
    .curve(d3.curveCatmullRom);

  // Append steam paths
  svg
    .append('g')
      .attr('class', 'stream-paths')
    .selectAll('path')
    .data(years)
    .join('path')
      .attr('d', area)
      .attr('fill', d => groupsColourScale(d.key))
      .attr('fill-opacity', 0.8)
      .attr('stroke', 'none')

  // Create X Earnings Year
  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.format("d"));

  // Create xAxis Group 
  const xAxisGroup = svg
      .append('g')
          .attr('class', 'x-axis-group')
          .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis);

  // Create Y Earnings Axis
  const yAxis = d3.axisLeft(yScale)

  // Create yAxis Group 
  const yAxisGroup = svg
      .append('g')
          .attr('class', 'y-axis-group')
          .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis);

  // Add Y axis title
  yAxisGroup
    .append('text')
        .attr('text-anchor', 'start')
        .attr('x', -margin.left)
        .attr('y', margin.top - 20)
        .text('Number of Nominees')
        .attr('fill', 'black')
        .style('font-size', 12);

  // Append a color legend
  const legend = d3.select('.legend') //select div with class of legend
    .append('ul')
    .selectAll('li') // Create list items within UL for each group
    .data(groups)
    .join('li');
  legend
    .append('span') // Seems to add this to each li
      .attr('class', 'legend-color')
      .style('background-color', d => d.color);
  legend
    .append('span')
      .attr('class', 'legend-label')
      .text(d => d.label);

};
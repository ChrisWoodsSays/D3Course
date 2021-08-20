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
  console.log('orginal data', data);

  const dataFormatted = [];
  data.forEach(datum => {
    // If dataFormatted doesn't already contain the current year, append a new object
    if (!dataFormatted.find(ceremony => ceremony.year == datum.year)) {
      const ceremony = {
        year: +datum.year, // Convert the year from string to number
        nominees_total: 1,
        nominees_caucasian: datum.ethnic_background === '' ? 1 : 0,
        nominees_afrodescendant: datum.ethnic_background === 'black' ? 1 : 0,
        nominees_hispanic: datum.ethnic_background === 'hispanic' ? 1 : 0,
        nominees_asian: datum.ethnic_background === 'asian' ? 1 : 0
      };
      dataFormatted.push(ceremony);
    } else {
      const ceremony = dataFormatted.find(ceremony => ceremony.year == datum.year);
      ceremony.nominees_total += 1;
      switch (datum.ethnic_background) {
        case '':
          ceremony.nominees_caucasian += 1;
          break;
        case 'black':
          ceremony.nominees_afrodescendant += 1;
          break;
        case 'hispanic':
          ceremony.nominees_hispanic += 1;
          break;
        case 'asian':
          ceremony.nominees_asian += 1;
          break;
      }
    }
  });
  console.log('data formatted', dataFormatted);

  createViz(dataFormatted);
});

// Create your visualization here
const createViz = (dataFormatted) => {

  // Create scales
  const scaleColor = d3.scaleOrdinal()
    .domain(groups.map(group => group.key))
    .range(groups.map(group => group.color));

  const scaleX = d3.scaleLinear()
    .domain(d3.extent(dataFormatted, d => d.year))
    .range([margin.left, width - margin.right])

  const scaleY = d3.scaleLinear()
    .domain([0, d3.max(dataFormatted, d => d.nominees_total)])
    .range([height - margin.bottom, margin.top]);

  
  // Append svg element
  const svg = d3.select('#viz')
    .append('svg')
      .attr('viewbox', [0, 0, width, height])
      .attr('width', width)
      .attr('height', height);

  // Initialize the stack generator
  const stack = d3.stack()
    .keys(groups.map(group => group.key))
    .order(d3.stackOrderAscending) // The smallest areas at the bottom and the largest ones at the top.
    .offset(d3.stackOffsetNone); // Applies a zero baseline.

  // Call the stack generator to produce a stack for the data
  let series = stack(dataFormatted);
  console.log('series', series);

  // Initialize the area generator
  const area = d3.area()
    .x(d => scaleX(d.data.year))
    .y0(d => scaleY(d[0]))
    .y1(d => scaleY(d[1]))
    .curve(d3.curveCatmullRom);

  // Append nominees paths
  const nomineesPaths = svg
    .append('g')
      .attr('class', 'stream-paths')
    .selectAll('path')
    .data(series)
    .join('path')
      .attr('d', area)
      .attr('fill', d => scaleColor(d.key));


  // Append X axis
  axisBottom = d3.axisBottom(scaleX)
    .tickFormat(d3.format(''))
    .tickSizeOuter(0);
  xAxis = svg
    .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .style('font-family', '"Oxygen", sans-serif')
      .style('font-size', '14px')
      .style('opacity', 0.7)
    .call(axisBottom);
  svg
    .append('text')
      .attr('class', 'axis-label axis-label-x')
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(${(width - margin.left - margin.right) / 2 + margin.left}, ${height})`)
      .text('Year');

  // Append Y axis
  const axisLeft = d3.axisLeft(scaleY)
    .tickSizeOuter(0);
  const yAxis = svg
    .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .style('font-size', '14px')
      .style('opacity', 0.7)
    .call(axisLeft);
  svg
    .append('text')
      .attr('class', 'axis-label axis-label-y')
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(12, ${(height - margin.top - margin.bottom) / 2 + margin.top}) rotate(270)`)
      .text('Number of Nominees');


  // Append a color legend
  const legend = d3.select('.legend')
    .append('ul')
    .selectAll('li')
    .data(groups)
    .join('li');
  legend
    .append('span')
      .attr('class', 'legend-color')
      .style('background-color', d => d.color);
  legend
    .append('span')
      .attr('class', 'legend-label')
      .text(d => d.label);

};
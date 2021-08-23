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
  console.log(data);
  const awards = getAwards(data);
  console.log(awards)
  const dataFormatted = formatData(data);
  createViz(data, awards, dataFormatted);
});

// Get Unique Awards
const getAwards = (data) => {
  const awards = [];
  const awardAll = {
    id: 'All',
    label: 'All'};
  awards.push(awardAll);
  data.forEach(datum => {
    // If dataFormatted doesn't already contain the data's year, add an entry for that year to dataFormatted
    if (!awards.find(award => award.id == datum.award_id)) {
      const award = {
        id: datum.award_id,
        label: datum.award_label};
      awards.push(award); // Add ceremony to dataFormatted
    } 
  });
  return awards;
}

// Format Data
const formatData = (data) => {
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
  return dataFormatted;
}

// Create your visualization here
const createViz = (data, awards, dataFormatted) => {

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

  // Append defs element to SVG
  // Added in milestone 3
  svg
    .append('defs')
    .append('clipPath')
      .attr('id', 'clipPath')
    .append('rect')
      .attr('x', margin.left)
      .attr('y', 0)
      .attr('width', width - margin.right - margin.left)
      .attr('height', height - margin.bottom);

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
  let steamPaths = svg
    .append('g')
      .attr('class', 'stream-paths')
    .selectAll('path')
    .data(years)
    .join('path')
      .attr('d', area)
      .attr('fill', d => groupsColourScale(d.key))
      .attr('fill-opacity', 0.8)
      .attr('stroke', 'none')
      .style('clip-path', 'url(#clipPath)'); // Added in milestone 3

  // Create X Earnings Year
  const axisBottom = d3.axisBottom(xScale)
    .tickFormat(d3.format("d"));

  // Create xAxis Group 
  const xAxis = svg
      .append('g')
          .attr('class', 'x-axis-group')
          .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(axisBottom);

  // Create Y Earnings Axis
  const axisLeft = d3.axisLeft(yScale)

  // Create yAxis Group 
  const yAxis = svg
      .append('g')
          .attr('class', 'y-axis-group')
          .attr('transform', `translate(${margin.left}, 0)`)
      .call(axisLeft);

  // Add Y axis title
  yAxis
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

  // Create tooltip
  const tooltip = svg
    .append('g')  
      .attr('class', 'tooltip')
      .attr('transform', `translate(${margin.left}, 0)`)
  // Add line
  tooltip
    .append('line')
    .attr('class', 'pointer')
    .attr('x1', 0)  
    .attr('x2', 0)
    .attr('y1', height - margin.bottom +  40 )
    .attr('y2', 0)
    .attr('stroke', 'red');

  // Create holder for year
  const tooltipYearHolder = tooltip
    .append("text")
      .attr('class', 'year-label')
      .attr('x', 0)  
      .attr('y', height - margin.bottom);

  const tooltipCeremonyTotal = tooltip
    .append('text')
      .attr('class', 'ceremony-breakdown-total')
      .attr('x', 10)
      .attr('y', 10)
      .style('font-weight', 700);

  const tooltipCeremonyBreakdown = tooltip
    .append('text')
      .attr('x', 10)
      .attr('y', 10)
      .style('font-weight', 300);

  tooltipCeremonyBreakdown
    .selectAll('tspan') 
    .data(groups)
    .join('tspan')
      .attr('class', d => `ceremony-breakdown-${d.key}`)
      .attr('x', 10)
      .attr('dy', 18);

  steamPaths.on('mousemove', e => {
    let tooltipYearValue = Math.round(xScale.invert(e.offsetX));

    // Get the data related to the current year
    const yearlyData = dataFormatted.find(ceremony => ceremony.year === tooltipYearValue);

    tooltip
      .attr('transform', `translate(${e.offsetX}, 45)`)
      .transition().duration(900).style('visibility', 'visible');

    tooltipYearHolder
      .text(d => tooltipYearValue)

    if (e.offsetX > width / 2) {
      // tooltipCeremonyTotal.attr('transform', `translate(${-175}, 0)`);
      // tooltipCeremonyBreakdown.attr('transform', `translate(${-175}, 0)`);
      tooltipYearHolder
        .attr('text-anchor', 'end')
        .attr('dx', -20);
      tooltipCeremonyTotal
        .attr('text-anchor', 'end')
        .attr('dx', -20);
      tooltipCeremonyBreakdown
        .attr('text-anchor', 'end')
        .attr('dx', -20);
    } else {
      // tooltipCeremonyTotal.attr('transform', `translate(0, 0)`);
      // tooltipCeremonyBreakdown.attr('transform', `translate(0, 0)`);
      tooltipYearHolder
        .attr('text-anchor', 'start')
        .attr('dx', 20);
      tooltipCeremonyTotal
        .attr('text-anchor', 'start')
        .attr('dx', 0);
      tooltipCeremonyBreakdown
        .attr('text-anchor', 'start')
        .attr('dx', 0);
    }

    // Set the text inside the ceremony breakdown
    d3.select('.ceremony-breakdown-total').text(`${yearlyData.nominees_total} nominees total`);
    d3.select('.ceremony-breakdown-nominees_caucasian').text(`${yearlyData.nominees_caucasian} ${groups.find(group => group.key === 'nominees_caucasian').label}`);
    d3.select('.ceremony-breakdown-nominees_afrodescendant').text(`${yearlyData.nominees_afrodescendant} ${groups.find(group => group.key === 'nominees_afrodescendant').label}`);
    d3.select('.ceremony-breakdown-nominees_hispanic').text(`${yearlyData.nominees_hispanic} ${groups.find(group => group.key === 'nominees_hispanic').label}`);
    d3.select('.ceremony-breakdown-nominees_asian').text(`${yearlyData.nominees_asian} ${groups.find(group => group.key === 'nominees_asian').label}`);
  });
  
  svg.on('mouseleave', e => {
    tooltip
      .transition().duration(900).style('visibility', 'hidden');
  });

  // Add Award Categpry filter
  const selectAward = d3.select('#selectAward');
  selectAward
    .selectAll('option') 
    .data(awards)
    .join('option')
      .attr('value', d => d.id)
      .text(d => d.label);

  selectAward.on('change', () => {
    const selectedAward = selectAward.property('value');
    console.log(selectedAward);

    const dataFiltered = data.filter(d => d.award_id === selectedAward | selectedAward === 'All');
    dataFormatted = formatData(dataFiltered);
    console.log(dataFormatted)

    years = stack(dataFormatted);

    // Update the domain of scaleY
    yScale.domain([0, d3.max(dataFormatted, d => d.nominees_total)]);
    // Update the y-axis
    yAxis
      .transition()
      .duration(700)
      .call(axisLeft);

    // Update the visualization
    steamPaths
      .data(years)
      .transition() // The transition will affect every attribute and/or style that is set after it. In this case the fill and d attributes.
      .duration(700)
        .attr('d', area);

  });

  // Add Award Categpry filter
  // Initialize the date slider
  const firstYear = d3.min(data, d => d.year);
  const lastYear = d3.max(data, d => d.year);
  const yearsRange = d3.range(+firstYear, +lastYear + 0.5); // Convert to numbers and hanle non-inclusive upper bound

  const yearsSlider = new rSlider({
    target: '#yearsSlider',
    values: yearsRange,
    range: true,
    tooltip: true,
    scale: true,
    labels: false,
    set: [+firstYear, +lastYear], // Set the initial values here
    onChange: values => {
       // Handle change here
       const selectedYears = [+values.slice(0, values.indexOf(',')), +values.slice(values.indexOf(',') + 1)];
       // Update the domain of scaleY
      xScale.domain(selectedYears);
      // Update the x-axis
      xAxis
        .transition()
        .duration(700)
        .call(axisBottom);

      // Update the visualization
      steamPaths
        .data(years)
        .transition() // The transition will affect every attribute and/or style that is set after it. In this case the fill and d attributes.
        .duration(700)
          .attr('d', area);
      }
 });
};
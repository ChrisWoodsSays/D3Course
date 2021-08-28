const width = 1450;
const height = 1300;
const margin = {top: 100, left: 150};
const innerCircleRadius = 300; // Inner radius of the visualization (where the group arcs are positioned)
const outerCircleRadius = 450; // Outer radius of the visualization (including the flight time lines)

// Load the data here
d3.csv('./data/astronauts_nasa_1959-2017.csv').then(data => {
    data.forEach(d => {
        d.year = +d.year,
        d.space_flight_total_hours = +d.space_flight_total_hours,
        d.space_flights_number_of = +d.space_flights_number_of,
        d.space_walks_number_of = +d.space_walks_number_of,
        d.space_walks_total_hours = +d.space_walks_total_hours
      });
    console.log(data);

    const groups = getGroups(data);
    console.log(groups);
    createViz(data, groups);
    // console.log(awards)
    // const dataFormatted = formatData(data);
    // createViz(data, awards, dataFormatted);
  });

  // Create Visualization
createViz = (data, groups) => {
    const vizDiv = d3.select('#viz');
    svg = vizDiv
        .append('svg')
            .attr('viewbox', [0, 0, width, height])
            .attr('width', width)
            .attr('height', height);
    
    // Create wrapper groups for each group of astronauts
    const groupWrappers =  svg
        .selectAll('g')
        .data(groups)
        .join('g')
            .attr('class', d => d.group_id + '/' + d.group_name)
            .attr('transform', `translate(${outerCircleRadius + margin.left}, ${outerCircleRadius + margin.top})`);

    // Declare arc generator with variables that won't change
    const arcThickness = 5;
    const arcCornerRadius = arcThickness // Radius of each corner of an arc (in pixels)
    const arcPadding = 0.5; // Padding between each group, in radians. his distance is subtracted equally from the start and end of the arc.
    const arcGenerator = d3.arc()
        .innerRadius(innerCircleRadius - arcThickness)
        .outerRadius(innerCircleRadius)
        .cornerRadius(arcCornerRadius)
        .padAngle(degreesToRadians(arcPadding));

    // Append the arcs
    const anglePerAstronaut = 360 / data.length;

    let currentAngle = 0;

    groupWrappers
        .append('path')
        .attr('id', d => `arc-${d.group_id}`) // note data is already in wrapper groups
        .attr('class', 'arc')

        .attr('d', d => {
            const arcLength = d.astronauts.length * anglePerAstronaut;
            //console.log(d);
            const startAngle = currentAngle;
            const endAngle = currentAngle + arcLength;
            currentAngle += arcLength;
    
            // Store these values in d to avoid recalculating them for the interactions
            d['startAngle'] = startAngle;
            d['endAngle'] = endAngle;
            d['arcPath'] = arcGenerator({
                startAngle: degreesToRadians(startAngle),
                endAngle: degreesToRadians(endAngle)
            });
    
            return d.arcPath;
          })
          .attr('fill', '#6794AD');


    //Create an SVG text element and append a textPath element
    groupWrappers
        .append("text")
            .attr('class', 'group-year')
            .attr('dy', d => { // The vertical shift of the label
                const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                return (midAngle > 90 && midAngle < 270) ? -6 : 20;
            })
            .style("text-anchor","middle") //place the text halfway on the arc
            .style('font-size', '12px')
            .append("textPath") //append a textPath to the text element
                .attr("xlink:href", d => `#arc-${d.group_id}`) //place the ID of the path here
                .attr('startOffset', d => { // Position of the label relative to the arc
                    const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                    return (midAngle > 90 && midAngle < 270) ? '75%' : '25%';
                  })
                .text(d => d.year !== 0 ? d.year : 'Payload specialists');

}

  
  // Get Unique Groups with their list of Astronauts
  const getGroups = (data) => {
    const groups = [];
    data.forEach(datum => {
      // If groups doesn't already contain this group, add an entry
      if (!groups.find(group => group.group_id == datum.group)) {
        const astronauts = data.filter(d => d.group === datum.group);
        const group = {
          group_id: datum.group,
          group_name: datum.group_name,
          year: datum.year,
          astronauts: astronauts};
          groups.push(group); // Add group to groups
      } 
    });
    return groups;
  }
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
            //.attr('viewbox', `0, 0, ${width}, ${height}`)
            .attr('width', width)
            .attr('height', height);
    
    // Create wrapper groups for each group of astronauts
    const groupWrappers =  svg
        .selectAll('g')
        .data(groups)
        .join('g')
            .attr('class', d => d.group_id + '/' + d.group_name)
            .attr('transform', `translate(${outerCircleRadius + margin.left}, ${outerCircleRadius})`);

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


    // Add year labels
    // Create an SVG text element and append a textPath element
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

    // Add Flight Time Lines
    // =====================
    const flightTimeScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.space_flight_total_hours)])
        .range([0, 300]);

    const astronautsGroup = groupWrappers
        .append('g')
            .attr('class', d => `astronauts-group astronauts-group-${d.group_id}`);
    
    // Remove the padding between each group for the space available around the circle then divide by the number of astronauts
    const correctedAnglePerAstronaut = (360 - arcPadding * (groups.length + 1)) / data.length;

    // Append the astronaut flight time lines
    const astronautsFlightTime = astronautsGroup
        .append('g')
            .attr('class', d => `astronauts-flight-time astronauts-flight-time-${d.group_id}`)
        .selectAll('.astronaut-flight-time')
        .data(d => d.astronauts)
        .join('line')
            .attr('class', d => `astronaut-flight-time astronaut-flight-time-${d.id}`)
            .attr('x1', (d, i) => {
                const groupStartAngle = groups.find(group => group.group_id === d.group).startAngle;
                // Store the angle and position of each line to avoid recalculating them for the interactions
                d['angle'] = degreesToRadians(groupStartAngle - arcPadding/2 + (i+1)*correctedAnglePerAstronaut);
                d['lineX1'] = innerCircleRadius * Math.sin(d.angle);
                return d.lineX1;
            })
            .attr('y1', d => {
                d['lineY1'] = -1 * (innerCircleRadius * Math.cos(d.angle)); // Multiply by -1 to take into account the negative direction of the y-coordinate
                return d.lineY1;
            })
            .attr('x2', d => {
                d['lineX2'] = (innerCircleRadius + flightTimeScale(d.space_flight_total_hours)) * Math.sin(d.angle);
                return d.lineX2;
            })
            .attr('y2', d => {
                d['lineY2'] = -1 * ((innerCircleRadius + flightTimeScale(d.space_flight_total_hours)) * Math.cos(d.angle));
                return d.lineY2;
            })
            .attr('stroke', d => d.military_rank.length > 0 ? '#718493' : '#B6D4D0'); // colour based on whether military or not

// Add Spacewalk Time Circles
// ==========================
const spaceWalkTimeScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.space_walks_total_hours)])
    .range([0, Math.PI * Math.pow(20, 2)]);

// Append the astronauts circles, representing the total time in space walk
const astronautsSpaceWalkTime = astronautsGroup
    .append('g')
        .attr('class', d => `astronauts-spacewalk-time astronauts-spacewalk-time-${d.group_id}`)
    .selectAll('.astronaut-spacewalk-time')
    .data(d => d.astronauts) // For simplicity, append a circle for each astronauts, because we'll need the index to calcultate the position
    .join('circle')
        .attr('class', d => `astronaut-spacewalk-time astronaut-spacewalk-time-${d.id}`)
        .attr('cx', d => {
            d['circleCx'] = d.lineX2;
            return d.circleCx;
        })
        .attr('cy', d => {
            d['circleCy'] = d.lineY2;
            return d.circleCy;
        })
        .attr('r', d => {
            d['circleRadius'] = Math.sqrt(spaceWalkTimeScale(d.space_walks_total_hours) / Math.PI);
            return d.circleRadius;
        })
        .attr('fill', d => d.military_rank.length > 0 ? '#718493' : '#B6D4D0')
        .attr('fill-opacity', d => d.military_rank.length > 0 ? 0.3 : 0.45)
        .attr('stroke', 'none');

// Add Death in Service Stars
// ==========================
const fatalMissions = svg
    .append('g')
    .attr('g', 'fatal-missions');

const starDistance = 50;
const starSize = 20;
groups.forEach(group => {
    const astronautsWithFatalMission = group.astronauts.filter(astronaut => astronaut.death_mission !== '');
    const groupHasFatalMission = astronautsWithFatalMission.length > 0 ? true : false;
    if (groupHasFatalMission) {
        fatalMissions
            .append('g')
            .attr('class', d => `group-fatal-missions group-fatal-missions-${group.group_id}`)
            .selectAll('.fatal-mission')
            .data(astronautsWithFatalMission)
            .join('image')
            .attr('class', d => `fatal-mission fatal-mission-astronaut-${d.id}`)
            .attr('xlink:href', d => {
                switch (d.death_mission) {
                    case 'Apollo 1':
                        return 'assets/star_yellow.svg';
                    case 'STS 51-L (Challenger)':
                        return 'assets/star_green.svg';
                    case 'STS-107 (Columbia)':
                        return 'assets/star_red.svg';
                }
            })
            .attr('width', `${starSize}px`)
            .attr('height', `${starSize}px`)
            .attr('transform', d => {
                // Rotate around center, then translate to 12:00 (the operation order in counter-intuitive, need to explain)
                d['starTransform'] = `rotate(${radiansToDegrees(d.angle)}, ${outerCircleRadius + margin.left}, ${outerCircleRadius}) translate(${(outerCircleRadius + margin.left - starSize/2)}, ${(outerCircleRadius - starSize/2) - innerCircleRadius - starDistance})`;
                return d.starTransform;
            })
            .attr('opacity', '0.6');
    }
});

// Add Legend for Total Time in Space
// ==================================
const flightTimeLegend = d3.select('.legend-section.flight-time')
    .append('ul')
    .selectAll('.flight-time-legend-item')
    .data([1000, 5000, 10000])
    .join('li') // create li elements with class, style and data
        .attr('class', 'flight-time-legend-item')
        .style('display', 'flex')
        .style('align-items', 'center');
flightTimeLegend
    .append('span') // add span to each li using its data.  Note we're styling the span rather than using a line
        .attr('class', 'flight-time-line')
        .style('width', d => `${flightTimeScale(d)}px`)
        .style('height', '1px')
        .style('background-color', '#90BBBD');
flightTimeLegend
    .append('span') // add span to each li using its data
        .attr('class', 'flight-time-label')
        .style('margin-left', '10px')
        .text(d => `${d.toLocaleString()}h`); // Use locale to add comma thousand separators

// Add Legend Total Space Walk Time
// ================================
const spaceWalkTimeLegend = d3.select('.legend-section.time-in-spacewalk')
    .append('ul')
    .selectAll('.flight-time-legend-item')
    .data([20, 40, 60])
    .join('li') // create li elements with class, style and data
        .attr('class', 'flight-time-legend-item')
        .style('display', 'flex')
        .style('align-items', 'center');
spaceWalkTimeLegend
    .append('span') // Note we're styling the span rather than using a d3 circle
        .attr('class', 'space-walk-time-circle')
        .style('width', d => `${2 * Math.sqrt(spaceWalkTimeScale(d) / Math.PI)}px`)
        .style('height', d => `${2 * Math.sqrt(spaceWalkTimeScale(d) / Math.PI)}px`)
        .style('margin-left', d => `${30 - Math.sqrt(spaceWalkTimeScale(d) / Math.PI)}px`) // adjust left margin so that circles still line up in there centres
        .style('background-color', '#718493')
        .style('opacity', 0.3)
        .style('border-radius', '50%');
spaceWalkTimeLegend
    .append('span') // add span to each li using its data
        .attr('class', 'space-walk-time-label')
        .style('margin-left', d => `${30 - Math.sqrt(spaceWalkTimeScale(d) / Math.PI)}px`) // adjust left margin so that labels (which follow circles) still line up
        .text(d => `${d}h`);

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
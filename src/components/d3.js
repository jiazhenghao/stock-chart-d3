/* eslint-disable indent */
import * as d3 from 'd3'
import prices from '@/mock'
import timeConverter from '@/utils/timeConverter'

export default function drawChart(svgWidth = 1024, svgHeight = 625) {
  d3.select('#container').selectAll('g').remove()

  // define the box model for the whole SVG
  const margin = { top: 25, right: 65, bottom: 205, left: 50 }

  const w = svgWidth - margin.left - margin.right
  const h = svgHeight - margin.top - margin.bottom

  // setup svg
  const svg = d3
    .select('#container')
    .attr('width', w + margin.left + margin.right)
    .attr('height', h + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  // add a rect
  svg
    .append('rect')
    .attr('id', 'rect')
    .attr('width', w)
    .attr('height', h)
    .style('fill', 'none')
    .style('pointer-events', 'all')
    .attr('clip-path', 'url(#clip)')

  // xmin, xmax is used to define the start & end of x-axis, especially for zooming
  let xmin = d3.min(prices.map(r => r.Timestamp * 1000))
  let xmax = d3.max(prices.map(r => r.Timestamp * 1000))

  // convert unix timestamp to display Text on X-axis
  for (let i = 0; i < prices.length; i++) {
    if (typeof prices[i].Timestamp === 'number') {
      prices[i].Timestamp = timeConverter(prices[i].Timestamp)
    }
  }

  const dates = prices.map(item => item.Timestamp)

  // define x-axis data and band
  const xScale = d3.scaleLinear().domain([-1, dates.length]).range([0, w])
  const xDateScale = d3.scaleQuantize().domain([0, dates.length]).range(dates)
  const xBand = d3
    .scaleBand()
    .domain(d3.range(-1, dates.length))
    .range([0, w])
    .padding(0.3)
  const xAxis = d3
    .axisBottom()
    .scale(xScale)
    .tickFormat(d => dates[d])

  // draw X axis
  const gX = svg
    .append('g')
    .attr('class', 'axis x-axis') // Assign "axis" class
    .attr('transform', 'translate(0,' + h + ')')
    .call(xAxis)

  gX.selectAll('.tick text').call(wrap, xBand.bandwidth())

  // define y-axis data and scale
  const ymin = d3.min(prices.map(r => r.Low))
  const ymax = d3.max(prices.map(r => r.High))
  const yScale = d3.scaleLinear().domain([ymin, ymax]).range([h, 0]) // .nice()
  const yAxis = d3.axisRight().scale(yScale).tickPadding(8)

  // draw Y axis
  const gY = svg
    .append('g')
    .attr('class', 'axis y-axis')
    .attr('transform', `translate(${w}, 0)`)
    .call(yAxis)

  // draw chart
  const chartBody = svg
    .append('g')
    .attr('class', 'chartBody')
    .attr('clip-path', 'url(#clip)')

  // draw bar start data is from Volumn, do not know if it is right
  const x = d3
    .scaleBand()
    .domain(prices.map(d => d.Timestamp))
    .range([0, w])
    .padding(0.1)

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(prices, d => d.Volume)])
    .nice()
    .range([h, margin.top])

  const bars = svg
    .append('g')
    .attr('class', 'bars')
    .selectAll('rect')
    .data(prices)
    .join('rect')
    .attr('x', d => x(d.Timestamp))
    .attr('y', d => y(d.Volume))
    .attr('height', d => y(0) - y(d.Volume))
    .attr('width', xBand.bandwidth())
    .attr('fill', d =>
      d.Open === d.Close ? 'grey' : d.Open > d.Close ? 'red' : 'green'
    )

  // draw candle rectangles
  const candles = chartBody
    .selectAll('.candle')
    .data(prices)
    .enter()
    .append('rect')
    .attr('x', (d, i) => xScale(i) - xBand.bandwidth())
    .attr('class', 'candle')
    .attr('y', d => yScale(Math.max(d.Open, d.Close)))
    .attr('width', xBand.bandwidth())
    .attr('height', d =>
      d.Open === d.Close
        ? 1
        : yScale(Math.min(d.Open, d.Close)) - yScale(Math.max(d.Open, d.Close))
    )
    .attr('fill', d =>
      d.Open === d.Close ? 'grey' : d.Open > d.Close ? 'red' : 'green'
    )

  //  draw high and low
  const stems = chartBody
    .selectAll('g.line')
    .data(prices)
    .enter()
    .append('line')
    .attr('class', 'stem')
    .attr('x1', (d, i) => xScale(i) - xBand.bandwidth() / 2)
    .attr('x2', (d, i) => xScale(i) - xBand.bandwidth() / 2)
    .attr('y1', d => yScale(d.High))
    .attr('y2', d => yScale(d.Low))
    .attr('stroke', d =>
      d.Open === d.Close ? 'grey' : d.Open > d.Close ? 'red' : 'green'
    )

  // add defs
  svg
    .append('defs')
    .append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', w)
    .attr('height', h)

  const extent = [
    [0, 0],
    [w, h]
  ]

  // timer
  let resizeTimer
  // define zoom behavior
  const zoom = d3
    .zoom()
    .scaleExtent([1, 100])
    .translateExtent(extent)
    .extent(extent)
    .on('zoom', zoomFunction)
    .on('end', zoomEndFunction)

  svg.call(zoom)

  function zoomFunction() {
    const t = d3.event.transform
    const xScaleZ = t.rescaleX(xScale)

    // re-define x-axis
    gX.call(
      d3.axisBottom(xScaleZ).tickFormat(d => {
        if (d >= 0 && d <= dates.length - 1) {
          return dates[d]
        }
      })
    )

    // re-define candles, stems, bars
    candles
      .attr('x', (d, i) => xScaleZ(i) - (xBand.bandwidth() * t.k) / 2)
      .attr('width', xBand.bandwidth() * t.k)

    stems
      .attr(
        'x1',
        (d, i) => xScaleZ(i) - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5
      )
      .attr(
        'x2',
        (d, i) => xScaleZ(i) - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5
      )

    bars
      .attr('x', (d, i) => xScaleZ(i) - (xBand.bandwidth() * t.k) / 2)
      .attr('width', xBand.bandwidth() * t.k)

    // hide the ticks without a label
    d3.selectAll('.xAxis .tick text').each(() => {
      if (this.innerHTML === '') {
        this.parentNode.style.display = 'none'
      }
    })

    // redraw x-axis
    gX.selectAll('.tick text').call(wrap, xBand.bandwidth())
  }

  function zoomEndFunction() {
    const t = d3.event.transform
    const xScaleZ = t.rescaleX(xScale)

    clearTimeout(resizeTimer)

    resizeTimer = setTimeout(() => {
      // find the min and max of x-axis
      xmin = new Date(xDateScale(Math.floor(xScaleZ.domain()[0])))
      xmax = new Date(xDateScale(Math.floor(xScaleZ.domain()[1])))

      // find the data that falls between xmin and xmax
      const filtered = prices.filter(
        d =>
          new Date(d.Timestamp).getTime() <= new Date(xmin).getTime() &&
          new Date(d.Timestamp).getTime() >= new Date(xmax).getTime()
      )

      // re-define y-axis domain
      const minP = d3.min(filtered, d => d.Low)
      const maxP = d3.max(filtered, d => d.High)
      const buffer = Math.floor((maxP - minP) * 0.1)
      yScale.domain([minP - buffer, maxP + buffer])

      // redraw candle with animation
      candles
        .transition()
        .duration(400)
        .attr('y', d => yScale(Math.max(d.Open, d.Close)))
        .attr('height', d =>
          d.Open === d.Close
            ? 1
            : yScale(Math.min(d.Open, d.Close)) -
              yScale(Math.max(d.Open, d.Close))
        )
      // redraw bar with animation
      bars
        .transition()
        .duration(400)
        .attr('fill', d => {
          if (
            new Date(d.Timestamp).getTime() >= new Date(xmin).getTime() ||
            new Date(d.Timestamp).getTime() < new Date(xmax).getTime()
          ) {
            return '#eee'
          }
          return d.Open === d.Close
            ? 'grey'
            : d.Open > d.Close
            ? 'red'
            : 'green'
        })
        .style('opacity', 0.25)

      // redraw stem with animation
      stems
        .transition()
        .duration(400)
        .attr('y1', d => yScale(d.High))
        .attr('y2', d => yScale(d.Low))

      // redraw Y-axis with animation
      gY.transition()
        .duration(400)
        .call(d3.axisLeft().scale(yScale).tickPadding(-8))
    }, 20)
  }
}

// dealing with text in X-axis
function wrap(text, width) {
  text.each(function () {
    const textNode = d3.select(this)
    const words = textNode.text().split(/\s+/).reverse()
    let word
    let line = []
    let lineNumber = 0
    const lineHeight = 1.1
    const y = textNode.attr('y')
    const dy = parseFloat(textNode.attr('dy'))
    let tspan = textNode
      .text(null)
      .append('tspan')
      .attr('x', 0)
      .attr('y', y)
      .attr('dy', dy + 'em')
    while ((word = words.pop())) {
      line.push(word)
      tspan.text(line.join(' '))
      if (tspan.node().getComputedTextLength() > width) {
        line.pop()
        tspan.text(line.join(' '))
        line = [word]
        tspan = textNode
          .append('tspan')
          .attr('x', 0)
          .attr('y', y)
          .attr('dy', ++lineNumber * lineHeight + dy + 'em')
          .text(word)
      }
    }
  })
}

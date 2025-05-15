import { formatXPValue } from "./utils.js";
import { processXPProgressionData } from "./utils.js";

// Create SVG line chart for XP progression
function createXPLineChart(labels, data) {
    const container = document.getElementById("xp-chart-container")
    container.innerHTML = "" // Clear previous content

    const width = container.clientWidth
    const height = container.clientHeight
    const padding = { top: 40, right: 40, bottom: 60, left: 80 }

    // Calculate chart dimensions
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Find min and max values for scaling
    const maxY = Math.max(...data)

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", width)
    svg.setAttribute("height", height)
    svg.setAttribute("class", "xp-chart")
    svg.setAttribute("id", "xpChart")

    // Create group for the chart content with padding
    const chartGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    chartGroup.setAttribute("transform", `translate(${padding.left}, ${padding.top})`)

    // Add grid lines
    const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    gridGroup.setAttribute("class", "grid-lines")

    // Horizontal grid lines
    const yTickCount = 5
    for (let i = 0; i <= yTickCount; i++) {
        const y = chartHeight - (i / yTickCount) * chartHeight
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
        gridLine.setAttribute("x1", 0)
        gridLine.setAttribute("y1", y)
        gridLine.setAttribute("x2", chartWidth)
        gridLine.setAttribute("y2", y)
        gridLine.setAttribute("stroke", "rgba(255, 255, 255, 0.1)")
        gridLine.setAttribute("stroke-width", "1")
        gridLine.setAttribute("stroke-dasharray", "5,5")
        gridGroup.appendChild(gridLine)

        // Y-axis labels
        const yValue = (i / yTickCount) * maxY
        const yLabel = document.createElementNS("http://www.w3.org/2000/svg", "text")
        yLabel.setAttribute("x", -10)
        yLabel.setAttribute("y", y + 5)
        yLabel.setAttribute("text-anchor", "end")
        yLabel.setAttribute("fill", "#e0e0e0")
        yLabel.setAttribute("font-size", "12px")
        yLabel.textContent = formatXPValue(yValue)
        chartGroup.appendChild(yLabel)
    }

    // X and Y axes
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line")
    xAxis.setAttribute("x1", 0)
    xAxis.setAttribute("y1", chartHeight)
    xAxis.setAttribute("x2", chartWidth)
    xAxis.setAttribute("y2", chartHeight)
    xAxis.setAttribute("stroke", "#e0e0e0")
    xAxis.setAttribute("stroke-width", "1")

    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line")
    yAxis.setAttribute("x1", 0)
    yAxis.setAttribute("y1", 0)
    yAxis.setAttribute("x2", 0)
    yAxis.setAttribute("y2", chartHeight)
    yAxis.setAttribute("stroke", "#e0e0e0")
    yAxis.setAttribute("stroke-width", "1")

    // X-axis labels
    const xLabelsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    xLabelsGroup.setAttribute("class", "x-labels")

    // Show a subset of labels to avoid overcrowding
    const labelStep = Math.max(1, Math.floor(labels.length / 10))

    labels.forEach((label, i) => {
        if (i % labelStep === 0 || i === labels.length - 1) {
            const x = (i / (labels.length - 1)) * chartWidth

            // X tick
            const tick = document.createElementNS("http://www.w3.org/2000/svg", "line")
            tick.setAttribute("x1", x)
            tick.setAttribute("y1", chartHeight)
            tick.setAttribute("x2", x)
            tick.setAttribute("y2", chartHeight + 5)
            tick.setAttribute("stroke", "#e0e0e0")
            tick.setAttribute("stroke-width", "1")
            xLabelsGroup.appendChild(tick)

            // X label
            const xLabel = document.createElementNS("http://www.w3.org/2000/svg", "text")
            xLabel.setAttribute("x", x)
            xLabel.setAttribute("y", chartHeight + 20)
            xLabel.setAttribute("text-anchor", "middle")
            xLabel.setAttribute("fill", "#e0e0e0")
            xLabel.setAttribute("font-size", "12px")
            xLabel.setAttribute("transform", `rotate(45, ${x}, ${chartHeight + 20})`)
            xLabel.textContent = label
            xLabelsGroup.appendChild(xLabel)
        }
    })

    // Create the line path
    const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    let pathD = ""

    data.forEach((value, i) => {
        const x = (i / (data.length - 1)) * chartWidth
        const y = chartHeight - (value / maxY) * chartHeight

        if (i === 0) {
            pathD += `M ${x} ${y}`
        } else {
            pathD += ` L ${x} ${y}`
        }
    })

    linePath.setAttribute("d", pathD)
    linePath.setAttribute("fill", "none")
    linePath.setAttribute("stroke", "#00f5ff")
    linePath.setAttribute("stroke-width", "3")
    linePath.setAttribute("stroke-linecap", "round")
    linePath.setAttribute("stroke-linejoin", "round")

    // Create area under the line
    const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    const areaD = pathD + ` L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`

    areaPath.setAttribute("d", areaD)
    areaPath.setAttribute("fill", "url(#xpGradient)")
    areaPath.setAttribute("opacity", "0.3")

    // Create gradient for area fill
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")
    gradient.setAttribute("id", "xpGradient")
    gradient.setAttribute("x1", "0%")
    gradient.setAttribute("y1", "0%")
    gradient.setAttribute("x2", "0%")
    gradient.setAttribute("y2", "100%")

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    stop1.setAttribute("offset", "0%")
    stop1.setAttribute("stop-color", "#00f5ff")

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    stop2.setAttribute("offset", "100%")
    stop2.setAttribute("stop-color", "#8a2be2")

    gradient.appendChild(stop1)
    gradient.appendChild(stop2)
    defs.appendChild(gradient)

    // Add data points
    const pointsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    pointsGroup.setAttribute("class", "data-points")

    data.forEach((value, i) => {
        const x = (i / (data.length - 1)) * chartWidth
        const y = chartHeight - (value / maxY) * chartHeight

        const point = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        point.setAttribute("cx", x)
        point.setAttribute("cy", y)
        point.setAttribute("r", "4")
        point.setAttribute("fill", "#8a2be2")
        point.setAttribute("stroke", "#fff")
        point.setAttribute("stroke-width", "2")

        // Add tooltip functionality
        point.addEventListener("mouseover", () => {
            const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "g")
            tooltip.setAttribute("id", `tooltip-${i}`)
            tooltip.setAttribute("class", "tooltip")

            const tooltipBg = document.createElementNS("http://www.w3.org/2000/svg", "rect")
            tooltipBg.setAttribute("x", x - 60)
            tooltipBg.setAttribute("y", y )
            tooltipBg.setAttribute("width", "120")
            tooltipBg.setAttribute("height", "30")
            tooltipBg.setAttribute("rx", "5")
            tooltipBg.setAttribute("fill", "#333")

            const tooltipText = document.createElementNS("http://www.w3.org/2000/svg", "text")
            tooltipText.setAttribute("x", x)
            tooltipText.setAttribute("y", y + 20)
            tooltipText.setAttribute("text-anchor", "middle")
            tooltipText.setAttribute("fill", "white")
            tooltipText.textContent = `${labels[i]}: ${formatXPValue(value)}`

            tooltip.appendChild(tooltipBg)
            tooltip.appendChild(tooltipText)
            svg.appendChild(tooltip)

            // Enlarge point on hover
            point.setAttribute("r", "6")
        })

        point.addEventListener("mouseout", () => {
            const tooltip = document.getElementById(`tooltip-${i}`)
            if (tooltip) {
                tooltip.remove()
            }

            // Restore point size
            point.setAttribute("r", "4")
        })

        pointsGroup.appendChild(point)
    })

    // Add axis titles
    const xAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text")
    xAxisTitle.setAttribute("x", chartWidth / 2)
    xAxisTitle.setAttribute("y", chartHeight + 50)
    xAxisTitle.setAttribute("text-anchor", "middle")
    xAxisTitle.setAttribute("fill", "#00f5ff")
    xAxisTitle.setAttribute("font-size", "14px")
    xAxisTitle.textContent = "Date"
    xAxisTitle.setAttribute("class", "axis-title")

    const yAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text")
    yAxisTitle.setAttribute("transform", `rotate(-90, ${-60}, ${chartHeight / 2})`)
    yAxisTitle.setAttribute("x", -60)
    yAxisTitle.setAttribute("y", chartHeight / 2)
    yAxisTitle.setAttribute("text-anchor", "middle")
    yAxisTitle.setAttribute("fill", "#00f5ff")
    yAxisTitle.setAttribute("font-size", "14px")
    yAxisTitle.textContent = "XP Points"
    xAxisTitle.setAttribute("class", "axis-title")

    // Add legend
    const legendGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    legendGroup.setAttribute("transform", `translate(${chartWidth - 100}, 0)`)

    const legendRect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    legendRect.setAttribute("x", 0)
    legendRect.setAttribute("y", 0)
    legendRect.setAttribute("width", "12")
    legendRect.setAttribute("height", "12")
    legendRect.setAttribute("fill", "#00f5ff")

    const legendText = document.createElementNS("http://www.w3.org/2000/svg", "text")
    legendText.setAttribute("x", "20")
    legendText.setAttribute("y", "10")
    legendText.setAttribute("fill", "#00f5ff")
    legendText.setAttribute("font-size", "12px")
    legendText.textContent = "XP"

    legendGroup.appendChild(legendRect)
    legendGroup.appendChild(legendText)

    // Assemble the chart
    svg.appendChild(defs)
    chartGroup.appendChild(gridGroup)
    chartGroup.appendChild(xAxis)
    chartGroup.appendChild(yAxis)
    chartGroup.appendChild(xLabelsGroup)
    chartGroup.appendChild(areaPath)
    chartGroup.appendChild(linePath)
    chartGroup.appendChild(pointsGroup)
    chartGroup.appendChild(xAxisTitle)
    chartGroup.appendChild(yAxisTitle)
    chartGroup.appendChild(legendGroup)
    svg.appendChild(chartGroup)

    container.appendChild(svg)
}

// Create SVG radar chart for skills
function createSkillsRadarChart(labels, data) {
    const container = document.getElementById("skills-chart-container")
    container.innerHTML = "" // Clear previous content

    const width = container.clientWidth
    const height = container.clientHeight
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2.5

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", width)
    svg.setAttribute("height", height)
    svg.setAttribute("class", "skills-chart")
    svg.setAttribute("id", "skillsChart")

    // Find max value for scaling
    const maxValue = Math.max(...data)
    const scaleFactor = radius / maxValue

    // Create defs for gradient
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")

    // Create gradient for area fill
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")
    gradient.setAttribute("id", "skillsGradient")
    gradient.setAttribute("x1", "0%")
    gradient.setAttribute("y1", "0%")
    gradient.setAttribute("x2", "100%")
    gradient.setAttribute("y2", "100%")

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    stop1.setAttribute("offset", "0%")
    stop1.setAttribute("stop-color", "#00f5ff")
    stop1.setAttribute("stop-opacity", "0.7")

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    stop2.setAttribute("offset", "100%")
    stop2.setAttribute("stop-color", "#8a2be2")
    stop2.setAttribute("stop-opacity", "0.7")

    gradient.appendChild(stop1)
    gradient.appendChild(stop2)
    defs.appendChild(gradient)

    // Create group for the chart content
    const chartGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    chartGroup.setAttribute("transform", `translate(${centerX}, ${centerY})`)

    // Draw radar grid lines
    const gridLevels = 5
    const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    gridGroup.setAttribute("class", "grid-lines")

    for (let level = 1; level <= gridLevels; level++) {
        const gridRadius = (radius / gridLevels) * level
        const gridPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
        let gridPoints = ""

        for (let i = 0; i < labels.length; i++) {
            const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2
            const x = gridRadius * Math.cos(angle)
            const y = gridRadius * Math.sin(angle)
            gridPoints += `${x},${y} `
        }

        gridPolygon.setAttribute("points", gridPoints)
        gridPolygon.setAttribute("fill", "none")
        gridPolygon.setAttribute("stroke", "rgba(255, 255, 255, 0.1)")
        gridPolygon.setAttribute("stroke-width", "1")

        gridGroup.appendChild(gridPolygon)
    }

    // Draw axis lines
    const axisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    axisGroup.setAttribute("class", "axis-lines")

    for (let i = 0; i < labels.length; i++) {
        const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2
        const x = radius * Math.cos(angle)
        const y = radius * Math.sin(angle)

        const axisLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
        axisLine.setAttribute("x1", 0)
        axisLine.setAttribute("y1", 0)
        axisLine.setAttribute("x2", x)
        axisLine.setAttribute("y2", y)
        axisLine.setAttribute("stroke", "rgba(255, 255, 255, 0.2)")
        axisLine.setAttribute("stroke-width", "1")

        axisGroup.appendChild(axisLine)

        // Add axis labels
        const labelDistance = radius * 1.15
        const labelX = labelDistance * Math.cos(angle)
        const labelY = labelDistance * Math.sin(angle)

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text")
        label.setAttribute("x", labelX)
        label.setAttribute("y", labelY)
        label.setAttribute("text-anchor", "middle")
        label.setAttribute("dominant-baseline", "middle")
        label.setAttribute("fill", "#e0e0e0")
        label.setAttribute("font-size", "10px")
        label.textContent = labels[i]

        axisGroup.appendChild(label)
    }

    // Create data polygon
    const dataPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
    let dataPoints = ""

    for (let i = 0; i < data.length; i++) {
        const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2
        const value = data[i] * scaleFactor
        const x = value * Math.cos(angle)
        const y = value * Math.sin(angle)
        dataPoints += `${x},${y} `
    }

    dataPolygon.setAttribute("points", dataPoints)
    dataPolygon.setAttribute("fill", "url(#skillsGradient)")
    dataPolygon.setAttribute("stroke", "#00f5ff")
    dataPolygon.setAttribute("stroke-width", "2")

    // Add data points
    const pointsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    pointsGroup.setAttribute("class", "data-points")

    for (let i = 0; i < data.length; i++) {
        const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2
        const value = data[i] * scaleFactor
        const x = value * Math.cos(angle)
        const y = value * Math.sin(angle)

        const point = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        point.setAttribute("cx", x)
        point.setAttribute("cy", y)
        point.setAttribute("r", "4")
        point.setAttribute("fill", "#8a2be2")
        point.setAttribute("stroke", "#fff")
        point.setAttribute("stroke-width", "2")

        // Add tooltip functionality
        point.addEventListener("mouseover", () => {
            const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "g")
            tooltip.setAttribute("id", `skill-tooltip-${i}`)
            tooltip.setAttribute("class", "tooltip")

            const tooltipBg = document.createElementNS("http://www.w3.org/2000/svg", "rect")
            tooltipBg.setAttribute("x", x - 60)
            tooltipBg.setAttribute("y", y - 40)
            tooltipBg.setAttribute("width", "120")
            tooltipBg.setAttribute("height", "30")
            tooltipBg.setAttribute("rx", "5")
            tooltipBg.setAttribute("fill", "#333")

            const tooltipText = document.createElementNS("http://www.w3.org/2000/svg", "text")
            tooltipText.setAttribute("x", x)
            tooltipText.setAttribute("y", y - 20)
            tooltipText.setAttribute("text-anchor", "middle")
            tooltipText.setAttribute("fill", "white")
            tooltipText.textContent = `${labels[i]}: ${data[i]}`

            tooltip.appendChild(tooltipBg)
            tooltip.appendChild(tooltipText)
            chartGroup.appendChild(tooltip)

            // Enlarge point on hover
            point.setAttribute("r", "6")
        })

        point.addEventListener("mouseout", () => {
            const tooltip = document.getElementById(`skill-tooltip-${i}`)
            if (tooltip) {
                tooltip.remove()
            }

            // Restore point size
            point.setAttribute("r", "4")
        })

        pointsGroup.appendChild(point)
    }

    // Assemble the chart
    svg.appendChild(defs)
    chartGroup.appendChild(gridGroup)
    chartGroup.appendChild(axisGroup)
    chartGroup.appendChild(dataPolygon)
    chartGroup.appendChild(pointsGroup)
    svg.appendChild(chartGroup)

    container.appendChild(svg)
}

// Create SVG doughnut chart for audit ratio
function createAuditDoughnutChart(done, received) {
    const container = document.getElementById("audit-chart-container")
    container.innerHTML = "" // Clear previous content

    const width = container.clientWidth
    const height = container.clientHeight
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 3
    const innerRadius = radius * 0.7 // For doughnut hole

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", "100%")
    svg.setAttribute("height", "100%")
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`)
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet")
    svg.setAttribute("class", "audit-chart")
    svg.setAttribute("id", "auditChart")

    // Create defs for gradients
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")

    // Create gradient for "done" slice
    const doneGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")
    doneGradient.setAttribute("id", "doneGradient")
    doneGradient.setAttribute("x1", "0%")
    doneGradient.setAttribute("y1", "0%")
    doneGradient.setAttribute("x2", "100%")
    doneGradient.setAttribute("y2", "100%")

    const doneStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    doneStop1.setAttribute("offset", "0%")
    doneStop1.setAttribute("stop-color", "#00f5ff")

    const doneStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    doneStop2.setAttribute("offset", "100%")
    doneStop2.setAttribute("stop-color", "#00c8ff")

    doneGradient.appendChild(doneStop1)
    doneGradient.appendChild(doneStop2)
    defs.appendChild(doneGradient)

    // Create gradient for "received" slice
    const receivedGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")
    receivedGradient.setAttribute("id", "receivedGradient")
    receivedGradient.setAttribute("x1", "0%")
    receivedGradient.setAttribute("y1", "0%")
    receivedGradient.setAttribute("x2", "100%")
    receivedGradient.setAttribute("y2", "100%")

    const receivedStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    receivedStop1.setAttribute("offset", "0%")
    receivedStop1.setAttribute("stop-color", "#8a2be2")

    const receivedStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    receivedStop2.setAttribute("offset", "100%")
    receivedStop2.setAttribute("stop-color", "#9932cc")

    receivedGradient.appendChild(receivedStop1)
    receivedGradient.appendChild(receivedStop2)
    defs.appendChild(receivedGradient)

    // Create group for the chart content
    const chartGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    chartGroup.setAttribute("transform", `translate(${centerX}, ${centerY})`)

    // Calculate angles for pie slices
    const total = done + received
    const doneRatio = done / total
    const receivedRatio = received / total
    const auditRatio = (done / received).toFixed(1)

    const doneAngle = doneRatio * Math.PI * 2
    const receivedAngle = receivedRatio * Math.PI * 2

    // Create pie slices
    // Done slice
    if (doneRatio > 0) {
        const doneSlice = createDonutSlice(0, doneAngle, radius, innerRadius, "url(#doneGradient)")

        // Add hover effect and tooltip for done slice
        doneSlice.addEventListener("mouseover", (e) => {
            doneSlice.setAttribute("stroke", "#ffffff")
            doneSlice.setAttribute("stroke-width", "2")

            // Create tooltip
            showTooltip(e, `DONE: ${done} (${Math.round(doneRatio * 100)}%)`, centerX, centerY - radius)
        })

        doneSlice.addEventListener("mouseout", () => {
            doneSlice.setAttribute("stroke", "none")
            hideTooltip()
        })

        doneSlice.addEventListener("mousemove", (e) => {
            moveTooltip(e)
        })

        chartGroup.appendChild(doneSlice)
    }

    // Received slice
    if (receivedRatio > 0) {
        const receivedSlice = createDonutSlice(
            doneAngle,
            doneAngle + receivedAngle,
            radius,
            innerRadius,
            "url(#receivedGradient)",
        )

        // Add hover effect and tooltip for received slice
        receivedSlice.addEventListener("mouseover", (e) => {
            receivedSlice.setAttribute("stroke", "#ffffff")
            receivedSlice.setAttribute("stroke-width", "2")

            // Create tooltip
            showTooltip(e, `RECEIVED: ${received} (${Math.round(receivedRatio * 100)}%)`, centerX, centerY + radius)
        })

        receivedSlice.addEventListener("mouseout", () => {
            receivedSlice.setAttribute("stroke", "none")
            hideTooltip()
        })

        receivedSlice.addEventListener("mousemove", (e) => {
            moveTooltip(e)
        })

        chartGroup.appendChild(receivedSlice)
    }

    // Add center text showing the ratio
    const centerText = document.createElementNS("http://www.w3.org/2000/svg", "text")
    centerText.setAttribute("x", 0)
    centerText.setAttribute("y", -20)
    centerText.setAttribute("text-anchor", "middle")
    centerText.setAttribute("dominant-baseline", "middle")
    centerText.setAttribute("fill", "#00f5ff")
    centerText.setAttribute("font-size", "16px")
    centerText.setAttribute("font-weight", "bold")
    centerText.textContent = auditRatio

    const centerSubText = document.createElementNS("http://www.w3.org/2000/svg", "text")
    centerSubText.setAttribute("x", 0)
    centerSubText.setAttribute("y", 0)
    centerSubText.setAttribute("text-anchor", "middle")
    centerSubText.setAttribute("dominant-baseline", "middle")
    centerSubText.setAttribute("fill", "#a0aec0")
    centerSubText.setAttribute("font-size", "12px")
    centerSubText.textContent = "Done/Received"

    // Add legend
    const legendGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    legendGroup.setAttribute("transform", `translate(0, ${radius + 20})`)
    legendGroup.setAttribute("class", "legend-group")

    // Done legend item
    const doneLegendItem = document.createElementNS("http://www.w3.org/2000/svg", "g")
    doneLegendItem.setAttribute("transform", "translate(-60, 0)")

    const doneLegendRect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    doneLegendRect.setAttribute("x", "-45")
    doneLegendRect.setAttribute("y", 0)
    doneLegendRect.setAttribute("width", "12")
    doneLegendRect.setAttribute("height", "12")
    doneLegendRect.setAttribute("fill", "#00f5ff")
    doneLegendRect.setAttribute("rx", "2")

    const doneLegendText = document.createElementNS("http://www.w3.org/2000/svg", "text")
    doneLegendText.setAttribute("x", "-30")
    doneLegendText.setAttribute("y", "10")
    doneLegendText.setAttribute("fill", "#e0e0e0")
    doneLegendText.setAttribute("font-size", "12px")
    doneLegendText.textContent = `DONE (${formatXPValue(done)})`

    doneLegendItem.appendChild(doneLegendRect)
    doneLegendItem.appendChild(doneLegendText)

    // Received legend item
    const receivedLegendItem = document.createElementNS("http://www.w3.org/2000/svg", "g")
    receivedLegendItem.setAttribute("transform", "translate(20, 0)")

    const receivedLegendRect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    receivedLegendRect.setAttribute("x", 0)
    receivedLegendRect.setAttribute("y", 0)
    receivedLegendRect.setAttribute("width", "12")
    receivedLegendRect.setAttribute("height", "12")
    receivedLegendRect.setAttribute("fill", "#8a2be2")
    receivedLegendRect.setAttribute("rx", "2")

    const receivedLegendText = document.createElementNS("http://www.w3.org/2000/svg", "text")
    receivedLegendText.setAttribute("x", "20")
    receivedLegendText.setAttribute("y", "10")
    receivedLegendText.setAttribute("fill", "#00f5ff")
    receivedLegendText.setAttribute("font-size", "12px")
    receivedLegendText.textContent = `RECEIVED (${formatXPValue(received)})`

    receivedLegendItem.appendChild(receivedLegendRect)
    receivedLegendItem.appendChild(receivedLegendText)

    legendGroup.appendChild(doneLegendItem)
    legendGroup.appendChild(receivedLegendItem)

    // Create tooltip element
    const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    tooltipGroup.setAttribute("id", "audit-tooltip")
    tooltipGroup.setAttribute("visibility", "hidden")

    const tooltipBg = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    tooltipBg.setAttribute("rx", "4")
    tooltipBg.setAttribute("ry", "4")
    tooltipBg.setAttribute("fill", "rgba(0, 0, 0, 0.8)")
    tooltipBg.setAttribute("stroke", "#00f5ff")
    tooltipBg.setAttribute("stroke-width", "1")
    tooltipBg.setAttribute("width", "150")
    tooltipBg.setAttribute("height", "30")

    const tooltipText = document.createElementNS("http://www.w3.org/2000/svg", "text")
    tooltipText.setAttribute("fill", "#ffffff")
    tooltipText.setAttribute("font-size", "12px")
    tooltipText.setAttribute("x", "10")
    tooltipText.setAttribute("y", "20")

    tooltipGroup.appendChild(tooltipBg)
    tooltipGroup.appendChild(tooltipText)

    // Assemble the chart
    svg.appendChild(defs)
    chartGroup.appendChild(centerText)
    chartGroup.appendChild(centerSubText)
    chartGroup.appendChild(legendGroup)
    svg.appendChild(chartGroup)
    svg.appendChild(tooltipGroup)

    container.appendChild(svg)

    // Functions to handle tooltips
    function showTooltip(event, content, x, y) {
        const tooltip = document.getElementById("audit-tooltip")
        const tooltipText = tooltip.querySelector("text")

        tooltipText.textContent = content

        // Position tooltip near cursor
        moveTooltip(event)

        // Show tooltip
        tooltip.setAttribute("visibility", "visible")
    }

    function hideTooltip() {
        const tooltip = document.getElementById("audit-tooltip")
        tooltip.setAttribute("visibility", "hidden")
    }

    function moveTooltip(event) {
        const tooltip = document.getElementById("audit-tooltip")
        const rect = container.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        // Position tooltip with offset from cursor
        tooltip.setAttribute("transform", `translate(${mouseX + 10}, ${mouseY - 30})`)
    }
}

// Function to create a doughnut slice
function createDonutSlice(startAngle, endAngle, radius, innerRadius, fill) {
    const startX = Math.cos(startAngle) * radius
    const startY = Math.sin(startAngle) * -radius
    const endX = Math.cos(endAngle) * radius
    const endY = Math.sin(endAngle) * -radius

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0

    const d = [
        "M",
        startX,
        startY,
        "A",
        radius,
        radius,
        0,
        largeArcFlag,
        1,
        endX,
        endY,
        "L",
        Math.cos(endAngle) * innerRadius,
        Math.sin(endAngle) * -innerRadius,
        "A",
        innerRadius,
        innerRadius,
        0,
        largeArcFlag,
        0,
        Math.cos(startAngle) * innerRadius,
        Math.sin(startAngle) * -innerRadius,
        "Z",
    ].join(" ")

    const slice = document.createElementNS("http://www.w3.org/2000/svg", "path")
    slice.setAttribute("d", d)
    slice.setAttribute("fill", fill)
    slice.setAttribute("stroke", "none")
    slice.setAttribute("stroke-width", "1")
    slice.setAttribute("class", "donut-slice")

    return slice
}

// Function to update the chart when time range changes
function updateXPChartTimeRange(months) {
    // Get the original data
    const xpData = window.userData.xpProgression && window.userData.xpProgression.length > 0
        ? window.userData.xpProgression
        : window.userData.transactions;

    if (!xpData || xpData.length === 0) return;

    // If months is 0, show all data
    if (months === 0) {
        const { dateLabels, cumulativeXP } = processXPProgressionData(xpData);
        createXPLineChart(dateLabels, cumulativeXP);
        return;
    }

    // Filter data for the selected time period
    const currentDate = new Date();
    const cutoffDate = new Date();
    cutoffDate.setMonth(currentDate.getMonth() - months);

    const filteredData = xpData.filter(item => new Date(item.createdAt) >= cutoffDate);

    // If no data in the selected range, show a message
    if (filteredData.length === 0) {
        document.getElementById("xp-chart-container").innerHTML =
            '<p class="error-message">No XP data available for the selected time period.</p>';
        return;
    }

    // Process and update the chart
    const { dateLabels, cumulativeXP } = processXPProgressionData(filteredData);
    createXPLineChart(dateLabels, cumulativeXP);
}

export {
    createXPLineChart,
    createSkillsRadarChart,
    createAuditDoughnutChart,
    createDonutSlice,
    updateXPChartTimeRange
};
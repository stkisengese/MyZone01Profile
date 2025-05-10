// API Endpoints
const API_URL = 'https://learn.zone01kisumu.ke';
const AUTH_URL = `${API_URL}/api/auth/signin`;
const GRAPHQL_URL = `${API_URL}/api/graphql-engine/v1/graphql`;

// App state
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// DOM Elements and Routing
const app = document.getElementById('app');

// Initialize the application
function init() {
    // Check if user is logged in
    if (authToken) {
        renderProfile();
    } else {
        renderLogin();
    }
}

// Login page render
function renderLogin() {
    app.innerHTML = `
    <div class="login-container">
      <h1>Login to Your Profile</h1>
      <div id="login-error" class="error-message"></div>
      <form id="login-form">
        <div class="form-group">
          <label for="username">Username or Email</label>
          <input type="text" id="username" name="username" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required>
        </div>
        <button type="submit" class="btn btn-primary">Login</button>
      </form>
    </div>
  `;

    // Add event listener to form submission
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');

    try {
        errorElement.textContent = "";

        // Create Base64 encoded credentials
        const credentials = btoa(`${username}:${password}`);

        // Make request to auth endpoint
        const response = await fetch(AUTH_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        // Extract the JWT token
        const token = await response.json();

        // Store token in localStorage
        localStorage.setItem('authToken', token);
        authToken = token;

        // Decode JWT to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUser = {
            id: payload.sub,  // Subject claim contains user ID
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Fetch additional user data
        await fetchUserData();

        // Render profile page
        renderProfile();

    } catch (error) {
        console.error('Login failed:', error);
        errorElement.textContent = 'Login failed: ' + error.message;
    }
}

// Fetch user data from GraphQL
async function fetchUserData() {
    try {
        // Basic user query
        const query = `
      {
        user {
          id
          login
        }
      }
    `;

        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const result = await response.json();

        // Update current user object with additional data
        if (result.data && result.data.user && result.data.user.length > 0) {
            currentUser = {
                ...currentUser,
                ...result.data.user[0]
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// Logout function
function handleLogout() {
    // Clear stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;

    // Redirect to login page
    renderLogin();
}

// Profile page render
function renderProfile() {
    app.innerHTML = `
    <div class="profile-container">
      <header class="profile-header">
        <h1>Welcome, ${currentUser?.login || 'User'}</h1>
        <button id="logout-btn" class="btn btn-secondary">Logout</button>
      </header>
      <div id="loading-indicator">Loading your data...</div>
      <div id="profile-content" class="hidden">
        <div class="stats-container">
          <div class="stat-card">
            <h3>Total XP</h3>
            <div id="total-xp" class="stat-value">0</div>
          </div>
          <div class="stat-card">
            <h3>Projects Completed</h3>
            <div id="projects-count" class="stat-value">0</div>
          </div>
          <div class="stat-card">
            <h3>Success Rate</h3>
            <div id="success-rate" class="stat-value">0%</div>
          </div>
        </div>
        
        <div class="profile-section">
          <h2>XP Progress</h2>
          <div id="xp-chart" class="chart-container"></div>
        </div>
        
        <div class="profile-section">
          <h2>Project Results</h2>
          <div id="results-chart" class="chart-container"></div>
        </div>
        
        <div class="profile-section">
          <h2>Recent Activities</h2>
          <div id="activities-list"></div>
        </div>
      </div>
    </div>
  `;

    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Load profile data
    loadProfileData();
}

// Load profile data
async function loadProfileData() {
    try {
        // We'll implement detailed GraphQL queries and rendering in the next steps
        const profileContent = document.getElementById('profile-content');
        const loadingIndicator = document.getElementById('loading-indicator');

        // Fetch all the necessary data
        await Promise.all([
            fetchUserStats(),
            fetchXPData(),
            fetchProjectResults(),
            fetchSkills()
        ]);

        // Hide loading indicator and show content
        loadingIndicator.classList.add('hidden');
        profileContent.classList.remove('hidden');

    } catch (error) {
        console.error('Error loading profile data:', error);
        document.getElementById('loading-indicator').textContent = 'Error loading data. Please try again.';
    }
}

// Fetch user stats
async function fetchUserStats() {
    try {
        // Query for user's XP transactions
        const query = `
      {
        transaction(where: {type: {_eq: "xp"}, userId: {_eq: ${currentUser.id}}}) {
          id
          type
          amount
          createdAt
          path
        }
        
        result(where: {userId: {_eq: ${currentUser.id}}}) {
          id
          grade
          createdAt
          path
          object {
            id
            name
            type
          }
        }
      }
    `;

        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user stats');
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error(data.errors[0].message);
        }

        const transactions = data.data.transaction || [];
        const results = data.data.result || [];

        // Calculate total XP
        const totalXP = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        document.getElementById('total-xp').textContent = totalXP.toLocaleString();

        // Count projects
        const projects = results.filter(result => result.object && result.object.type === 'project');
        document.getElementById('projects-count').textContent = projects.length;

        // Calculate success rate
        const passedProjects = projects.filter(result => result.grade > 0).length;
        const successRate = projects.length > 0 ? Math.round((passedProjects / projects.length) * 100) : 0;
        document.getElementById('success-rate').textContent = `${successRate}%`;

        // Store this data for use in charts
        window.userData = {
            transactions,
            results,
            totalXP,
            projects
        };

        return { transactions, results };
    } catch (error) {
        console.error('Error fetching user stats:', error);
        throw error;
    }
}

// Fetch XP data and create chart
async function fetchXPData() {
    try {
        if (!window.userData || !window.userData.transactions) {
            throw new Error('User data not available');
        }

        const transactions = window.userData.transactions;

        // Group transactions by month
        const xpByMonth = {};

        transactions.forEach(transaction => {
            const date = new Date(transaction.createdAt);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

            if (!xpByMonth[monthYear]) {
                xpByMonth[monthYear] = 0;
            }

            xpByMonth[monthYear] += transaction.amount;
        });

        // Sort months chronologically
        const sortedMonths = Object.keys(xpByMonth).sort((a, b) => {
            const [aMonth, aYear] = a.split('/').map(Number);
            const [bMonth, bYear] = b.split('/').map(Number);

            if (aYear !== bYear) {
                return aYear - bYear;
            }

            return aMonth - bMonth;
        });

        // Create data points for chart
        const dataPoints = sortedMonths.map(month => ({
            month,
            xp: xpByMonth[month]
        }));

        // Create SVG chart
        createXPChart(dataPoints);

    } catch (error) {
        console.error('Error fetching XP data:', error);
        document.getElementById('xp-chart').innerHTML = '<p class="error-message">Failed to load XP data.</p>';
    }
}

// Fetch project results and create chart
async function fetchProjectResults() {
    try {
        if (!window.userData || !window.userData.results) {
            throw new Error('User data not available');
        }

        const results = window.userData.results;

        // Count pass/fail by project type
        const resultCounts = {
            pass: 0,
            fail: 0
        };

        results.forEach(result => {
            if (result.object && result.object.type === 'project') {
                if (result.grade > 0) {
                    resultCounts.pass++;
                } else {
                    resultCounts.fail++;
                }
            }
        });

        // Create SVG pie chart
        createResultsChart(resultCounts);

    } catch (error) {
        console.error('Error fetching project results:', error);
        document.getElementById('results-chart').innerHTML = '<p class="error-message">Failed to load project results.</p>';
    }
}

// Generate recent activity list
async function fetchSkills() {
    try {
        if (!window.userData) {
            throw new Error('User data not available');
        }

        // Get recent transactions
        const recentActivities = [...window.userData.transactions]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        // Create activity list
        const activitiesList = document.getElementById('activities-list');

        if (recentActivities.length === 0) {
            activitiesList.innerHTML = '<p>No recent activities found.</p>';
            return;
        }

        const activitiesHTML = recentActivities.map(activity => {
            const date = new Date(activity.createdAt).toLocaleDateString();
            const projectPath = activity.path.split('/').pop();

            return `
        <div class="activity-item">
          <div class="activity-date">${date}</div>
          <div class="activity-details">
            <strong>${projectPath}</strong>
            <span class="xp-amount">+${activity.amount} XP</span>
          </div>
        </div>
      `;
        }).join('');

        activitiesList.innerHTML = activitiesHTML;

    } catch (error) {
        console.error('Error fetching skills:', error);
        document.getElementById('activities-list').innerHTML = '<p class="error-message">Failed to load activities.</p>';
    }
}

// Create XP progress chart using SVG
function createXPChart(data) {
    const container = document.getElementById('xp-chart');
    const width = container.clientWidth;
    const height = 300;
    const padding = { top: 20, right: 30, bottom: 40, left: 50 };

    // Calculate dimensions
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find max XP value for scaling
    const maxXP = Math.max(...data.map(d => d.xp));

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('class', 'xp-chart');

    // Create group for the chart content with padding
    const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    chartGroup.setAttribute('transform', `translate(${padding.left}, ${padding.top})`);

    // X axis scale
    const xStep = chartWidth / (data.length - 1 || 1);

    // Y axis scale
    const yScale = value => chartHeight - (value / maxXP) * chartHeight;

    // Create the line path
    let pathD = '';
    data.forEach((point, i) => {
        const x = i * xStep;
        const y = yScale(point.xp);
        if (i === 0) {
            pathD += `M ${x} ${y}`;
        } else {
            pathD += ` L ${x} ${y}`;
        }
    });

    // Add the line path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#3498db');
    path.setAttribute('stroke-width', '3');

    // Add points
    const pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    data.forEach((point, i) => {
        const x = i * xStep;
        const y = yScale(point.xp);

        // Create point circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '5');
        circle.setAttribute('fill', '#3498db');

        // Create tooltip functionality
        circle.addEventListener('mouseover', function (e) {
            // Create tooltip
            const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            tooltip.setAttribute('class', 'tooltip');
            tooltip.setAttribute('id', `tooltip-${i}`);

            // Tooltip background
            const tooltipBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            tooltipBg.setAttribute('x', x - 50);
            tooltipBg.setAttribute('y', y - 40);
            tooltipBg.setAttribute('width', '100');
            tooltipBg.setAttribute('height', '30');
            tooltipBg.setAttribute('fill', '#333');
            tooltipBg.setAttribute('rx', '5');

            // Tooltip text
            const tooltipText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            tooltipText.setAttribute('x', x);
            tooltipText.setAttribute('y', y - 20);
            tooltipText.setAttribute('text-anchor', 'middle');
            tooltipText.setAttribute('fill', 'white');
            tooltipText.textContent = `${point.month}: ${point.xp.toLocaleString()} XP`;

            tooltip.appendChild(tooltipBg);
            tooltip.appendChild(tooltipText);
            svg.appendChild(tooltip);
        });

        circle.addEventListener('mouseout', function () {
            const tooltip = document.getElementById(`tooltip-${i}`);
            if (tooltip) {
                tooltip.remove();
            }
        });

        pointsGroup.appendChild(circle);
    });

    // Create X axis
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    xAxis.setAttribute('transform', `translate(0, ${chartHeight})`);

    // X axis line
    const xAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxisLine.setAttribute('x1', '0');
    xAxisLine.setAttribute('y1', '0');
    xAxisLine.setAttribute('x2', chartWidth);
    xAxisLine.setAttribute('y2', '0');
    xAxisLine.setAttribute('stroke', '#333');
    xAxisLine.setAttribute('stroke-width', '1');

    xAxis.appendChild(xAxisLine);

    // X axis labels (show every other one if too many)
    const skipFactor = data.length > 6 ? 2 : 1;

    data.forEach((point, i) => {
        if (i % skipFactor === 0) {
            const x = i * xStep;

            // X tick
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', x);
            tick.setAttribute('y1', '0');
            tick.setAttribute('x2', x);
            tick.setAttribute('y2', '5');
            tick.setAttribute('stroke', '#333');

            // X label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', '20');
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '12px');
            label.textContent = point.month;

            xAxis.appendChild(tick);
            xAxis.appendChild(label);
        }
    });

    // Create Y axis
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Y axis line
    const yAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxisLine.setAttribute('x1', '0');
    yAxisLine.setAttribute('y1', '0');
    yAxisLine.setAttribute('x2', '0');
    yAxisLine.setAttribute('y2', chartHeight);
    yAxisLine.setAttribute('stroke', '#333');
    yAxisLine.setAttribute('stroke-width', '1');

    yAxis.appendChild(yAxisLine);

    // Y axis labels
    const yTickCount = 5;
    for (let i = 0; i <= yTickCount; i++) {
        const y = (i / yTickCount) * chartHeight;
        const value = maxXP - (i / yTickCount) * maxXP;

        // Y tick
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', '-5');
        tick.setAttribute('y1', y);
        tick.setAttribute('x2', '0');
        tick.setAttribute('y2', y);
        tick.setAttribute('stroke', '#333');

        // Y label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', '-10');
        label.setAttribute('y', y + 5);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('font-size', '12px');
        label.textContent = Math.round(value).toLocaleString();

        yAxis.appendChild(tick);
        yAxis.appendChild(label);

        // Grid line
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', '0');
        gridLine.setAttribute('y1', y);
        gridLine.setAttribute('x2', chartWidth);
        gridLine.setAttribute('y2', y);
        gridLine.setAttribute('stroke', '#ddd');
        gridLine.setAttribute('stroke-width', '1');
        gridLine.setAttribute('stroke-dasharray', '5,5');

        chartGroup.appendChild(gridLine);
    }

    // Add title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', width / 2);
    title.setAttribute('y', 15);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '16px');
    title.setAttribute('font-weight', 'bold');
    title.textContent = 'XP Progress Over Time';

    // Add all elements to SVG
    chartGroup.appendChild(path);
    chartGroup.appendChild(pointsGroup);
    chartGroup.appendChild(xAxis);
    chartGroup.appendChild(yAxis);
    svg.appendChild(chartGroup);
    svg.appendChild(title);

    // Add the SVG to the container
    container.innerHTML = '';
    container.appendChild(svg);
}

// Create pie chart for project results
function createResultsChart(data) {
    const container = document.getElementById('results-chart');
    const width = container.clientWidth;
    const height = 300;
    const radius = Math.min(width, height) / 3;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('class', 'results-chart');

    // Create group for centering the pie
    const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    chartGroup.setAttribute('transform', `translate(${centerX}, ${centerY})`);

    // Colors for the pie chart
    const colors = {
        pass: '#2ecc71',
        fail: '#e74c3c'
    };

    // Calculate total for percentages
    const total = data.pass + data.fail;

    // Generate pie slices
    let startAngle = 0;
    const slices = [];

    Object.entries(data).forEach(([key, value]) => {
        const percentage = value / total;
        const endAngle = startAngle + percentage * 2 * Math.PI;

        slices.push({
            key,
            value,
            percentage,
            startAngle,
            endAngle
        });

        startAngle = endAngle;
    });

    // Add animation on load
    const animationDuration = 750;
    const startTime = Date.now();
    let animationId;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        // Draw pie slices with animation
        drawSlices(progress);

        if (progress < 1) {
            animationId = requestAnimationFrame(animate);
        } else {
            // Add labels and legend when animation is done
            addLabels();
            addLegend();
        }
    }

    function drawSlices(progress) {
        // Clear existing slices during animation
        const existingSlices = chartGroup.querySelectorAll('.pie-slice');
        existingSlices.forEach(slice => slice.remove());

        slices.forEach(slice => {
            // Calculate animated end angle
            const animatedEndAngle = slice.startAngle + (slice.endAngle - slice.startAngle) * progress;

            // Calculate SVG arc path
            const startX = Math.cos(slice.startAngle) * radius;
            const startY = Math.sin(slice.startAngle) * radius;
            const endX = Math.cos(animatedEndAngle) * radius;
            const endY = Math.sin(animatedEndAngle) * radius;

            // Determine if the arc is more than 180 degrees (large-arc-flag)
            const largeArcFlag = animatedEndAngle - slice.startAngle > Math.PI ? 1 : 0;

            // Create SVG path for the slice
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `
        M 0 0
        L ${startX} ${startY}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
        Z
      `);
            path.setAttribute('fill', colors[slice.key]);
            path.setAttribute('class', 'pie-slice');
            path.setAttribute('data-key', slice.key);

            // Add hover interactivity
            path.addEventListener('mouseover', () => {
                path.setAttribute('opacity', '0.8');

                // Show tooltip
                const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                tooltip.setAttribute('id', `tooltip-${slice.key}`);

                const tooltipBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                tooltipBg.setAttribute('x', -60);
                tooltipBg.setAttribute('y', -70);
                tooltipBg.setAttribute('width', 120);
                tooltipBg.setAttribute('height', 40);
                tooltipBg.setAttribute('fill', '#333');
                tooltipBg.setAttribute('rx', 5);

                const tooltipText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                tooltipText.setAttribute('x', 0);
                tooltipText.setAttribute('y', -45);
                tooltipText.setAttribute('text-anchor', 'middle');
                tooltipText.setAttribute('fill', 'white');
                tooltipText.textContent = `${slice.key.toUpperCase()}: ${slice.value} (${Math.round(slice.percentage * 100)}%)`;

                tooltip.appendChild(tooltipBg);
                tooltip.appendChild(tooltipText);
                chartGroup.appendChild(tooltip);
            });

            path.addEventListener('mouseout', () => {
                path.setAttribute('opacity', '1');

                const tooltip = document.getElementById(`tooltip-${slice.key}`);
                if (tooltip) {
                    tooltip.remove();
                }
            });

            chartGroup.appendChild(path);
        });
    }

    function addLabels() {
        slices.forEach(slice => {
            // Skip small slices for labels
            if (slice.percentage < 0.1) return;

            const midAngle = slice.startAngle + (slice.endAngle - slice.startAngle) / 2;
            const x = Math.cos(midAngle) * (radius * 0.7);
            const y = Math.sin(midAngle) * (radius * 0.7);

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', y);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('alignment-baseline', 'middle');
            label.setAttribute('fill', 'white');
            label.setAttribute('font-weight', 'bold');
            label.textContent = Math.round(slice.percentage * 100) + '%';

            chartGroup.appendChild(label);
        });
    }

    function addLegend() {
        const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        legendGroup.setAttribute('transform', `translate(${-centerX + 20}, ${-centerY + 20})`);

        Object.entries(colors).forEach(([key, color], index) => {
            const y = index * 25;

            // Legend color box
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', 0);
            rect.setAttribute('y', y);
            rect.setAttribute('width', 15);
            rect.setAttribute('height', 15);
            rect.setAttribute('fill', color);

            // Legend text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', 25);
            text.setAttribute('y', y + 12.5);
            text.setAttribute('alignment-baseline', 'middle');
            text.textContent = key.charAt(0).toUpperCase() + key.slice(1);

            legendGroup.appendChild(rect);
            legendGroup.appendChild(text);
        });

        svg.appendChild(legendGroup);
    }

    // Add title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', centerX);
    title.setAttribute('y', 20);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '16px');
    title.setAttribute('font-weight', 'bold');
    title.textContent = 'Project Results';

    // Add the SVG to the container
    container.innerHTML = '';
    container.appendChild(svg);
    svg.appendChild(title);

    // Start animation
    animate();
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

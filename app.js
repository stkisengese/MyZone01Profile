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
    <div class="container">
    <div class="login-container">
      <h1 class="neon-text">LOGIN TO ZONE01</h1>
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
          attrs
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
      const userData = result.data.user[0];
      const userAttrs = userData.attrs ? JSON.parse(userData.attrs) : {};

      currentUser = {
        ...currentUser,
        login: userData.login,
        firstName: userAttrs.firstName || '',
        lastName: userAttrs.lastName || '',
        email: userAttrs.email || `${userData.login}@example.com`,
        phone: userAttrs.phone || 'Not provided',
        country: userAttrs.country || 'Not provided',
        gender: userAttrs.gender || 'Not provided',
        fullName: `${userAttrs.firstName || ''} ${userAttrs.lastName || ''}`.trim() || userData.login
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
    <div class="container">
        <!-- Header -->
        <header>
            <div>
                <h2 class="neon-text">Welcome, ${currentUser?.fullName || currentUser?.login || "User"}!</h2>
                <p>// Track your learning progress and achievements.</p>
            </div>
            <div class="flex items-center space-x-4">
                <button id="logout-btn" class="cyber-button">
                    <i class="fas fa-sign-out-alt mr-2"></i>LOGOUT
                </button>
                <div class="relative">
                    <button id="notifications-btn" class="notification-btn glow-effect">
                        <i class="fas fa-bell"></i>
                        <span class="notification-indicator"></span>
                    </button>
                </div>
                <div class="cyber-blue avatar">
                    <span id="user-initial">${currentUser?.login?.charAt(0).toUpperCase() || "U"}</span>
                </div>
            </div>
        </header>

        <div id="loading-indicator">Loading your data...</div>
        
        <!-- Main Content -->
            <div id="profile-content" class="hidden dashboard-layout">
                <!-- Left Sidebar - Profile Info -->
                <div class="sidebar">
                    <!-- Profile Card -->
                    <div class="card-glass">
                        <div class="flex-col items-center">
                            <div class="cyber-purple avatar avatar-large glow-effect">
                                <span id="profile-initial">${currentUser?.login?.charAt(0).toUpperCase() || "U"}</span>
                            </div>
                            <h2 id="profile-name" style="text-align: center; font-size: 1.25rem; font-weight: bold; color: white; margin-bottom: 0.25rem;">
                                ${currentUser?.login || "User"}
                            </h2>
                            <p id="profile-title" style="text-align: center; color: #00f5ff; margin-bottom: 1rem;">TECH STUDENT</p>
                            
                            <div class="space-y-3">
                                <div class="flex items-center">
                                    <i class="fas fa-envelope" style="color: #00f5ff; margin-right: 0.75rem;"></i>
                                    <span id="profile-email">${currentUser?.email || "Not provided"}</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-phone" style="color: #00f5ff; margin-right: 0.75rem;"></i>
                                    <span id="profile-phone">${currentUser?.phone || "Not provided"}</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-globe" style="color: #00f5ff; margin-right: 0.75rem;"></i>
                                    <span id="profile-country">${currentUser?.country || "Not provided"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Current Project -->
                    <div class="card-glass">
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: white; margin-bottom: 1rem;">CURRENT PROJECT</h3>
                        <div id="current-project" class="project-card">
                            <p style="color: #a0aec0; font-style: italic;">Loading project...</p>
                        </div>
                    </div>
                    
                    <!-- Quick Stats -->
                    <div class="card-glass">
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: white; margin-bottom: 1rem;">QUICK STATS</h3>
                        <div class="space-y-4">
                            <div>
                                <div class="progress-label">
                                    <span>XP PROGRESS</span>
                                    <span><span id="current-level">0</span>/<span id="next-level">1000</span></span>
                                </div>
                                <div class="progress-bar">
                                    <div id="xp-progress-bar" class="progress-fill" style="width: 0%"></div>
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <p style="font-size: 0.875rem; color: #00f5ff;">CURRENT RANK</p>
                                    <p id="current-rank" style="font-weight: 600; color: white;">-</p>
                                </div>
                                <div>
                                    <p style="font-size: 0.875rem; color: #00f5ff;">LEVEL</p>
                                    <p id="level" style="font-weight: 600; color: white;">-</p>
                                </div>
                                <div>
                                    <p style="font-size: 0.875rem; color: #00f5ff;">PROJECTS</p>
                                    <p id="completed-projects" style="font-weight: 600; color: white;">-</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content Area -->
                <div class="main-content">
                    <!-- Stats Cards -->
                    <div class="grid grid-cols-3 gap-6">
                        <div class="card-glass">
                            <div class="stat-card">
                                <div class="stat-info">
                                    <p style="color: #00f5ff;">TOTAL XP</p>
                                    <p id="total-xp">0</p>
                                </div>
                                <div class="stat-icon" style="background-color: rgba(0, 245, 255, 0.2); color: #00f5ff;">
                                    <i class="fas fa-star"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card-glass">
                            <div class="stat-card">
                                <div class="stat-info">
                                    <p style="color: #8a2be2;">COMPLETED PROJECTS</p>
                                    <p id="projects-count">0</p>
                                </div>
                                <div class="stat-icon" style="background-color: rgba(138, 43, 226, 0.2); color: #8a2be2;">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card-glass">
                            <div class="stat-card">
                                <div class="stat-info">
                                    <p style="color: #00f5ff;">AUDIT RATIO</p>
                                    <p id="audit-ratio">0.00</p>
                                </div>
                                <div class="stat-icon" style="background-color: rgba(0, 245, 255, 0.2); color: #00f5ff;">
                                    <i class="fas fa-chart-pie"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Charts Section -->
                    <div class="grid grid-cols-2 gap-6">
                        <!-- XP Progression Chart -->
                        <div class="card-glass">
                            <h3 style="font-size: 1.125rem; font-weight: 600; color: white; margin-bottom: 1rem;">XP PROGRESSION</h3>
                            <div class="chart-container">
                                <canvas id="xpChart"></canvas>
                            </div>
                        </div>
                        
                        <!-- Technical Skills Radar Chart -->
                        <div class="card-glass">
                            <h3 style="font-size: 1.125rem; font-weight: 600; color: white; margin-bottom: 1rem;">TECHNICAL SKILLS</h3>
                            <div class="chart-container">
                                <canvas id="skillsChart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Audit Ratio Pie Chart -->
                    <div class="card-glass">
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: white; margin-bottom: 1rem;">AUDITS RATIO (DONE/RECEIVED)</h3>
                        <div class="chart-container">
                            <canvas id="auditChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Pending Projects -->
                    <div class="card-glass">
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: white; margin-bottom: 1rem;">PENDING PROJECTS</h3>
                        <div id="pending-projects" class="space-y-4">
                            <div class="animate-pulse">
                                <div style="height: 4rem; background-color: #1e293b; border-radius: 0.5rem;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `;

  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('notifications-btn').addEventListener('click', () => {
    alert('Notifications feature coming soon!');
  });

  // Load profile data
  loadProfileData();
}

// Load profile data
async function loadProfileData() {
  try {

    const profileContent = document.getElementById('profile-content');
    const loadingIndicator = document.getElementById('loading-indicator');

    // Fetch all the necessary data
    await fetchUserStats();
    await Promise.all([
      fetchXPData(),
      fetchProjectResults(),
      fetchAuditData(),
      fetchPendingProjects(),
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
        user {
          id
          login
          attrs
          auditRatio
        }
        
        transaction(where: {type: {_eq: "xp"}, eventId: {_eq: 75}}) {
          id
          type
          amount
          createdAt
          path
          userId
        }
        
        # Up/Down transactions (peer review) - Audit Ratio Graph
        upTransactions: transaction(where: { type: { _eq: "up" } }) {
          amount
        }

        downTransactions: transaction(where: { type: { _eq: "down" } }) {
          amount
        }
        
        progress(where: {eventId: {_eq: 75}}) {
          grade
          createdAt
          isDone
          path
          object {
            id
            name
            type
          }
        }
        
        # XP Progression data with timestamps for the chart
        xpProgression: transaction(
          where: { type: { _eq: "xp" }, eventId: {_eq: 75} }
          order_by: { createdAt: asc }
        ) {
          amount
          createdAt
        }
        
        # Skill types for the skills chart
        skillTypes: transaction_aggregate(
          distinct_on: [type]
          where: { type: { _nin: ["xp", "level", "up", "down"] } }
          order_by: [{ type: asc }, { amount: desc }]
        ) {
          nodes {
            type
            amount
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

    // Extract user data and update currentUser
    if (data.data.user && data.data.user.length > 0) {
      const userData = data.data.user[0];
      let userAttrs = {};

      try {
        // Parse the attrs if it's a string, or use it directly if it's already an object
        userAttrs = typeof userData.attrs === 'string' ? JSON.parse(userData.attrs) : userData.attrs || {};
      } catch (e) {
        console.error('Error parsing user attributes:', e);
        userAttrs = {};
      }

      // Update currentUser with profile information
      currentUser = {
        ...currentUser,
        login: userData.login,
        firstName: userAttrs.firstName || '',
        lastName: userAttrs.lastName || '',
        middleName: userAttrs.middleName || '',
        email: userAttrs.email || `${userData.login}@example.com`,
        phone: userAttrs.phone || 'Not provided',
        country: userAttrs.country || 'Not provided',
        gender: userAttrs.gender || 'Not provided',
        fullName: `${userAttrs.firstName || ''} ${userAttrs.middleName || ''} ${userAttrs.lastName || ''}`.trim() || userData.login,
        auditRatio: userData.auditRatio || 0
      };

      // Update DOM elements with user information
      document.getElementById("profile-email").textContent = currentUser.email;
      document.getElementById("profile-phone").textContent = currentUser.phone;
      document.getElementById("profile-country").textContent = currentUser.country;
      document.getElementById("audit-ratio").textContent = currentUser.auditRatio.toFixed(2);

      // Update name displays
      document.getElementById("profile-name").textContent = currentUser.fullName;
      document.querySelector("header h2.neon-text").textContent = `Welcome, ${currentUser.fullName}!`;

      // Update initials
      const initial = currentUser.firstName?.charAt(0).toUpperCase() ||
        currentUser.login?.charAt(0).toUpperCase() || "U";
      document.getElementById("user-initial").textContent = initial;
      document.getElementById("profile-initial").textContent = initial;

      // Update localStorage
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // Filter transactions to only include those belonging to the current user
    const transactions = data.data.transaction.filter(t => t.userId === currentUser.id) || [];
    const results = data.data.progress.filter(p => p.object && p.object.type === "project") || [];
    const skillTypes = data.data.skillTypes?.nodes || []; // Get skill types
    const xpProgression = data.data.xpProgression || []; // Store XP progression data
    const totalXP = transactions.reduce((sum, transaction) => sum + transaction.amount, 0); // Calculate total XP
    const projects = results.filter(p => p.isDone); // Count projects
    document.getElementById('total-xp').textContent = totalXP.toLocaleString();
    document.getElementById('projects-count').textContent = projects.length;
    document.getElementById('completed-projects').textContent = projects.length;

    // Set rank and level based on XP
    let rank = "NOVICE"
    let level = 1

    if (totalXP > 5000) {
      rank = "MASTER"
      level = 5
    } else if (totalXP > 3000) {
      rank = "EXPERT"
      level = 4
    } else if (totalXP > 1500) {
      rank = "ADVANCED"
      level = 3
    } else if (totalXP > 500) {
      rank = "INTERMEDIATE"
      level = 2
    }

    document.getElementById("current-rank").textContent = rank
    document.getElementById("level").textContent = level

    // Set XP progress
    const currentLevelXP = totalXP - (level - 1) * 1000
    const nextLevelXP = 1000
    const progress = Math.min(100, (currentLevelXP / nextLevelXP) * 100)

    document.getElementById("current-level").textContent = currentLevelXP
    document.getElementById("next-level").textContent = nextLevelXP
    document.getElementById("xp-progress-bar").style.width = `${progress}%`

    // Set current project (most recent project)
    if (projects.length > 0) {
      const sortedProjects = [...projects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      const currentProject = sortedProjects[0]
      const projectName = currentProject.object?.name || "Unknown Project"
      const projectPath = currentProject.path.split("/").pop()
      const projectDate = new Date(currentProject.createdAt).toLocaleDateString()
      const projectGrade = currentProject.grade

      document.getElementById("current-project").innerHTML = `
                      <h4 style="font-weight: 600; color: white; margin-bottom: 0.5rem;">${projectName}</h4>
                  <div style="margin-top: 0.5rem;">
                      <div class="progress-label">
                          <span>PROGRESS</span>
                          <span>100%</span>
                      </div>
                      <div class="progress-bar">
                          <div class="progress-fill" style="width: 100%"></div>
                      </div>
                  </div>
                  <p style="font-size: 0.875rem; color: #a0aec0; margin-top: 0.5rem;">DUE: ${projectDate}</p>
              `
    }
    else {
      document.getElementById("current-project").innerHTML = `
        <p style="color: #a0aec0; font-style: italic;">No current project</p>
      `
    }

    // Store this data for use in charts
    window.userData = {
      transactions,
      results,
      totalXP,
      projects,
      upTransactions: data.data.upTransactions || [],
      downTransactions: data.data.downTransactions || [],
      auditRatio: currentUser.auditRatio,
      skillTypes: skillTypes,
      xpProgression: xpProgression,
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
    if (!window.userData) {
      throw new Error("User data not available");
    }

    // Use the dedicated XP progression data if available, otherwise fall back to transactions
    const xpData = window.userData.xpProgression && window.userData.xpProgression.length > 0
      ? window.userData.xpProgression
      : window.userData.transactions;

    if (!xpData || xpData.length === 0) {
      throw new Error("No XP data available");
    }

    // Process XP progression data for the chart
    const { dateLabels, cumulativeXP } = processXPProgressionData(xpData);

    // Create Chart.js chart with only the user's XP dataset
    const ctx = document.getElementById("xpChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: dateLabels,
        datasets: [
          {
            label: "Your XP",
            data: cumulativeXP,
            borderColor: "#00f5ff",
            backgroundColor: "rgba(0, 245, 255, 0.1)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#8a2be2",
            pointBorderColor: "#fff",
            pointHoverRadius: 5,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: "#e0e0e0",
              boxWidth: 12,
              padding: 15
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.raw !== null) {
                  label += formatXPValue(context.raw);
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.05)",
            },
            ticks: {
              color: "#e0e0e0",
              callback: function (value) {
                return formatXPValue(value);
              }
            },
            title: {
              display: true,
              text: 'XP Points',
              color: "#e0e0e0",
              padding: { top: 10, bottom: 10 }
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#e0e0e0",
              maxRotation: 45,
              minRotation: 45,
              autoSkip: true,
              maxTicksLimit: 10
            },
            title: {
              display: true,
              text: 'Date',
              color: "#e0e0e0",
              padding: { top: 10, bottom: 0 }
            },
          },
        },
      },
    });

    addTimeRangeSelector();
  } catch (error) {
    console.error("Error creating XP progression chart:", error);
    document.getElementById("xpChart").innerHTML = '<p class="error-message">Failed to load XP data.</p>';
  }
}

// Update processXPprogression data 
function processXPProgressionData(xpData) {
  const sortedData = [...xpData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Extract dates and amounts
  const dates = sortedData.map(item => new Date(item.createdAt));
  const amounts = sortedData.map(item => item.amount);

  // Create cumulative XP array (running total)
  const cumulativeXP = [];
  let runningTotal = 0;

  for (let i = 0; i < amounts.length; i++) {
    runningTotal += amounts[i];
    cumulativeXP.push(runningTotal);
  }

  // Format dates for display (only show month + day)
  const dateLabels = dates.map(date => {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  });

  return { dateLabels, cumulativeXP };
}

// 4. Add a time range selector to filter the data
function addTimeRangeSelector() {
  const chartContainer = document.querySelector(".chart-container:has(#xpChart)");

  // Only add the selector if it doesn't already exist
  if (!document.getElementById("xp-time-range")) {
    const selectorHTML = `
      <div class="time-range-selector">
        <label for="xp-time-range">Time Range:</label>
        <select id="xp-time-range" class="cyber-select">
          <option value="1">Last Month</option>
          <option value="3">Last 3 Months</option>
          <option value="6" selected>Last 6 Months</option>
          <option value="12">Last Year</option>
          <option value="0">All Time</option>
        </select>
      </div>
    `;

    // Create the element
    const selectorElement = document.createElement('div');
    selectorElement.innerHTML = selectorHTML;
    chartContainer.insertBefore(selectorElement, chartContainer.firstChild);

    // Add event listener to re-render chart on selection change
    document.getElementById("xp-time-range").addEventListener("change", function (e) {
      const months = parseInt(e.target.value);
      updateXPChartTimeRange(months);
    });
  }
}

// formatXPvalues to format values with appropriate units (K, M, G)
function formatXPValue(value) {
  if (value === 0) return '0 B';

  const units = [' B', ' KB', ' MB', ' GB'];
  const divisor = 1000;
  const magnitude = Math.floor(Math.log(value) / Math.log(divisor));
  const unitIndex = Math.min(magnitude, units.length - 1);

  if (unitIndex === 0) {
    // For values less than 1000, just show the whole number
    return value + ' ' + units[0];
  } else {
    // For larger values, convert and use up to 1 decimal place
    const convertedValue = value / Math.pow(divisor, unitIndex);
    const formattedValue = convertedValue < 10
      ? convertedValue.toFixed(1)
      : Math.round(convertedValue);

    return formattedValue + units[unitIndex];
  }
}

// Function to update the chart when time range changes
function updateXPChartTimeRange(months) {
  const chartInstance = Chart.getChart("xpChart");
  if (!chartInstance) return;

  // Get the original data
  const xpData = window.userData.xpProgression && window.userData.xpProgression.length > 0
    ? window.userData.xpProgression
    : window.userData.transactions;

  if (!xpData || xpData.length === 0) return;

  // If months is 0, show all data
  if (months === 0) {
    const { dateLabels, cumulativeXP } = processXPProgressionData(xpData);

    chartInstance.data.labels = dateLabels;
    chartInstance.data.datasets[0].data = cumulativeXP;
    chartInstance.update();
    return;
  }

  // Filter data for the selected time period
  const currentDate = new Date();
  const cutoffDate = new Date();
  cutoffDate.setMonth(currentDate.getMonth() - months);

  const filteredData = xpData.filter(item => new Date(item.createdAt) >= cutoffDate);

  // If no data in the selected range, show a message
  if (filteredData.length === 0) {
    document.getElementById("xpChart").innerHTML = '<p class="error-message">No XP data available for the selected time period.</p>';
    return;
  }

  // Process and update the chart
  const { dateLabels, cumulativeXP } = processXPProgressionData(filteredData);

  chartInstance.data.labels = dateLabels;
  chartInstance.data.datasets[0].data = cumulativeXP;
  chartInstance.update();
}

// Fetch project results and create chart
async function fetchProjectResults() {
  try {
    if (!window.userData || !window.userData.results) {
      throw new Error("User data not available");
    }

    const results = window.userData.results;
    const skillTypes = window.userData.skillTypes;

    // Process skill data for the radar chart
    const processedSkills = processSkillsData(skillTypes);

    // Create skills radar chart
    const ctx = document.getElementById("skillsChart").getContext("2d");
    new Chart(ctx, {
      type: "radar",
      data: {
        labels: processedSkills.labels,
        datasets: [
          {
            label: "SKILL LEVEL",
            data: processedSkills.values,
            backgroundColor: "rgba(0, 245, 255, 0.2)",
            borderColor: "#00f5ff",
            pointBackgroundColor: "#8a2be2",
            pointBorderColor: "#fff",
            pointHoverRadius: 5,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: {
              display: false,
              stepSize: 20,
            },
            grid: {
              color: "rgba(255, 255, 255, 0.05)",
            },
            pointLabels: {
              color: "#e0e0e0",
              font: {
                size: 10
              }
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.label}: ${context.raw}`;
              }
            }
          }
        },
      },
    });
  } catch (error) {
    console.error("Error creating skills chart:", error);
    document.getElementById("skillsChart").innerHTML = '<p class="error-message">Failed to load skills data.</p>';
  }
}

// Helper function to process skills data for the radar chart
function processSkillsData(skillTypes) {
  // Filter and format skill types
  const skills = skillTypes.filter(skill => skill.type.startsWith('skill_')).map(skill => {
    // Remove 'skill_' prefix and format label
    const label = skill.type.replace('skill_', '').toUpperCase();
    return {
      label: label,
      value: skill.amount
    };
  });

  // Sort by amount (highest first)
  skills.sort((a, b) => b.value - a.value);

  // Take top 8 skills for better readability
  const topSkills = skills.slice(0, 8);

  return {
    labels: topSkills.map(skill => skill.label),
    values: topSkills.map(skill => skill.value)
  };
}
// Fetch audit data
async function fetchAuditData() {
  try {
    const upTransactions = window.userData.upTransactions || [];
    const downTransactions = window.userData.downTransactions || [];

    const auditsDone = upTransactions.reduce((sum, t) => sum + t.amount, 0);
    const auditsReceived = downTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Display audit ratio value
    let auditRatio = window.userData.auditRatio;
    document.getElementById("audit-ratio").textContent = (auditRatio).toFixed(1);

    // Create audit ratio pie chart
    const ctx = document.getElementById("auditChart").getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["DONE", "RECEIVED"],
        datasets: [
          {
            data: [auditsDone || 1, auditsReceived || 1], // Ensure we have at least some data to show
            backgroundColor: ["#00f5ff", "#8a2be2"],
            borderWidth: 0,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              padding: 20,
              color: "#e0e0e0",
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || ""
                const value = context.raw || 0
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = Math.round((value / total) * 100)
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
        },
      },
    })
  } catch (error) {
    console.error("Error fetching audit data:", error)
    document.getElementById("auditChart").innerHTML = '<p class="error-message">Failed to load audit data.</p>'
  }
}

// Generate pending projects
async function fetchPendingProjects() {
  try {
    if (!window.userData || !window.userData.results) {
      throw new Error("User data not available");
    }

    // Filter for pending projects (not done)
    const pendingProjects = window.userData.results
      .filter(project => project.object && project.object.type === "project" && !project.isDone)
      .map(project => {
        // Calculate time elapsed since creation
        const createdDate = new Date(project.createdAt);
        const currentDate = new Date();
        const timeDiffInMs = currentDate - createdDate;
        const daysDiff = Math.floor(timeDiffInMs / (1000 * 60 * 60 * 24));

        let timeElapsed;
        if (daysDiff < 1) {
          timeElapsed = "TODAY";
        } else if (daysDiff === 1) {
          timeElapsed = "1 DAY";
        } else if (daysDiff < 7) {
          timeElapsed = `${daysDiff} DAYS`;
        } else if (daysDiff < 30) {
          const weeks = Math.floor(daysDiff / 7);
          timeElapsed = `${weeks} ${weeks === 1 ? 'WEEK' : 'WEEKS'}`;
        } else {
          const months = Math.floor(daysDiff / 30);
          timeElapsed = `${months} ${months === 1 ? 'MONTH' : 'MONTHS'}`;
        }

        return {
          name: project.object.name || "Unknown Project",
          createdAt: project.createdAt,
          timeElapsed: timeElapsed,
          path: project.path
        };
      });

    // Sort projects by creation date (newest first)
    pendingProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Update the current project in the sidebar with the most recent project
    if (pendingProjects.length > 0) {
      const currentProject = pendingProjects[0];
      const projectName = currentProject.name;
      const projectDate = new Date(currentProject.createdAt).toLocaleDateString();

      document.getElementById("current-project").innerHTML = `
        <h4 style="font-weight: 600; color: white; margin-bottom: 0.5rem;">${projectName}</h4>
        <div style="margin-top: 0.5rem;">
            <div class="progress-label">
                <span>IN PROGRESS</span>
                <span>${currentProject.timeElapsed}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 50%"></div>
            </div>
        </div>
        <p style="font-size: 0.875rem; color: #a0aec0; margin-top: 0.5rem;">STARTED: ${projectDate}</p>
      `;
    }

    // Create pending projects list
    const pendingProjectsEl = document.getElementById("pending-projects");

    if (pendingProjects.length === 0) {
      pendingProjectsEl.innerHTML = '<p style="color: #a0aec0;">No pending projects found.</p>';
      return;
    }

    pendingProjectsEl.innerHTML = pendingProjects
      .map(
        (project) => `
          <div class="project-card">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                      <h4 style="font-weight: 500; color: white;">${project.name}</h4>
                      <p style="font-size: 0.875rem; color: #a0aec0;">STARTED: ${new Date(project.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span class="time-elapsed-badge">${project.timeElapsed}</span>
              </div>
          </div>
        `
      )
      .join("");

    // Add CSS for the new time-elapsed-badge class if it doesn't exist
    if (!document.querySelector('style[data-time-badges]')) {
      const styleElement = document.createElement('style');
      styleElement.setAttribute('data-time-badges', 'true');
      styleElement.textContent = `
        .time-elapsed-badge {
          background-color: rgba(0, 245, 255, 0.15);
          color: #00f5ff;
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          border: 1px solid rgba(0, 245, 255, 0.3);
          box-shadow: 0 0 5px rgba(0, 245, 255, 0.2);
        }
      `;
      document.head.appendChild(styleElement);
    }

  } catch (error) {
    console.error("Error fetching pending projects:", error);
    document.getElementById("pending-projects").innerHTML =
      '<p class="error-message">Failed to load pending projects.</p>';
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

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

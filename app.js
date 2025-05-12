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
    <div class="container tech-gradient">
      <!-- Header -->
      <header class="profile-header">
        <div>
          <h1 class="neon-text">TECH DASHBOARD</h1>
          <p>// Welcome, ${currentUser?.login || 'User'}</p>
        </div>
        <div class="flex items-center space-x-4">
          <button id="logout-btn" class="cyber-button">
            <i class="fas fa-sign-out-alt"></i> LOGOUT
          </button>
          <div class="cyber-blue avatar" style="width: 40px; height: 40px;">
            <span>${currentUser?.login?.charAt(0).toUpperCase() || "U"}</span>
          </div>
        </div>
      </header>

      <div id="loading-indicator">Loading your data...</div>
      
      <div id="profile-content" class="hidden">
        <div class="profile-content">
          <!-- Left Sidebar -->
          <div class="sidebar">
            <!-- Profile Card -->
            <div class="card-glass">
              <div class="flex-col items-center">
                <div class="cyber-purple avatar glow-effect">
                  <span>${currentUser?.login?.charAt(0).toUpperCase() || "U"}</span>
                </div>
                <h2 style="text-align: center; margin-bottom: 0.5rem;">${currentUser?.login || "User"}</h2>
                <p style="text-align: center; color: #00f5ff; margin-bottom: 1rem;">TECH STUDENT</p>
                
                <div class="space-y-4">
                  <div class="flex items-center">
                    <i class="fas fa-star text-cyan-300 mr-3" style="color: #00f5ff; margin-right: 0.75rem;"></i>
                    <span>RANK: <span id="current-rank">-</span></span>
                  </div>
                  <div class="flex items-center">
                    <i class="fas fa-trophy text-cyan-300 mr-3" style="color: #00f5ff; margin-right: 0.75rem;"></i>
                    <span>LEVEL: <span id="level">-</span></span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Current Project -->
            <div class="card-glass">
              <h3 style="font-size: 1rem; margin-bottom: 1rem; color: white;">CURRENT PROJECT</h3>
              <div id="current-project" class="project-card">
                <p style="color: #a0aec0; font-style: italic;">Loading project...</p>
              </div>
            </div>
            
            <!-- Quick Stats -->
            <div class="card-glass">
              <h3 style="font-size: 1rem; margin-bottom: 1rem; color: white;">XP PROGRESS</h3>
              <div class="space-y-4">
                <div>
                  <div class="progress-label">
                    <span>CURRENT LEVEL</span>
                    <span><span id="current-level">0</span>/<span id="next-level">1000</span></span>
                  </div>
                  <div class="progress-bar">
                    <div id="xp-progress-bar" class="progress-fill" style="width: 0%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Main Content Area -->
          <div class="main-content">
            <!-- Stats Cards -->
            <div class="grid grid-cols-3">
              <div class="card-glass">
                <div class="flex items-center justify-between">
                  <div>
                    <p style="font-size: 0.875rem; color: #00f5ff;">TOTAL XP</p>
                    <p id="total-xp" style="font-size: 1.5rem; font-weight: bold; color: white;">0</p>
                  </div>
                  <div style="padding: 0.75rem; border-radius: 9999px; background-color: rgba(0, 245, 255, 0.2); color: #00f5ff;">
                    <i class="fas fa-star"></i>
                  </div>
                </div>
              </div>
              
              <div class="card-glass">
                <div class="flex items-center justify-between">
                  <div>
                    <p style="font-size: 0.875rem; color: #8a2be2;">PROJECTS COMPLETED</p>
                    <p id="projects-count" style="font-size: 1.5rem; font-weight: bold; color: white;">0</p>
                  </div>
                  <div style="padding: 0.75rem; border-radius: 9999px; background-color: rgba(138, 43, 226, 0.2); color: #8a2be2;">
                    <i class="fas fa-check-circle"></i>
                  </div>
                </div>
              </div>
              
              <div class="card-glass">
                <div class="flex items-center justify-between">
                  <div>
                    <p style="font-size: 0.875rem; color: #00f5ff;">SUCCESS RATE</p>
                    <p id="success-rate" style="font-size: 1.5rem; font-weight: bold; color: white;">0%</p>
                  </div>
                  <div style="padding: 0.75rem; border-radius: 9999px; background-color: rgba(0, 245, 255, 0.2); color: #00f5ff;">
                    <i class="fas fa-chart-pie"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Charts Section -->
            <div class="grid grid-cols-2">
              <!-- XP Progression Chart -->
              <div class="card-glass">
                <h3 style="font-size: 1rem; color: white;">XP PROGRESSION</h3>
                <div id="xp-chart" class="chart-container"></div>
              </div>
              
              <!-- Project Results Chart -->
              <div class="card-glass">
                <h3 style="font-size: 1rem; color: white;">PROJECT RESULTS</h3>
                <div id="results-chart" class="chart-container"></div>
              </div>
            </div>
            
            <!-- Recent Activities -->
            <div class="card-glass">
              <h3 style="font-size: 1rem; color: white; margin-bottom: 1rem;">RECENT ACTIVITIES</h3>
              <div id="activities-list" class="space-y-4"></div>
            </div>
          </div>
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
        transaction(where: {type: {_eq: "xp"}, userId: {_eq: ${currentUser.id}}, eventId: {_eq: 75}}) {
          id
          type
          amount
          createdAt
          path
        }
        progress(where: {userId: {_eq: ${currentUser.id}}, eventId: {_eq: 75}}) {
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
        const results = data.data.progress || [];

        // Calculate total XP
        const totalXP = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        document.getElementById('total-xp').textContent = totalXP.toLocaleString();

        // Count projects
        const projects = results.filter((result) => result.object && result.object.type === "project")
        document.getElementById('projects-count').textContent = projects.length;

        // Calculate success rate
        const passedProjects = projects.filter(result => result.grade > 0).length;
        const successRate = projects.length > 0 ? Math.round((passedProjects / projects.length) * 100) : 0;
        document.getElementById('success-rate').textContent = `${successRate}%`;

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
                <h4 style="color: white; margin-bottom: 0.5rem;">${projectName}</h4>
                <p style="color: #a0aec0; font-size: 0.875rem; margin-bottom: 0.5rem;">PATH: ${projectPath}</p>
                <p style="color: #a0aec0; font-size: 0.875rem;">COMPLETED: ${projectDate}</p>
                <p style="color: #a0aec0; font-size: 0.875rem; margin-top: 0.5rem;">GRADE: ${projectGrade > 0 ? projectGrade : "Failed"}</p>
            `
        }

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
        const labels = sortedMonths.map((month) => `WEEK ${sortedMonths.indexOf(month) + 1}`)
        const dataPoints = sortedMonths.map((month) => xpByMonth[month])

        // Create Chart.js chart
        const ctx = document.getElementById("xp-chart").getContext("2d")
        new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "XP POINTS",
                        data: dataPoints,
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
                        display: false,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: "rgba(255, 255, 255, 0.05)",
                        },
                        ticks: {
                            color: "#e0e0e0",
                        },
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            color: "#e0e0e0",
                        },
                    },
                },
            },
        })
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

        // Create Chart.js pie chart
        const ctx = document.getElementById("results-chart").getContext("2d")
        new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["PASS", "FAIL"],
                datasets: [
                    {
                        data: [resultCounts.pass, resultCounts.fail],
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
                                const label = context.label || "";
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`
                            },
                        },
                    },
                },
            },
        });
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

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

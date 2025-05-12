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
    await Promise.all([
      fetchUserStats(),
      fetchXPData(),
      fetchProjectResults(),
      // fetchSkills(),
      // fetchAuditData(),
      // fetchPendingProjects(),
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

    // Set mock profile data
    document.getElementById("profile-email").textContent = `${currentUser.login}`
    document.getElementById("profile-phone").textContent = "+254 XXX XXX XXX"
    document.getElementById("profile-country").textContent = "Kenya"

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
      throw new Error("User data not available")
    }

    const transactions = window.userData.transactions

    // Group transactions by month
    const xpByMonth = {}

    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt)
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`

      if (!xpByMonth[monthYear]) {
        xpByMonth[monthYear] = 0
      }

      xpByMonth[monthYear] += transaction.amount
    })

    // Sort months chronologically
    const sortedMonths = Object.keys(xpByMonth).sort((a, b) => {
      const [aMonth, aYear] = a.split("/").map(Number)
      const [bMonth, bYear] = b.split("/").map(Number)

      if (aYear !== bYear) {
        return aYear - bYear
      }

      return aMonth - bMonth
    })

    // Create data points for chart
    const labels = sortedMonths.map((month, i) => `WEEK ${i + 1}`)
    const dataPoints = sortedMonths.map((month) => xpByMonth[month])

    // Create Chart.js chart
    const ctx = document.getElementById("xpChart").getContext("2d")
    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "XP Points",
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
    console.error("Error fetching XP data:", error)
    document.getElementById("xpChart").innerHTML = '<p class="error-message">Failed to load XP data.</p>'
  }
}

// Fetch project results and create chart
async function fetchProjectResults() {
  try {
    if (!window.userData || !window.userData.results) {
      throw new Error("User data not available")
    }

    const results = window.userData.results

    // Count pass/fail by project type
    const resultCounts = {
      pass: 0,
      fail: 0,
    }

    results.forEach((result) => {
      if (result.object && result.object.type === "project") {
        if (result.grade > 0) {
          resultCounts.pass++
        } else {
          resultCounts.fail++
        }
      }
    })

    // Create skills radar chart
    const ctx = document.getElementById("skillsChart").getContext("2d")
    new Chart(ctx, {
      type: "radar",
      data: {
        labels: ["ALGORITHMS", "DATA STRUCTURES", "DATABASES", "SECURITY", "NETWORKING", "SYSTEM DESIGN"],
        datasets: [
          {
            label: "SKILL LEVEL",
            data: [
              Math.floor(Math.random() * 30) + 50, // Random values between 50-80
              Math.floor(Math.random() * 30) + 50,
              Math.floor(Math.random() * 30) + 50,
              Math.floor(Math.random() * 30) + 50,
              Math.floor(Math.random() * 30) + 50,
              Math.floor(Math.random() * 30) + 50,
            ],
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
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    })
  } catch (error) {
    console.error("Error creating skills chart:", error)
    document.getElementById("skillsChart").innerHTML = '<p class="error-message">Failed to load skills data.</p>'
  }
}

// Fetch audit data
async function fetchAuditData() {
  try {
    // For now, we'll use mock data since we don't have actual audit data
    const auditData = {
      done: Math.floor(Math.random() * 10) + 10, // Random values
      received: Math.floor(Math.random() * 10) + 15,
    }

    // Calculate and display audit ratio
    const auditRatio = (auditData.done / auditData.received).toFixed(2)
    document.getElementById("audit-ratio").textContent = auditRatio

    // Create audit ratio pie chart
    const ctx = document.getElementById("auditChart").getContext("2d")
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["DONE", "RECEIVED"],
        datasets: [
          {
            data: [auditData.done, auditData.received],
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
    // Mock pending projects data
    const pendingProjects = [
      { name: "Web Server Deployment", due: "2023-11-20", difficulty: "Medium" },
      { name: "Machine Learning Basics", due: "2023-11-28", difficulty: "Hard" },
      { name: "Mobile App Development", due: "2023-12-05", difficulty: "Medium" },
    ]

    // Create pending projects list
    const pendingProjectsEl = document.getElementById("pending-projects")

    pendingProjectsEl.innerHTML = pendingProjects
      .map(
        (project) => `
            <div class="project-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="font-weight: 500; color: white;">${project.name}</h4>
                        <p style="font-size: 0.875rem; color: #a0aec0;">DUE: ${new Date(project.due).toLocaleDateString()}</p>
                    </div>
                    <span class="difficulty-badge ${project.difficulty === "Hard"
            ? "difficulty-hard"
            : project.difficulty === "Medium"
              ? "difficulty-medium"
              : "difficulty-easy"
          }">${project.difficulty}</span>
                </div>
            </div>
        `,
      )
      .join("")
  } catch (error) {
    console.error("Error fetching pending projects:", error)
    document.getElementById("pending-projects").innerHTML =
      '<p class="error-message">Failed to load pending projects.</p>'
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

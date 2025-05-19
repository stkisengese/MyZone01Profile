import { handleLogin, handleLogout } from "./auth.js";
import { fetchUserStats, fetchXPData, fetchProjectResults, fetchAuditData, fetchPendingProjects } from './api.js';
import { updateXPChartTimeRange } from './graph.js';

// DOM Elements and Routing
const app = document.getElementById('app');

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


// Function to handle reload button click
function handleReload() {
    // Add spinning animation to the logo
    const logo = document.querySelector(".zero-one-logo")
    logo.classList.add("spinning")

    // Show loading indicator
    const loadingIndicator = document.getElementById("loading-indicator")
    const profileContent = document.getElementById("profile-content")

    if (loadingIndicator && profileContent) {
        loadingIndicator.textContent = "Reloading dashboard data..."
        loadingIndicator.classList.remove("hidden")
        profileContent.classList.add("hidden")
    }

    // Reload data after a short delay
    setTimeout(async () => {
        try {
            // Clear existing data
            window.userData = null

            // Reload all data
            await loadProfileData()

            // Remove spinning class after data is loaded
            logo.classList.remove("spinning")
        } catch (error) {
            console.error("Error reloading data:", error)
            if (loadingIndicator) {
                loadingIndicator.textContent = "Error reloading data. Please try again."
            }
            logo.classList.remove("spinning")
        }
    }, 500)
}

// Profile page render
function renderProfile() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    app.innerHTML = `
      <div class="container">
          <!-- Header -->
          <header>
              <div>
              <button id="reload-btn" class="cyber-button-icon" title="Reload Dashboard">
                    <svg width="50" height="50" viewBox="05 0 100 100" class="zero-one-logo">
                        <g class="zero">
                            <!-- Zero (0) -->
                            <circle class="white" cx="10" cy="10" r="5" />
                            <circle cx="20" cy="10" r="5" />
                            <circle cx="30" cy="10" r="5" />
                            <circle cx="40" cy="10" r="5" />
                            
                            <circle cx="10" cy="20" r="5" />
                            <circle cx="20" cy="20" r="5" />
                            <circle cx="30" cy="20" r="5" />
                            <circle cx="40" cy="20" r="5" />
                            <circle cx="50" cy="20" r="5" />
                            
                            <circle cx="10" cy="30" r="5" />
                            <circle cx="20" cy="30" r="5" />
                            <circle cx="40" cy="30" r="5" />
                            <circle cx="50" cy="30" r="5" />
                            
                            <circle cx="10" cy="40" r="5" />
                            <circle cx="20" cy="40" r="5" />
                            <circle cx="40" cy="40" r="5" />
                            <circle cx="50" cy="40" r="5" />
                            
                            <circle cx="10" cy="50" r="5" />
                            <circle cx="20" cy="50" r="5" />
                            <circle cx="40" cy="50" r="5" />
                            <circle cx="50" cy="50" r="5" />

                            <circle cx="10" cy="60" r="5" />
                            <circle cx="20" cy="60" r="5" />
                            <circle cx="40" cy="60" r="5" />
                            <circle cx="50" cy="60" r="5" />

                            <circle cx="10" cy="70" r="5" />
                            <circle cx="20" cy="70" r="5" />
                            <circle cx="40" cy="70" r="5" />
                            <circle cx="50" cy="70" r="5" />
                            
                            <circle cx="10" cy="80" r="5" />
                            <circle cx="20" cy="80" r="5" />
                            <circle cx="30" cy="80" r="5" />
                            <circle cx="40" cy="80" r="5" />
                            <circle cx="50" cy="80" r="5" />
                            
                            <circle cx="20" cy="90" r="5" />
                            <circle cx="30" cy="90" r="5" />
                            <circle cx="40" cy="90" r="5" />
                            <circle cx="50" cy="90" r="5" />
                        </g>
                        
                        <g class="one" transform="translate(20, 0)">
                            <!-- One (1) -->
                            <circle cx="60" cy="10" r="5" />
                            <circle cx="70" cy="10" r="5" />
                                                
                            <circle cx="70" cy="20" r="5" />
                            <circle cx="80" cy="20" r="5" />
                            
                            <circle cx="70" cy="30" r="5" />
                            <circle cx="80" cy="30" r="5" />
                            
                            <circle cx="70" cy="40" r="5" />
                            <circle cx="80" cy="40" r="5" />
                            
                            <circle cx="70" cy="50" r="5" />
                            <circle cx="80" cy="50" r="5" />
                            
                            <circle cx="70" cy="60" r="5" />
                            <circle cx="80" cy="60" r="5" />

                            <circle cx="70" cy="70" r="5" />
                            <circle cx="80" cy="70" r="5" />

                            <circle cx="70" cy="80" r="5" />
                            <circle cx="80" cy="80" r="5" />
                            
                            <circle cx="80" cy="90" r="5" />
                        </g>
                    </svg>
                </button>
                </div>
                <div>
                  <h2 class="neon-text">Welcome, ${currentUser?.login || "User"}!</h2>
                  <p>// Track your learning progress and achievements.</p>
              </div>
              <div class="flex items-center space-x-4">
                  <button id="logout-btn" class="cyber-button">
                      <i class="fas fa-sign-out-alt mr-2"></i>LOGOUT
                  </button>
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
                              <p id="profile-title" style="text-align: center; color: #00f5ff; margin-bottom: 1rem;">APPRENTICE</p>
                              
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
                                      <span>RANK PROGRESS</span>
                                      <span><span id="current-level">0</span>/<span id="next-level">10</span></span>
                                  </div>
                                  <div class="progress-bar">
                                      <div id="xp-progress-bar" class="progress-fill" style="width: 0%"></div>
                                  </div>
                                  <div id="rank-tooltip" style="font-size: 0.75rem; color: #a0aec0; text-align: center; margin-top: 0.25rem;">
                                      Progressing to next rank: <span id="next-rank-name">Loading...</span>
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
                          
                          <!-- Technical Skills Radar Chart -->
                          <div class="card-glass">
                              <div class="flex justify-between items-center mb-4">
                                <h3 style="font-size: 1.125rem; font-weight: 600; color: white;">TECHNICAL SKILLS</h3>
                                <div class="skills-controls">
                                    <button id="randomize-skills" class="cyber-button" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                                        <i class="fas fa-random mr-1"></i>RANDOMIZE
                                    </button>
                                </div>
                            </div>
                              <div class="chart-container" id="skills-chart-container">
                                  <!-- SVG will be inserted here -->
                              </div>
                          </div>
  
                          <!-- Audit Ratio Pie Chart -->
                          <div class="card-glass">
                              <h3 style="font-size: 1.125rem; font-weight: 600; color: white; margin-bottom: 1rem;">AUDITS RATIO (DONE/RECEIVED)</h3>
                              <div class="chart-container" id="audit-chart-container">
                                  <!-- SVG will be inserted here -->
                              </div>
                          </div>
                      </div>
                      
                       <!-- XP Progression Chart -->
                          <div class="card-glass">
                              <h3 style="font-size: 1.125rem; font-weight: 600; color: white; margin-bottom: 1rem;">XP PROGRESSION</h3>
                              <div id="xp-time-range-container" class="time-range-selector">
                                  <label for="xp-time-range">Time Range:</label>
                                  <select id="xp-time-range" class="cyber-select">
                                      <option value="1">Last Month</option>
                                      <option value="3">Last 3 Months</option>
                                      <option value="6" selected>Last 6 Months</option>
                                      <option value="12">Last Year</option>
                                      <option value="0">All Time</option>
                                  </select>
                              </div>
                              <div class="chart-container" id="xp-chart-container">
                                  <!-- SVG will be inserted here -->
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
    document.getElementById('reload-btn').addEventListener('click', handleReload);
    document.getElementById("xp-time-range").addEventListener("change", (e) => {
        const months = Number.parseInt(e.target.value);
        updateXPChartTimeRange(months);
    });
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
        ]);

        // Hide loading indicator and show content
        loadingIndicator.classList.add('hidden');
        profileContent.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading profile data:', error);
        document.getElementById('loading-indicator').textContent = 'Error loading data. Please try again.';
    }
}

export { renderLogin, renderProfile, loadProfileData };
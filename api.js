import { GRAPHQL_URL } from "./config.js";
import { processXPProgressionData, processSkillsData } from "./utils.js";
import { createXPLineChart, createSkillsRadarChart, createAuditDoughnutChart } from "./graph.js";
import { authToken } from "./auth.js";
import { formatXPValue, getRank, getNextRank } from "./utils.js";

// Fetch user data from GraphQL
async function fetchUserData() {
    let currentUser = ""
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

// Fetch user stats
async function fetchUserStats() {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    try {
        // Query for user's XP transactions
        const query = `
        {
          user {
            id
            login
            attrs
            auditRatio
            events(where: { eventId: { _eq: 75 } }) {
              level
            }
          }
          
          xpCount:transaction(where: {type: {_eq: "xp"}, eventId: {_eq: 75}}) {
            type
            amount
            createdAt
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
            document.getElementById("profile-initial").textContent = initial;

            // Update localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        // Filter transactions to only include those belonging to the current user
        const transactions = data.data.xpCount || [];
        const results = data.data.progress.filter(p => p.object && p.object.type === "project") || [];
        const skillTypes = data.data.skillTypes?.nodes || []; // Get skill types
        const xpProgression = data.data.xpProgression || []; // Store XP progression data
        const totalXPBytes = transactions.reduce((sum, transaction) => sum + transaction.amount, 0); // Calculate total XP
        const totalXP = formatXPValue(totalXPBytes);
        const projects = results.filter(p => p.isDone); // Count projects
        const level = data.data.user[0]?.events[0]?.level || 1;
        document.getElementById('total-xp').textContent = totalXP;
        document.getElementById('projects-count').textContent = projects.length;
        document.getElementById('completed-projects').textContent = projects.length;

        // Set rank using the new rank system
        const currentRank = getRank(level);
        const nextRank = getNextRank(currentRank);
        document.getElementById("current-rank").textContent = currentRank.name;
        document.getElementById("level").textContent = level;

        // Update next rank name in the tooltip
        const nextRankNameElement = document.getElementById("next-rank-name");
        if (nextRankNameElement) {
            if (nextRank) {
                nextRankNameElement.textContent = nextRank.name;
            } else {
                nextRankNameElement.textContent = "Max Rank Achieved";
                document.getElementById('rank-tooltip').textContent = "Congratulations! You've reached the highest rank!";
            }
        }

        let currentLevelInRank, levelsInCurrentRank, progressPercent;
        if (nextRank) {
            // Calculate progress to next rank
            currentLevelInRank = level - currentRank.minLevel;
            levelsInCurrentRank = currentRank.maxLevel - currentRank.minLevel + 1;
            progressPercent = Math.min(100, (currentLevelInRank / levelsInCurrentRank) * 100);

            document.getElementById("current-level").textContent = currentLevelInRank;
            document.getElementById("next-level").textContent = levelsInCurrentRank;
        } else {
            // Max rank reached
            document.getElementById("current-level").textContent = level;
            document.getElementById("next-level").textContent = level;
            progressPercent = 100;
        }

        document.getElementById("xp-progress-bar").style.width = `${progressPercent}%`;

        // Set current project (most recent project)
        if (projects.length > 0) {
            const sortedProjects = [...projects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const currentProject = sortedProjects[0];
            const projectName = currentProject.object?.name || "Unknown Project";
            const projectDate = new Date(currentProject.createdAt).toLocaleDateString();

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
        `;
        } else {
            document.getElementById("current-project").innerHTML = `
          <p style="color: #a0aec0; font-style: italic;">No current project</p>
        `;
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

// Fetch XP data and create SVG chart
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

        // Create SVG line chart
        createXPLineChart(dateLabels, cumulativeXP);
    } catch (error) {
        console.error("Error creating XP progression chart:", error);
        document.getElementById("xp-chart-container").innerHTML = '<p class="error-message">Failed to load XP data.</p>';
    }
}

// Fetch project results and create SVG radar chart
async function fetchProjectResults() {
    try {
        if (!window.userData || !window.userData.skillTypes) {
            throw new Error("User data not available");
        }

        const skillTypes = window.userData.skillTypes;

        // Process skill data for the radar chart
        const processedSkills = processSkillsData(skillTypes);

        // Create SVG radar chart
        createSkillsRadarChart(processedSkills.labels, processedSkills.values);
    } catch (error) {
        console.error("Error creating skills chart:", error);
        document.getElementById("skills-chart-container").innerHTML =
            '<p class="error-message">Failed to load skills data.</p>';
    }
}

// Fetch audit data and create SVG doughnut chart
async function fetchAuditData() {
    try {
        const upTransactions = window.userData.upTransactions || [];
        const downTransactions = window.userData.downTransactions || [];

        const auditsDone = upTransactions.reduce((sum, t) => sum + t.amount, 0);
        const auditsReceived = downTransactions.reduce((sum, t) => sum + t.amount, 0);

        // Display audit ratio value
        const auditRatio = window.userData.auditRatio;
        document.getElementById("audit-ratio").textContent = auditRatio.toFixed(1);

        // Create SVG doughnut chart
        createAuditDoughnutChart(auditsDone, auditsReceived);
    } catch (error) {
        console.error("Error fetching audit data:", error)
        document.getElementById("audit-chart-container").innerHTML =
            '<p class="error-message">Failed to load audit data.</p>'
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

    } catch (error) {
        console.error("Error fetching pending projects:", error);
        document.getElementById("pending-projects").innerHTML =
            '<p class="error-message">Failed to load pending projects.</p>';
    }
}

export {
    fetchUserStats,
    fetchXPData,
    fetchProjectResults,
    fetchAuditData,
    fetchPendingProjects,
    fetchUserData
};
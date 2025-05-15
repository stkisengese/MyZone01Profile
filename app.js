import { processXPProgressionData, processSkillsData } from "./utils.js";
import { createXPLineChart, createSkillsRadarChart, createAuditDoughnutChart } from "./graph.js";
import { renderLogin, renderProfile } from "./ui.js";
import { RANK_CONFIG } from "./config.js";
import { handleLogin, authToken } from "./auth.js";

// Initialize the application
function init() {
  if (authToken) { // Check if user is logged in
    renderProfile();
  } else {
    renderLogin();
    document.getElementById('login-form').addEventListener('submit', async (event) => {
      // event.preventDefault();
      const success = await handleLogin(event);
      if (success) {
        renderProfile();
      }
    });
  }
}

// Event listener for rank hover to show more details
document.addEventListener('DOMContentLoaded', function () {
  const rankProgressBar = document.querySelector('.progress-bar');
  const rankTooltip = document.getElementById('rank-tooltip');

  if (rankProgressBar && rankTooltip) {
    rankProgressBar.addEventListener('mouseover', function () {
      rankTooltip.style.opacity = '1';
    });

    rankProgressBar.addEventListener('mouseout', function () {
      rankTooltip.style.opacity = '0.7';
    });
  }

  // Add this code to update the next rank name in the tooltip
  function updateNextRankTooltip() {
    const currentRankElement = document.getElementById('current-rank');
    const nextRankNameElement = document.getElementById('next-rank-name');

    if (currentRankElement && nextRankNameElement) {
      const currentRankName = currentRankElement.textContent;
      const currentRankIndex = RANK_CONFIG.findIndex(rank => rank.name === currentRankName);

      if (currentRankIndex < RANK_CONFIG.length - 1) {
        nextRankNameElement.textContent = RANK_CONFIG[currentRankIndex + 1].name;
      } else {
        // At max rank
        nextRankNameElement.textContent = "Max Rank Achieved";
        document.getElementById('rank-tooltip').textContent = "Congratulations! You've reached the highest rank!";
      }
    }
  }

  // Create a MutationObserver to watch for changes to the current-rank element
  const observer = new MutationObserver(updateNextRankTooltip);
  const currentRankElement = document.getElementById('current-rank');

  if (currentRankElement) {
    observer.observe(currentRankElement, { childList: true });
  }
});

// Event listener to handle responsive chart updates
window.addEventListener("resize", () => {
  if (window.userData) {
    // Get current chart containers
    const xpChartContainer = document.getElementById("xp-chart-container")
    const skillsChartContainer = document.getElementById("skills-chart-container")
    const auditChartContainer = document.getElementById("audit-chart-container")

    // Clear and redraw charts if they exist
    if (xpChartContainer && xpChartContainer.innerHTML !== "") {
      const xpData =
        window.userData.xpProgression && window.userData.xpProgression.length > 0
          ? window.userData.xpProgression
          : window.userData.transactions

      if (xpData && xpData.length > 0) {
        const { dateLabels, cumulativeXP } = processXPProgressionData(xpData)
        // Small delay to ensure container has new dimensions
        setTimeout(() => createXPLineChart(dateLabels, cumulativeXP), 100)
      }
    }

    if (skillsChartContainer && skillsChartContainer.innerHTML !== "") {
      const skillTypes = window.userData.skillTypes
      if (skillTypes) {
        const processedSkills = processSkillsData(skillTypes)
        // Small delay to ensure container has new dimensions
        setTimeout(() => createSkillsRadarChart(processedSkills.labels, processedSkills.values), 100)
      }
    }

    if (auditChartContainer && auditChartContainer.innerHTML !== "") {
      const upTransactions = window.userData.upTransactions || []
      const downTransactions = window.userData.downTransactions || []
      const auditsDone = upTransactions.reduce((sum, t) => sum + t.amount, 0)
      const auditsReceived = downTransactions.reduce((sum, t) => sum + t.amount, 0)
      // Small delay to ensure container has new dimensions
      setTimeout(() => createAuditDoughnutChart(auditsDone, auditsReceived), 100)
    }
  }
})

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

import { RANK_CONFIG } from "./config.js";

// Function to determine the current rank based on level
function getRank(level) {
    for (const rank of RANK_CONFIG) {
        if (level >= rank.minLevel && (rank.maxLevel === null || level <= rank.maxLevel)) {
            return rank;
        }
    }
    return RANK_CONFIG[RANK_CONFIG.length - 1]; // Default to highest rank if level exceeds all ranges
}

// Function to get the next rank
function getNextRank(currentRank) {
    const currentIndex = RANK_CONFIG.findIndex(rank => rank.name === currentRank.name);
    if (currentIndex < RANK_CONFIG.length - 1) {
        return RANK_CONFIG[currentIndex + 1];
    }
    return null; // Already at highest rank
}

// Format XP values with appropriate units
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
            ? convertedValue.toFixed(2)
            : Math.round(convertedValue);

        return formattedValue + units[unitIndex];
    }
}

// Process XP progression data
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
    })

    return { dateLabels, cumulativeXP, dates };
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

export {
    formatXPValue,
    processXPProgressionData,
    processSkillsData,
    getRank,
    getNextRank
};
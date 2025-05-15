// API Endpoints
const API_URL = 'https://learn.zone01kisumu.ke';
const AUTH_URL = `${API_URL}/api/auth/signin`;
const GRAPHQL_URL = `${API_URL}/api/graphql-engine/v1/graphql`;
const RANK_CONFIG = [
    { name: "Aspiring Developer", minLevel: 0, maxLevel: 9 },
    { name: "Beginner Developer", minLevel: 10, maxLevel: 20 },
    { name: "Apprentice Developer", minLevel: 20, maxLevel: 29 },
    { name: "Assistant Developer", minLevel: 30, maxLevel: 39 },
    { name: "Basic Developer", minLevel: 40, maxLevel: 49 },
    { name: "Junior Developer", minLevel: 50, maxLevel: 54 },
    { name: "Confirmed Developer", minLevel: 55, maxLevel: 59 },
    { name: "Full-Stack Developer", minLevel: 60, maxLevel: null } // null indicates no upper limit
];

export { API_URL, AUTH_URL, GRAPHQL_URL, RANK_CONFIG };
import { renderLogin, renderProfile } from "./ui.js";
import { fetchUserData } from "./api.js";
import { AUTH_URL } from "./config.js";

// App state
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let isGuestMode = false; // Flag for static snapshot mode

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
        isGuestMode = false;

        // Decode JWT to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUser = { id: payload.sub };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        await fetchUserData();
        renderProfile();

    } catch (error) {
        console.error('Login failed:', error);
        errorElement.textContent = 'Login failed: ' + error.message;
    }
}

// Activate guest/snapshot mode — no credentials needed
function handleGuestView() {
    isGuestMode = true;
    window.__guestMode = true; // expose for ui.js renderProfile header
    authToken = null;
    renderProfile();
}

// Logout function
function handleLogout() {
    // Clear stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    isGuestMode = false;
    renderLogin();
}

export {
    authToken,
    isGuestMode,
    handleLogin,
    handleLogout,
    handleGuestView,
};
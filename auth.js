import { renderLogin, renderProfile } from "./ui.js";
import { fetchUserData } from "./api.js";
import { AUTH_URL, RANK_CONFIG } from "./config.js";


// App state
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault()

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


export {
    authToken,
    handleLogin,
    handleLogout,
}
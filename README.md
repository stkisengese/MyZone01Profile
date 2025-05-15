# MyZone01Profile

## Overview

A web application that displays a student's learning progress, achievements, and statistics from the Zone01 learning platform. The dashboard features interactive charts, progress tracking, and project management.

## Features

    User Authentication: Secure login with JWT token storage

    Progress Visualization:

        XP progression line chart

        Skills radar chart

        Audit ratio doughnut chart

    Profile Management:

        Personal information display

        Current project tracking

        Pending projects list

    Responsive Design: Adapts to different screen sizes

## Technical Stack

    Frontend:

        Vanilla JavaScript (ES6 modules)

        SVG for dynamic chart rendering

        CSS3 with modern layout techniques (Flexbox/Grid)

    Backend API:

        Zone01 Kisumu GraphQL API

        REST authentication endpoint

## Live Demo

The application is hosted at: https://stkisengese.github.io/MyZone01Profile/


## Installation

    Clone the repository:
    bash

git clone https://learn.zone01kisumu.ke/git/skisenge/graphql
cd graphql

Serve the application using a local web server:

    Python 3:
    bash

python3 -m http.server 8000

Node.js (with live-server):
bash

    npx live-server

Open in browser:

    http://localhost:8000



Development Notes
Module Dependencies

![Module Dependency Graph]

app.js → auth.js → api.js
       ↘ ui.js → utils.js
               ↘ charts.js

Important Patterns

    State Management:

        Auth token and user data stored in localStorage

        Global state managed through module exports

    Chart Rendering:

        Pure SVG generation

        Responsive with window resize events

        Interactive tooltips

    Error Handling:

        Graceful fallbacks for failed API calls

        User-friendly error messages


License

[MIT License](./LICENSE) - Free for educational and personal use

## Author

[Stephen Kisengese](https://github.com/stkisengese)
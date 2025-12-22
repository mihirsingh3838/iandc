# IC2 Web Frontend

This is the web frontend for the IC2 project, built with React and Material-UI.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update the API URL in `src/config/env.js` if needed (defaults to `http://localhost:5000`)

3. Start the development server:
```bash
npm run dev
```

The application will start on http://localhost:3001

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build for production
- `npm run preview`: Preview the production build

## Features

- User authentication (Login/Logout)
- Facility selection
- Daily attendance tracking with selfie capture
- Installation & Commissioning (I&C) submission
  - Tower End form
  - Customer End form
  - Image uploads
  - Draft saving
  - Preview and submission

## Project Structure

```
web/
├── src/
│   ├── components/
│   │   └── ic/
│   │       ├── TowerEndForm.jsx
│   │       └── CustomerEndForm.jsx
│   ├── config/
│   │   └── env.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── screens/
│   │   ├── SplashScreen.jsx
│   │   ├── LoginScreen.jsx
│   │   ├── FacilitySelectionScreen.jsx
│   │   ├── FacilitySummaryScreen.jsx
│   │   ├── HomeScreen.jsx
│   │   ├── ICSubmissionScreen.jsx
│   │   └── ICPreviewScreen.jsx
│   ├── services/
│   │   └── icSubmissionService.js
│   ├── utils/
│   │   └── imageUtils.js
│   ├── data/
│   │   └── facilities.json
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Notes

- The web app uses file input for image selection instead of camera (as in mobile app)
- All API calls are made to the backend server configured in `src/config/env.js`
- Authentication tokens are stored in localStorage
- The app uses Material-UI (MUI) for UI components


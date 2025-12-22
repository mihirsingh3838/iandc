# IC2 Backend

This is the backend server for the IC2 project built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or a remote instance)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following content:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ic2
```

3. Start the development server:
```bash
npm run dev
```

The server will start on http://localhost:5000

## Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with hot reload

## API Endpoints

- `GET /`: Welcome message
- More endpoints coming soon... 
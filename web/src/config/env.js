// Read environment variables from Vite's import.meta.env
// Vite exposes env variables prefixed with VITE_ to the client
const getEnvVars = () => {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  
  return {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    env: env
  };
};

export default getEnvVars;

// Export API_URL for backward compatibility
// Uses VITE_API_URL from .env file, falls back to localhost for development
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';


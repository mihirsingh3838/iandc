import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     host: true,        // 👈 REQUIRED for mobile access
//     port: 3001,
//     proxy: {
//       '/api': {
//         target: 'http://0.0.0.0:5000', // or use your laptop IP
//         changeOrigin: true
//       }
//     }
//   }
// })

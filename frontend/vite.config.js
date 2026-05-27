import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * @type {import('vite').UserConfig}
 * @description Vite configuration setting up the React framework environment and a localized development API reverse proxy.
 */
export default defineConfig(({ mode }) => {
  // Pull environment flags out of the active context root directory
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5173, // 🚀 Standardizes your local frontend url to always sit at http://localhost:5173
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
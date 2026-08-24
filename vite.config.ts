import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Explicit, not just relying on Vite's default — never ship readable
    // source back to a production bundle that has no auth in front of it.
    sourcemap: false,
  },
})

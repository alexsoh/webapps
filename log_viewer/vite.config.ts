import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/webapps/log_viewer/',
  plugins: [react(), tailwindcss()],
})

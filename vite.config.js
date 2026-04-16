import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/estonian_b1_flashcards/',
  plugins: [react()],
}) 
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import eslint from "vite-plugin-eslint";
import checker from "vite-plugin-checker";
import tsconfigPaths from "vite-tsconfig-paths";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), eslint(), checker({ typescript: true }), tsconfigPaths()],
})

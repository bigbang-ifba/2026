// Alternativa: Importar de 'vitest/config' em vez de 'vite'
import { defineConfig } from 'vitest/config' // <--- Mudou aqui
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, '.', '')

  const allowAllHosts = env.VITE_ALLOW_ALL_HOSTS === 'true'

  const allowedHostsFromEnv = (env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map((host: string) => host.trim())
    .filter(Boolean)

  return {
    plugins: [react()],
    server: {
      host: true,
      allowedHosts: allowAllHosts ? true : allowedHostsFromEnv,
    },
    preview: {
      host: true,
      allowedHosts: allowAllHosts ? true : allowedHostsFromEnv,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      css: true,
    },
  }
})
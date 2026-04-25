import { defineConfig } from 'vitest/config'
import { loadEnv, type ServerOptions } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, '.', '')

  const allowAllHosts = env.VITE_ALLOW_ALL_HOSTS === 'true'

  const allowedHostsFromEnv = (env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map((host: string) => host.trim())
    .filter(Boolean)

  const allowedHosts: ServerOptions['allowedHosts'] = allowAllHosts
    ? true
    : allowedHostsFromEnv.length > 0
      ? allowedHostsFromEnv
      : undefined

  return {
    plugins: [react()],
    server: {
      host: true,
      allowedHosts,
    },
    preview: {
      host: true,
      allowedHosts,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      css: true,
    },
  }
})

import { defineConfig } from 'vitest/config'
import { loadEnv, type ServerOptions } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, '.', '')

  const allowAllHosts = env.VITE_ALLOW_ALL_HOSTS === 'true'

  // O Vite recusa requisições cujo Host não esteja liberado, então cada
  // domínio informado também libera a variante com e sem "www." — assim o
  // site abre das duas formas sem precisar repetir o domínio na variável.
  const comVariantesDeWww = (host: string): string[] =>
    host.startsWith('www.') ? [host, host.slice(4)] : [host, `www.${host}`]

  const allowedHostsFromEnv = Array.from(new Set(
    (env.VITE_ALLOWED_HOSTS || '')
      .split(',')
      .map((host: string) => host.trim())
      .filter(Boolean)
      .flatMap(comVariantesDeWww)
  ))

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

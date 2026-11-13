import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 소셜 로그인 콜백 주소(백엔드 기본값 http://localhost:3000/oauth/{provider}/callback)에 맞춰 3000번을 쓴다.
// VITE_API_BASE_URL을 비우면 /api 요청을 개발 서버 프록시가 백엔드(기본 8080)로 넘긴다.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})

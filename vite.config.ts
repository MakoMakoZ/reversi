import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// ポートは C:\Users\makot\.claude\ports.json の 8630 番台（reversi 用）
export default defineConfig({
  plugins: [react()],
  // Capacitor やポータルの静的配信でも読めるよう相対パスで出力する
  base: './',
  server: { host: '127.0.0.1', port: 8630, strictPort: true },
  preview: { host: '127.0.0.1', port: 8631, strictPort: true },
})

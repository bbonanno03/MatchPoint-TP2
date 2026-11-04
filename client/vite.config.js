import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MatchPoint',
        short_name: 'MatchPoint',
        description: 'Aplicación para reserva de canchas de pádel y tenis',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '48x48',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
})
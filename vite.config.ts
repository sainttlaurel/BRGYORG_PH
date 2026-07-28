import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.SENTRY_AUTH_TOKEN ? [sentryVitePlugin({
      org: process.env.SENTRY_ORG || 'payatas-ledger',
      project: process.env.SENTRY_PROJECT || 'payatas-ledger',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
    })] : []),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  // File types to support raw imports
  assetsInclude: ['**/*.svg', '**/*.csv'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Public site bundle
          'public-vendor': [
            'react',
            'react-dom',
            'react-router',
            'motion',
            'lucide-react',
          ],
          // Admin bundle
          'admin-vendor': [
            '@tanstack/react-query',
            'recharts',
            'sonner',
            'date-fns',
          ],
          // UI components bundle
          'ui-components': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
  },
})

import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/officials',
  '/services',
  '/document-application',
  '/registry',
  '/business-registry',
  '/projects',
  '/clearance-request',
  '/announcements',
  '/citizens-voice',
  '/community-vote',
  '/volunteer',
  '/report-concern',
  '/contact',
]

function prerenderPlugin(): import('vite').Plugin {
  return {
    name: 'vite:prerender',
    apply: 'build',
    enforce: 'post',
    async closeBundle() {
      const { existsSync } = await import('fs')
      const distDir = process.cwd() + '/dist'
      if (!existsSync(distDir)) {
        console.warn('[prerender] dist/ not found — skipping')
        return
      }

      // Skip if NO_PRERENDER is set or running on Vercel (no Chrome libs)
      if (process.env.NO_PRERENDER === '1' || process.env.VERCEL === '1') {
        console.log('[prerender] skipped — SPA fallback will be used for public routes')
        return
      }

      let server: Awaited<ReturnType<typeof import('vite').preview>> | null = null

      try {
        const { default: puppeteer } = await import('puppeteer')
        const { writeFileSync, mkdirSync } = await import('fs')
        const { join, dirname, relative } = await import('path')
        const { preview } = await import('vite')

        const PORT = 4199
        server = await preview({
          preview: { port: PORT, host: '127.0.0.1', strictPort: true },
        })
        console.log(`[prerender] preview server on http://127.0.0.1:${PORT}`)

        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
        })

        let success = 0, failed = 0

        try {
          const page = await browser.newPage()
          await page.setViewport({ width: 1280, height: 720 })

          for (const route of PUBLIC_ROUTES) {
            const url = `http://127.0.0.1:${PORT}${route}`
            process.stdout.write(`  ${route} ... `)
            try {
              await page.goto(url, { waitUntil: 'networkidle0', timeout: 25_000 })
              await new Promise(r => setTimeout(r, 2000))

              const html = await page.content()
              const outPath = route === '/'
                ? join(distDir, 'index.html')
                : join(distDir, route.slice(1), 'index.html')

              mkdirSync(dirname(outPath), { recursive: true })
              writeFileSync(outPath, html, 'utf-8')
              console.log(`\x1b[32m✓\x1b[0m ${html.length.toLocaleString()} bytes → ${relative(process.cwd(), outPath)}`)
              success++
            } catch (err: any) {
              console.log(`\x1b[31m✗\x1b[0m ${err.message}`)
              failed++
            }
          }

          console.log(`[prerender] done — ${success} rendered, ${failed} failed`)
        } finally {
          await browser.close()
        }
      } catch (err: any) {
        console.warn(`[prerender] skipped — ${err.message}`)
        console.warn('[prerender] SPA fallback will be used for public routes')
      } finally {
        await server?.close()
      }
    },
  }
}

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
    prerenderPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'public-vendor': [
            'react',
            'react-dom',
            'react-router',
            'motion',
            'lucide-react',
          ],
          'admin-vendor': [
            '@tanstack/react-query',
            'recharts',
            'sonner',
            'date-fns',
          ],
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

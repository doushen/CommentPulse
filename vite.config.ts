import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, cpSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-manifest',
      closeBundle() {
        if (!existsSync('dist')) {
          mkdirSync('dist', { recursive: true })
        }
        copyFileSync('manifest.json', 'dist/manifest.json')
        // 复制popup.html
        if (existsSync('src/popup/popup.html')) {
          copyFileSync('src/popup/popup.html', 'dist/popup.html')
        }
        // 复制图标
        if (existsSync('public/icons')) {
          if (!existsSync('dist/icons')) {
            mkdirSync('dist/icons', { recursive: true })
          }
          try {
            cpSync('public/icons', 'dist/icons', { recursive: true })
          } catch (e) {
            console.warn('Failed to copy icons:', e)
          }
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/content.ts'),
        inject: resolve(__dirname, 'src/content/inject.ts'),
        background: resolve(__dirname, 'src/background/background.ts'),
        popup: resolve(__dirname, 'src/popup/popup.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return `js/${chunkInfo.name}.js`
        },
        chunkFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name][extname]'
          }
          if (assetInfo.name === 'popup.html') {
            return '[name][extname]'
          }
          return 'assets/[name][extname]'
        },
        // 将所有共享依赖打包到 index.js
        manualChunks: (id) => {
          // 将所有 node_modules 的依赖打包到 index.js
          if (id.includes('node_modules')) {
            return 'index'
          }
        },
        format: 'es'
      }
    },
    cssCodeSplit: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})

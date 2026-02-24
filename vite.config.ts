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
      name: 'copy-static',
      closeBundle() {
        if (!existsSync('dist')) {
          mkdirSync('dist', { recursive: true })
        }
        // 复制 manifest
        copyFileSync('manifest.json', 'dist/manifest.json')
        // 复制 popup.html
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
        // 统一后的 content script 入口
        content: resolve(__dirname, 'src/content/index.ts'),
        background: resolve(__dirname, 'src/background/index.ts'),
        popup: resolve(__dirname, 'src/popup/index.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return `js/${chunkInfo.name}.js`
        },
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name][extname]'
          }
          if (assetInfo.name === 'popup.html') {
            return '[name][extname]'
          }
          return 'assets/[name][extname]'
        },
        // 依赖分包
        manualChunks: {
          'vendor': ['vue', 'element-plus', 'echarts']
        },
        format: 'es'
      }
    },
    cssCodeSplit: true,
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 保留 console 用于调试
        drop_debugger: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // 开发配置
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5174
    }
  }
})

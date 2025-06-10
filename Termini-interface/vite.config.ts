/// <reference types="vitest" />

import { defineConfig, type PluginOption } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";
import path from "path";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import { lingui } from "@lingui/vite-plugin";

export default defineConfig({
  worker: {
    format: "es",
  },
  plugins: [
    svgr({
      include: "**/*.svg?react",
    }),
    tsconfigPaths(),
    react({
      babel: {
        plugins: ["macros"],
      },
    }),
    lingui(),
    visualizer({
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
      open: false,
    }) as PluginOption,
  ],
  resolve: {
    alias: {
      abis: path.resolve(__dirname, "src/abis"),
      App: path.resolve(__dirname, "src/App"),
      components: path.resolve(__dirname, "src/components"),
      config: path.resolve(__dirname, "src/config"),
      context: path.resolve(__dirname, "src/context"),
      domain: path.resolve(__dirname, "src/domain"),
      fonts: path.resolve(__dirname, "src/fonts"),
      img: path.resolve(__dirname, "src/img"),
      lib: path.resolve(__dirname, "src/lib"),
      ab: path.resolve(__dirname, "src/ab"),
      locales: path.resolve(__dirname, "src/locales"),
      pages: path.resolve(__dirname, "src/pages"),
      styles: path.resolve(__dirname, "src/styles"),
      "typechain-types": path.resolve(__dirname, "src/typechain-types"),
      prebuilt: path.resolve(__dirname, "src/prebuilt"),
    },
  },
  build: {
    assetsInlineLimit: 0,
    outDir: "build",
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo: any) => {
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];
          if (/\.(css|scss|sass)$/.test(assetInfo.name)) {
            extType = 'css';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        manualChunks: {
          // React 
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'react-helmet', 'react-hot-toast', 'react-toastify'],
          // UI 
          'ui-vendor': ['framer-motion', '@headlessui/react', 'react-icons', 'react-loading-skeleton', 'react-select', 'react-tabs', 'rc-slider'],
          // chart
          'chart-vendor': ['recharts'],
          // Web3
          'web3-viem': ['viem'],
          'web3-core': ['ethers'],
          'web3-ui': ['@rainbow-me/rainbowkit', 'wagmi', '@wagmi/core', '@wagmi/connectors'],
          'web3-utils': ['@uniswap/sdk-core', '@uniswap/v3-sdk', '@ensdomains/ens-avatar', '@davatar/react'],
          // data
          'data-vendor': ['@tanstack/react-query', 'swr', '@apollo/client', 'graphql', 'immer', 'reselect', '@taskworld.com/rereselect'],
          // utils
          'utils-vendor': ['lodash', 'date-fns', 'query-string', 'classnames', 'shallowequal'],
          // micro
          'micro-vendor': ['@micro-zoe/micro-app']
        },
      },
      onwarn(warning, warn) {
        if (warning.code === 'SOURCEMAP_ERROR' || 
            (warning.message && warning.message.includes('/*#__PURE__*/'))) {
          return;
        }
        warn(warning);
      }
    },
  },
  optimizeDeps: {
    include: [
      '@micro-zoe/micro-app',
      'ethers',
      'viem',
      'framer-motion',
      '@tanstack/react-query',
      'recharts',
      'lodash/debounce',
      'lodash/throttle',
      'lodash/get',
      'lodash/set',
    ],
    force: true,
  },
  esbuild: {
    treeShaking: true,
    legalComments: 'none',
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  },
  test: {
    environment: "happy-dom",
    globalSetup: "./vitest.global-setup.js",
    exclude: ["node_modules"],
    setupFiles: ["@vitest/web-worker"],
  },
});

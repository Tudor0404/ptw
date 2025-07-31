import { defineConfig } from 'vitepress'
import { GITHUB_URL, WEBSITE_URL } from './constants'

export const shared = defineConfig({
  title: 'PTW - Predicate Time Windows',
  base: process.env.NODE_ENV === 'production' ? '/ptw/' : '/',
  rewrites: {
    'en/:rest*': ':rest*',
  },
  ignoreDeadLinks: 'localhostLinks',
  lastUpdated: true,
  cleanUrls: true,
  metaChunk: true,
  sitemap: {
    hostname: WEBSITE_URL,
    transformItems(items) {
      return items.filter(item => !item.url.includes('migration'))
    },
  },
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['meta', { name: 'theme-color', content: '#0ea5e9' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', {
      property: 'og:title',
      content: 'PTW - Predicate Time Windows | TypeScript Schedule Expression Parser',
    }],
    ['meta', { property: 'og:site_name', content: 'PTW Documentation' }],
    ['meta', {
      property: 'og:description',
      content: 'A powerful TypeScript library for parsing and evaluating schedule expressions with time, date, and logical operations.',
    }],
    ['meta', { property: 'og:image', content: '/logo.png' }],
    ['meta', { property: 'og:url', content: WEBSITE_URL }],
  ],
  themeConfig: {
    logo: '/logo.png',
    socialLinks: [
      { icon: 'github', link: GITHUB_URL },
    ],
    search: {
      provider: 'local',
    },
    outline: {
      level: [2, 3],
    },
  },
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
})

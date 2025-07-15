import { defineConfig } from 'vitepress'
import pkg from '../../../package.json'
import { GITHUB_URL } from './constants'

export const en = defineConfig({
  lang: 'en-US',
  description: 'TypeScript library starter template that provides VitePress documentation, supports building ESM and CJS formats.',
  themeConfig: {
    editLink: {
      pattern: `${GITHUB_URL}/edit/main/docs/:path`,
      text: 'Edit this page on GitHub',
    },
    nav: [
      { text: 'Guide', link: '/guide/what-is', activeMatch: '/guide/' },
      { text: 'Functions', link: '/functions', activeMatch: '/functions/' },
      {
        text: `v${pkg.version}`,
        items: [
          {
            text: 'Changelog',
            link: `${GITHUB_URL}/releases`,
          },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Guide',
        collapsed: false,
        items: [
          { text: 'What is starter-lib-ts?', link: '/guide/what-is' },
          { text: 'Getting Started', link: '/guide/getting-started' },
        ],
      },
      {
        text: 'Functions',
        collapsed: false,
        items: [
          { text: 'sayHello', link: '/functions/say-hello' },
        ],
      },
    ],
    lastUpdated: {
      text: 'Last Updated',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Kieran Wang',
    },
  },
})

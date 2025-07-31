import { defineConfig } from 'vitepress'
import pkg from '../../../package.json'
import { GITHUB_URL } from './constants'

export const en = defineConfig({
  lang: 'en-US',
  description: 'A powerful TypeScript library for parsing and evaluating schedule expressions with time, date, and logical operations.',
  themeConfig: {
    editLink: {
      pattern: `${GITHUB_URL}/edit/main/docs/:path`,
      text: 'Edit this page on GitHub',
    },
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'API Reference', link: '/api/overview', activeMatch: '/api/' },
      {
        text: `v${pkg.version}`,
        items: [
          {
            text: 'Changelog',
            link: `${GITHUB_URL}/releases`,
          },
          {
            text: 'GitHub',
            link: GITHUB_URL,
          },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Introduction',
        collapsed: false,
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'What is PTW?', link: '/guide/what-is' },
        ],
      },
      {
        text: 'Core Concepts',
        collapsed: false,
        items: [
          { text: 'Field Types', link: '/guide/field-types' },
          { text: 'Logical Operations', link: '/guide/logical-operations' },
          { text: 'Timezone Handling', link: '/guide/timezones' },
        ],
      },
      {
        text: 'API Reference',
        collapsed: true,
        items: [
          { text: 'parseExpression', link: '/api/parse-expression' },
          { text: 'Schedule Class', link: '/api/schedule' },
          { text: 'Field Classes', link: '/api/fields' },
          { text: 'Error Handling', link: '/api/errors' },
        ],
      },
    ],
    lastUpdated: {
      text: 'Last Updated',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Tudor Popescu',
    },
  },
})

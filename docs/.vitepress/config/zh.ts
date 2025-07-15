import { defineConfig } from 'vitepress'
import pkg from '../../../package.json'
import { GITHUB_URL } from './constants'

export const zh = defineConfig({
  lang: 'zh-CN',
  description: 'TypeScript 库启动模板，提供 VitePress 在线文档，支持构建 ESM 和 CJS 格式。',
  themeConfig: {
    editLink: {
      pattern: `${GITHUB_URL}/edit/main/docs/:path`,
      text: '在 GitHub 上编辑此页面',
    },
    nav: [
      { text: '指南', link: '/zh/guide/what-is', activeMatch: '/zh/guide/' },
      { text: '函数', link: '/zh/functions', activeMatch: '/zh/functions/' },
      {
        text: `v${pkg.version}`,
        items: [
          {
            text: '更新日志',
            link: `${GITHUB_URL}/releases`,
          },
        ],
      },
    ],
    sidebar: [
      {
        text: '指南',
        collapsed: false,
        items: [
          { text: '什么是 starter-lib-ts？', link: '/zh/guide/what-is' },
          { text: '立即开始', link: '/zh/guide/getting-started' },
        ],
      },
      {
        text: '函数',
        collapsed: false,
        items: [
          { text: 'sayHello', link: '/zh/functions/say-hello' },
        ],
      },
    ],
    footer: {
      message: '基于 MIT 许可证发布。',
      copyright: '版权 © 2024-present Kieran Wang',
    },
  },
})

---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: TypeScript Library Starter Template
  text: Provides VitePress documentation
  tagline: Supports building ESM, CJS and IIFE formats.
  image:
    src: /logo.png
    alt: Logo Image
    width: 200px
  actions:
    - theme: brand
      text: Getting Started
      link: /guide/getting-started
    - theme: alt
      text: Source Code
      link: https://github.com/starter-collective/starter-lib-ts

features:
  - title: Bundle with tsup
    details: Build package with tsup - Bundle your TypeScript library with simple config.
  - title: Unit Test
    details: Out-of-the-box unit testing with Vitest.
  - title: VitePress documentation
    details: Deploy on Netlify with zero-config, supports other deployment methods as well.
  - title: Publish & Version
    details: Manage versions using the CLI, and publish to npm with zero-config
---

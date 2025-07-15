# TypeScript Library Starter Template

[![GitHub Release Version](https://img.shields.io/github/v/release/starter-collective/starter-lib-ts?label=Release&color=%42b883)](https://github.com/starter-collective/starter-lib-ts/releases)
[![NPM Version](https://img.shields.io/npm/v/starter-lib-ts?style=flat&label=npm&color=%42b883)](https://www.npmjs.com/package/starter-lib-ts)
[![Build Status](https://github.com/starter-collective/starter-lib-ts/actions/workflows/ci.yml/badge.svg?branch=main&color=%42b883)](https://github.com/starter-collective/starter-lib-ts/actions/workflows/ci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/6b182d34-7d30-4206-aad9-9789d1c8ed11/deploy-status)](https://app.netlify.com/sites/starter-lib-ts/deploys)

TypeScript library starter template, provides VitePress documentation, supports building ESM, CJS and IIFE formats.

- [Live Demo](https://starter-lib-ts.netlify.app/)
- [Play on Stackblitz](https://stackblitz.com/github/starter-collective/starter-lib-ts)

## Features

- Build package with [tsup](https://tsup.egoist.dev/) - Bundle your TypeScript library with no config.
- Out-of-the-box unit testing with [Vitest](https://github.com/vitest-dev/vitest).
- [VitePress](https://vitepress.dev/) documentation - Deploy on [Netlify](https://app.netlify.com/) with zero-config, supports other deployment methods as well.
- Manage versions using the [bumpp](https://github.com/antfu-collective/bumpp), and publish to npm with zero-configPublish to [npm](https://www.npmjs.com) with zero-config.

## Usage

[Create a repo](https://github.com/starter-collective/starter-lib-ts/generate) from this template on GitHub.

```bash
git clone <git remote url>
```

Install npm dependencies.

```bash
cd starter-lib-ts # Or your project directory

pnpm i # If you don't have pnpm installed, run: npm install -g pnpm
```

Just run `dev` script to build your files.

```bash
pnpm dev
```

Open documentation for the library, you can run:

```bash
pnpm docs:dev
```

To build the library, you can run:

```bash
pnpm build
```

If you want to publish it, you can run:

```bash
pnpm release
```

## Clean Template

If you prefer to do it manually with the cleaner git history:

```bash
npx degit starter-collective/starter-lib-ts starter-lib-ts

cd starter-lib-ts

pnpm i # If you don't have pnpm installed, run: npm install -g pnpm
```

When you use this template, try follow the checklist to update your info properly:

- [ ] Change the package name in `package.json` and the global `iife` variable in `tsup.config.ts`.
- [ ] Update the website information, favicon, and logo icons in `docs/*`.

## License

[MIT License](./LICENSE) © 2024-PRESENT [Kieran Wang](https://github.com/kieranwv/)

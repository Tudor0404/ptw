import {defineConfig} from 'vitepress'
import {en} from './en'
import {shared} from './shared'

export default defineConfig({
    ...shared,
    // I18n config.
    // https://vitepress.dev/zh/guide/i18n
    locales: {
        root: {label: 'English', ...en},
    },
    // Vite config.
    // https://vitejs.dev
    vite: {
        server: {
            host: true,
            port: 9865,
        },
        preview: {
            host: true,
            port: 9865,
        },
    },
})

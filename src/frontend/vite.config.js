import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { defineConfig, loadEnv, createFilter, transformWithEsbuild } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    return {
        plugins: [
            react(),
            devServerPlugin(),
            sourcemapPlugin(),
            buildPathPlugin(),
            importPrefixPlugin(),
            svgrPlugin(),
            visualizer({
                open: true,
                filename: "stats.html", 
                gzipSize: true,
                brotliSize: true,
                }),
        ],
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler',
                    
                    // 1. Silence warnings from node_modules
                    quietDeps: true,

                    // 2. Silence deprecation warnings from sass
                    silenceDeprecations: [
                        'import', 
                        'global-builtin', 
                        'color-functions', 
                    ],
                },
            },
        },
    };
});
// Setup HOST, SSL, PORT
// Migration guide: Follow the guides below
// https://vitejs.dev/config/server-options.html#server-host
// https://vitejs.dev/config/server-options.html#server-https
// https://vitejs.dev/config/server-options.html#server-port
function devServerPlugin() {
    return {
        name: "dev-server-plugin",
        config(_, { mode }) {
            const { HOST, PORT, HTTPS, SSL_CRT_FILE, SSL_KEY_FILE } = loadEnv(mode, ".", ["HOST", "PORT", "HTTPS", "SSL_CRT_FILE", "SSL_KEY_FILE"]);
            const https = HTTPS === "true";
            return {
                server: {
                    host: HOST || "0.0.0.0",
                    port: parseInt(PORT || "3000", 10),
                    open: true,
                    ...(https &&
                        SSL_CRT_FILE &&
                        SSL_KEY_FILE && {
                        https: {
                            cert: readFileSync(resolve(SSL_CRT_FILE)),
                            key: readFileSync(resolve(SSL_KEY_FILE)),
                        },
                    }),
                },
            };
        },
    };
}
// Migration guide: Follow the guide below
// https://vitejs.dev/config/build-options.html#build-sourcemap
function sourcemapPlugin() {
    return {
        name: "sourcemap-plugin",
        config(_, { mode }) {
            const { GENERATE_SOURCEMAP } = loadEnv(mode, ".", [
                "GENERATE_SOURCEMAP",
            ]);
            return {
                build: {
                    sourcemap: GENERATE_SOURCEMAP === "true",
                },
            };
        },
    };
}
// Migration guide: Follow the guide below
// https://vitejs.dev/config/build-options.html#build-outdir
function buildPathPlugin() {
    return {
        name: "build-path-plugin",
        config(_, { mode }) {
            const { BUILD_PATH } = loadEnv(mode, ".", [
                "BUILD_PATH",
            ]);
            return {
                build: {
                    outDir: BUILD_PATH || "build",
                },
            };
        },
    };
}
// To resolve modules from node_modules, you can prefix paths with ~
// https://create-react-app.dev/docs/adding-a-sass-stylesheet
// Migration guide: Follow the guide below
// https://vitejs.dev/config/shared-options.html#resolve-alias
function importPrefixPlugin() {
    return {
        name: "import-prefix-plugin",
        config() {
            return {
                resolve: {
                    alias: [{ find: /^~([^/])/, replacement: "$1" }],
                },
            };
        },
    };
}
// In Create React App, SVGs can be imported directly as React components. This is achieved by svgr libraries.
// https://create-react-app.dev/docs/adding-images-fonts-and-files/#adding-svgs
function svgrPlugin() {
    const filter = createFilter("**/*.svg");
    const postfixRE = /[?#].*$/s;
    return {
        name: "svgr-plugin",
        async transform(code, id) {
            if (filter(id)) {
                const { transform } = await import("@svgr/core");
                const { default: jsx } = await import("@svgr/plugin-jsx");
                const filePath = id.replace(postfixRE, "");
                const svgCode = readFileSync(filePath, "utf8");
                const componentCode = await transform(svgCode, undefined, {
                    filePath,
                    caller: {
                        previousExport: code,
                        defaultPlugins: [jsx],
                    },
                });
                const res = await transformWithEsbuild(componentCode, id, {
                    loader: "jsx",
                });
                return {
                    code: res.code,
                    map: null,
                };
            }
        },
    };
}

import path, { resolve } from "node:path";
import { defineConfig, type CorsOptions } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import { vercelPreset } from "@vercel/remix/vite";
import type { IncomingMessage } from "node:http";
import pc from "picocolors";

import {
  getAuthorizationServerOrigin,
  isBuilderUrl,
} from "./app/shared/router-utils/origins";
import { readFileSync, existsSync } from "node:fs";
import fg from "fast-glob";

const rootDir = ["..", "../..", "../../.."]
  .map((dir) => path.join(__dirname, dir))
  .find((dir) => existsSync(path.join(dir, ".git")));

const hasPrivateFolders =
  fg.sync([path.join(rootDir ?? "", "packages/*/private-src/*")], {
    ignore: ["**/node_modules/**"],
  }).length > 0;

const conditions = hasPrivateFolders
  ? ["webstudio-private", "webstudio"]
  : ["webstudio"];

export default defineConfig(({ mode }) => {
  if (mode === "development") {
    // Enable self-signed certificates for development service 2 service fetch calls.
    // This is particularly important for secure communication with the oauth.ws.token endpoint.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  return {
    plugins: [
      remix({
        presets: [vercelPreset()],
        future: {
          v3_lazyRouteDiscovery: false,
          v3_relativeSplatPath: false,
          v3_singleFetch: false,
          v3_fetcherPersist: false,
          v3_throwAbortReason: false,
        },
      }),
      {
        name: "request-timing-logger",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const start = Date.now();
            res.on("finish", () => {
              const duration = Date.now() - start;
              if (
                !(
                  req.url?.startsWith("/@") ||
                  req.url?.startsWith("/app") ||
                  req.url?.includes("/node_modules")
                )
              ) {
                console.info(
                  `[${req.method}] ${req.url} - ${duration}ms : ${pc.dim(req.headers.host)}`
                );
              }
            });
            next();
          });
        },
      },
    ],
    resolve: {
      conditions: [...conditions, "browser", "development|production"],
      alias: [
        // Swiper CSS aliases to real files

        {
          find: "swiper/css/bundle",
          replacement: path.resolve(
            __dirname,
            "node_modules/swiper/swiper-bundle.css"
          ),
        },
        {
          find: "swiper/css/navigation",
          replacement: path.resolve(
            __dirname,
            "node_modules/swiper/modules/navigation.css"
          ),
        },
        {
          find: "swiper/css/pagination",
          replacement: path.resolve(
            __dirname,
            "node_modules/swiper/modules/pagination.css"
          ),
        },
        {
          find: "swiper/css/scrollbar",
          replacement: path.resolve(
            __dirname,
            "node_modules/swiper/modules/scrollbar.css"
          ),
        },
        {
          find: "swiper/css/thumbs",
          replacement: path.resolve(
            __dirname,
            "node_modules/swiper/modules/thumbs.css"
          ),
        },
        {
          find: "swiper/css/free-mode",
          replacement: path.resolve(
            __dirname,
            "node_modules/swiper/modules/free-mode.css"
          ),
        },
        {
          find: "~",
          replacement: resolve("app"),
        },

        // before 2,899.74 kB, after 2,145.98 kB
        {
          find: "@supabase/node-fetch",
          replacement: resolve("./app/shared/empty.ts"),
        },
        // UI deps used by vendor pages
        {
          find: "react-slick",
          replacement: path.resolve(__dirname, "node_modules/react-slick"),
        },
        {
          find: "react-parallax",
          replacement: path.resolve(__dirname, "node_modules/react-parallax"),
        },
        {
          find: "react-photoswipe-gallery",
          replacement: path.resolve(
            __dirname,
            "node_modules/react-photoswipe-gallery"
          ),
        },
        {
          find: "google-map-react",
          replacement: path.resolve(__dirname, "node_modules/google-map-react"),
        },
        {
          find: "react-modal-video",
          replacement: path.resolve(
            __dirname,
            "node_modules/react-modal-video"
          ),
        },
        {
          find: "react-toastify",
          replacement: path.resolve(__dirname, "node_modules/react-toastify"),
        },
        {
          find: "rc-slider",
          replacement:
            "/workspace/node_modules/.pnpm/rc-slider@11.1.8_react-dom@18.3.0-canary-14898b6a9-20240318_react@18.3.0-canary-14898b6a9-202_n4whn22pmofkpza4etaucjwzb4/node_modules/rc-slider",
        },
        {
          find: "rc-slider/es/index.js",
          replacement:
            "/workspace/node_modules/.pnpm/rc-slider@11.1.8_react-dom@18.3.0-canary-14898b6a9-20240318_react@18.3.0-canary-14898b6a9-202_n4whn22pmofkpza4etaucjwzb4/node_modules/rc-slider/es/index.js",
        },
        {
          find: "react-icons",
          replacement: path.resolve(__dirname, "node_modules/react-icons"),
        },
        {
          find: "react-pro-sidebar",
          replacement: path.resolve(
            __dirname,
            "node_modules/react-pro-sidebar"
          ),
        },
        // Force resolve swiper from this app's node_modules to avoid workspace root lookup
        {
          find: "swiper/react",
          replacement: path.resolve(
            __dirname,
            "node_modules/swiper/swiper-react.mjs"
          ),
        },
        {
          find: "swiper",
          replacement: path.resolve(
            __dirname,
            "app/shared/swiper-modules-shim.mjs"
          ),
        },
        {
          find: "react-multi-date-picker",
          replacement: path.resolve(
            __dirname,
            "node_modules/react-multi-date-picker"
          ),
        },
        {
          find: "aos",
          replacement: path.resolve(__dirname, "node_modules/aos"),
        },
        {
          find: "slick-carousel",
          replacement: path.resolve(__dirname, "node_modules/slick-carousel"),
        },
        {
          find: "react-phone-number-input",
          replacement: path.resolve(
            __dirname,
            "node_modules/react-phone-number-input"
          ),
        },
        {
          find: "photoswipe",
          replacement: path.resolve(__dirname, "node_modules/photoswipe"),
        },
        {
          find: "antd",
          replacement: path.resolve(__dirname, "node_modules/antd"),
        },
        {
          find: "lucide-react",
          replacement: path.resolve(
            rootDir ?? __dirname,
            "node_modules/lucide-react"
          ),
        },
        {
          find: "react-tabs",
          replacement: path.resolve(__dirname, "node_modules/react-tabs"),
        },
        {
          find: "dayjs",
          replacement:
            "/workspace/node_modules/.pnpm/dayjs@1.11.13/node_modules/dayjs",
        },
        {
          find: "react-toastify/dist/ReactToastify.css",
          replacement: path.resolve(
            __dirname,
            "node_modules/react-toastify/dist/ReactToastify.css"
          ),
        },
        {
          find: "antd/dist/reset.css",
          replacement: path.resolve(
            __dirname,
            "node_modules/antd/dist/reset.css"
          ),
        },
        {
          find: "rc-slider/assets/index.css",
          replacement: path.resolve(
            __dirname,
            "node_modules/rc-slider/assets/index.css"
          ),
        },
      ],
    },
    ssr: {
      resolve: {
        conditions: [...conditions, "node", "development|production"],
      },
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
    },
    server: {
      // Service-to-service OAuth token call requires a specified host for the wstd.dev domain
      host: "wstd.dev",
      // Needed for SSL
      proxy: {},

      https: {
        key: readFileSync("../../https/privkey.pem"),
        cert: readFileSync("../../https/fullchain.pem"),
      },
      cors: ((
        req: IncomingMessage,
        callback: (error: Error | null, options: CorsOptions | null) => void
      ) => {
        // Handle CORS preflight requests in development to mimic Remix production behavior
        if (req.method === "OPTIONS" || req.method === "POST") {
          if (req.headers.origin != null && req.url != null) {
            const url = new URL(req.url, `https://${req.headers.host}`);

            // Allow CORS for /builder-logout path when requested from the authorization server
            if (url.pathname === "/builder-logout" && isBuilderUrl(url.href)) {
              return callback(null, {
                origin: getAuthorizationServerOrigin(url.href),
                preflightContinue: false,
                credentials: true,
              });
            }
          }

          if (req.method === "OPTIONS") {
            // Respond with method not allowed for other preflight requests
            return callback(null, {
              preflightContinue: false,
              optionsSuccessStatus: 405,
            });
          }
        }

        // Disable CORS for all other requests
        return callback(null, {
          origin: false,
        });
      }) as never,
    },
    envPrefix: "GITHUB_",
    optimizeDeps: {
      include: [
        "swiper",
        "swiper/react",
        "react-slick",
        "react-parallax",
        "react-photoswipe-gallery",
        "photoswipe",
      ],
    },
  };
});

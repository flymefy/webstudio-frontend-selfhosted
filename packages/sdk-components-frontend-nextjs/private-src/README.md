# frontend-nextjs components for Webstudio

Place your Next.js React components here or link them via a submodule/symlink.

Recommended ways:

- Copy components from the `frontend-nextjs` repo into `private-src/`
- Or add `frontend-nextjs` as a git submodule and re-export components you need

After adding components:

- Generate prop arg types: `pnpm --filter=@webstudio-is/sdk-components-frontend-nextjs run build:args`
- Build the library: `pnpm --filter=@webstudio-is/sdk-components-frontend-nextjs run build`

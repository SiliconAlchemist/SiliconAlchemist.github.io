# Three Moons — Shrikant Garg

Portfolio: https://siliconalchemist.github.io/

This is the primary editable portfolio repository. Future code and content changes belong here, not in the earlier Cloudflare source repository.

## Development

Use Node.js 22 and npm 10. Run `npm ci`, then `npm run dev`.

Edit project stories in `content/projects/`, shared copy in `content/*.yaml`, and visitor-facing images and PDFs in `public/`. See `content/README.md` for the content format.

## Verification and publishing

Run `npm run content:check`, `npm run content:test`, and `npm run build`.

Pushing to `main` runs `.github/workflows/pages.yml`: it validates content, runs content tests, builds the static site, and publishes only `dist/client` to GitHub Pages. Pull requests run the checks without publishing. A failed build does not replace the live site.

GitHub Pages must use **GitHub Actions** as its publishing source. No custom domain, paid server, or deployment secret is required. Local edits are not live until committed and pushed.

## Private local materials

Internal source notes (`content/PROJECT-SOURCES.md`), original working assets (`assets/`), environment files, and previous hosting metadata (`.openai/`) are excluded from Git. Keep reference-only PDFs and unpublished materials outside `public/`. This repository is public: even a project marked `draft: true` is visible in Git if committed, although excluded from the built site.

The exported island model is in `public/models/pond-island.glb`. Blender preparation scripts require separately retained local working assets; those assets are not needed to build or deploy the website.

The old Cloudflare site is left intact as a separate snapshot. Its optional local preview configuration remains in `deploy/wrangler.jsonc`; GitHub publishing does not call it.

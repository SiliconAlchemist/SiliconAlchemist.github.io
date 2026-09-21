# Portfolio working repository

This public repository, SiliconAlchemist/SiliconAlchemist.github.io, is the primary source for Shrikant Garg's Three Moons portfolio. Do not push future changes to the former Cloudflare repository or publish through Sites.

- Inspect the working tree and preserve unrelated and unpublished changes.
- For project updates, read `content/PROJECT-UPDATES.md`, the target project record, and `content/README.md`.
- Keep one Markdown record per project. Preserve its filename, collection membership, and order unless the user asks to change them.
- Ground claims in supplied evidence. Do not invent contributions, measurements, dates, tools, or links.
- Keep research notes in the ignored local `content/PROJECT-SOURCES.md` when available. Never commit internal notes, source-only documents, credentials, or original working assets. Files in `public/` are downloadable by visitors.
- Run `npm run content:check` and `npm run build` for content or asset changes. Run `npm run content:test` for content-system changes. Inspect affected layouts when visuals change.
- Publishing is automatic on pushes to `main` via `.github/workflows/pages.yml`. Respect requests to hold publication. Verify the Actions result and live site after publishing.
- Report what changed, unresolved facts, and whether changes are live or local.

# Updating a project from supplied material

Use this guide with `AGENTS.md`. It makes each update small and self-contained so a model taking over does not need the entire conversation history. The user's latest instructions take precedence.

## 1. Identify the project and read its current record

Match the supplied title or subject to this table. Read that project's Markdown and source record before editing. Ask which project only when the material cannot be matched reliably. The user can send files without filling out a form.

| Project | Markdown filename in `content/projects/` | Primary moon | Secondary moon |
| --- | --- | --- | --- |
| Kalakriti | `kalakriti.md` | design | dev |
| Latency and Visual Task Performance | `seeing-through-latency.md` | design | data |
| Precise orbits | `precise-orbits.md` | data | dev |
| ETL at Eight Terabytes a Day | `data-at-scale.md` | data | — |
| Learning to explore | `learning-to-explore.md` | data | — |
| Stable Learned Bloom Filters | `stable-learned-bloom-filters.md` | data | dev |
| Natural-Language Cloud Data Exploration | `tool-grounded-ai.md` | dev | — |
| Infrastructure Anomaly Detection | `infrastructure-anomaly-detection.md` | data | dev |
| Deterministic Cloud Risk Engine | `cloud-risk-engine.md` | data | dev |
| Coding Agents for APEX Development | `apex-coding-agents.md` | dev | — |
| Direct Kafka Ingestion | `kafka-pipeline-modernization.md` | data | dev |
| Reporting Platform from Journey to Launch | `reporting-platform.md` | dev | design |
| Volume rendering | `volume-rendering.md` | dev | — |
| Solid textures | `solid-textures.md` | dev | — |
| The design collection | `the-design-collection.md` | design | — |
| Design Futures | `design-futures.md` | design | — |
| Composite Heritage | `composite-heritage.md` | design | — |
| TimCoins | `timcoins.md` | design | — |

This table is a starting map; the project files are authoritative. Update the table if an authorized change alters the mapping. For a new project, copy `_template.md` with a unique lowercase, hyphenated filename. Never create a second project record merely to place it in another collection.

## 2. Read the evidence

- PDFs: extract the text, then visually inspect pages with diagrams, screenshots, tables, or results needed for the story. For scanned pages, use OCR where available and check uncertain names and numbers against the page image. Record page references using PDF page numbers starting at 1, identifying printed page numbers separately if needed.
- Images: inspect the actual image before choosing a cover or describing it. Use descriptive alt text. Do not represent the site's existing decorative artwork as a screenshot of the project.
- Links: inspect the supplied page or repository when using it as evidence. If access fails, say so and use available evidence; do not claim to have read it.
- User notes: capture their role, corrections, and intended emphasis. Distinguish individual work from work attributed to a team or paper's coauthors.

Extract only what the source supports: purpose, context, audience, contribution, methods, design or engineering decisions, outcomes, and limitations. Keep useful facts and page references in `PROJECT-SOURCES.md`; do not paste an entire PDF into the editing record or the website.

If sources conflict, use an explicit user correction. Otherwise record the conflict and ask a narrow factual question when it affects the page. Continue with supported parts while awaiting an answer. Missing evidence is not permission to invent an outcome.

## 3. Update the existing project page

Write a short summary explaining what the project does and why it matters. Use a few specific tags for its main disciplines or tools. Write the expanded story in plain language, selecting headings that fit the material. A useful starting structure is:

- **Overview:** the problem, audience, and project context.
- **My contribution:** the work the user actually did, when known.
- **Approach:** the important decisions and how the project works.
- **Results:** supported outcomes, with units and evaluation context for numbers.

Omit unsupported sections. Use an honest description of an experiment or prototype when no measured outcome is available. Keep enough detail to explain the work; do not pad every project to a fixed length or turn a research paper into an unsupported personal success story. Preserve relevant existing links and supported details as new material arrives.

Use the existing fields only: `title`, `collection`, `secondaryCollection`, `order`, `draft`, `summary`, `category`, `tags`, `art`, `cover`, `links`, and `note`. Do not add fields such as `gallery`, `pdf`, or `sections`; extra fields fail validation. Inline images and additional sections belong in the Markdown body.

`collection` is the primary home. `secondaryCollection` is optional and must differ from it. `category` is the small descriptive label, not a collection selector. The same page and story appear in both collections automatically. Keep existing membership unless the request or new evidence supports a change.

Remove or revise an old résumé-only note when new evidence makes it inaccurate. Do not change the homepage, scene, styling, or content system to accommodate ordinary project content.

## 4. Add assets and resources

Place assets intended for visitors in `public/projects/<slug>/`, using stable lowercase filenames such as `cover.jpg`, `prototype.png`, and `case-study.pdf`. Website paths omit `public`, for example `/projects/kalakriti/cover.jpg`.

Use supplied project imagery when suitable. Preserve diagrams and text-heavy images without destructive cropping; use `fit: contain` when necessary. Check image size and readability before adding large source images. A PDF page can be rendered as an image when it is a useful, readable project figure; do not silently recreate it with generated imagery.

Treat an uploaded PDF as evidence for the page. Make the original downloadable when the user requests that or has identified it as a resource to share. If that intent is unclear, update the supported page content and ask only about sharing the original. Do not place reference-only documents in `public/`: every file there is publishable, including files attached to drafts.

For a cover and resource buttons, follow `content/README.md`. For images within the story, use ordinary Markdown, for example:

```markdown
![The painting interface showing brush controls and a 3D canvas](/projects/kalakriti/interface.png)
```

Choose useful link labels such as “Read the paper”, “View source code”, or “Try the demo”. Use the actual supplied or verified URL. Link videos externally unless a separate change requests embedded playback.

## 5. Record, verify, and finish

Update the target entry in `PROJECT-SOURCES.md` with the source filenames or URLs, page references behind key claims, selected assets, changes made, and unresolved questions. Note whether the website update is pending, saved locally, or published. Keep private local paths, editing notes, and unresolved questions out of the visitor-facing story.

For changed website content or assets:

1. Run `npm run content:check`. Fix invalid fields and missing asset references.
2. Run `npm run build`. Content validation also runs during the build.
3. When images or layout changed, inspect the affected project at desktop and narrow widths in the available preview. Check cover crops, inline-image readability, resource buttons, and the same project under its secondary moon. If preview access is unavailable, report that limit accurately.
4. Publish through GitHub Pages by committing and pushing reviewed changes to `main` in `SiliconAlchemist.github.io`, unless the user requests a draft, a batch held for review, or local-only work. Verify the GitHub Actions deployment and live site. Do not use the former Cloudflare repository or Sites. Keep `PROJECT-SOURCES.md` local and ignored; never commit internal source notes to this public repository.
5. Give a short completion message naming the updated project, meaningful changes, publication status, and any fact still needing input.

For documentation-only preparation, review the documentation diff; no site build or publication is needed. If the user sends more material for the same project later, repeat this workflow against its current page and source record, preserving earlier supported work.

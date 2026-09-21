# Editing your portfolio

Edit the files in this folder to change the website. You do not need to edit React or TypeScript for normal content updates.

When updating from supplied PDFs, images, or links, follow [the project update workflow](PROJECT-UPDATES.md). Keep any internal source record in the ignored local `PROJECT-SOURCES.md`; it is intentionally not published in this repository.

## Where everything lives

| File or folder | Content |
| --- | --- |
| `site.yaml` | Homepage, brand, contact, social links, footer, button labels, page title, favicon, optional logo and intro image |
| `collections.yaml` | Dev / Design / Data headings, descriptions, colors, moon captions |
| `artwork.yaml` | Text on the existing decorative project covers |
| `projects/*.md` | One project per file: tile, full story, cover, tags, links |
| `../public/projects/` | Your project images and PDFs |
| `../public/images/` | Shared images such as a logo or portrait |

## Add a project

1. Copy `projects/_template.md` into the **same folder** and give it a unique lowercase filename, such as `projects/my-new-project.md`.
2. Fill in the fields above the second `---` line.
3. Choose `collection: dev`, `collection: design`, or `collection: data` as the primary home. Optionally add `secondaryCollection` with a different collection to show the same project under a second moon.
4. Set `order` to a number. Lower numbers appear first; ties sort by filename.
5. Write the story below the second `---` line. Add, rename, or remove sections as needed.
6. Add images and PDFs inside `public/`, then reference them as described below.
7. Change `draft: true` to `draft: false` when you want the project to appear.

Every published `.md` file directly in `projects/` creates a tile and its expanded view automatically. No registration list to update. Keep project files out of subfolders. Files whose names begin with `_` are ignored (including the template).

Drafts are excluded from the website's browser and server bundles. They must have valid opening fields, but their body and assets may be unfinished. **Files in `public/` are still publishable assets even when referenced only by a draft.** Keep confidential draft assets outside `public/`.

To edit an existing project, open its file. To hide it, set `draft: true`; to remove it, delete its Markdown file. Removing a project does not delete its assets. Changing its collection moves the tile to that moon. A `secondaryCollection` shows the same tile and story under another moon; remove the field to return to one moon.

## Project fields

| Field | Meaning |
| --- | --- |
| `title` | Tile and expanded-view title |
| `summary` | Short tile description, repeated below the expanded-view title |
| `category` | Small label above the cover |
| `tags` | A list of technologies, disciplines, or themes; `[]` hides the tags |
| `collection` | `dev`, `design`, or `data` |
| `secondaryCollection` | Optional second collection, different from `collection` |
| `order` | Display position; defaults to 100 |
| `draft` | `true` hides the project; defaults to `false` |
| `cover` | Optional image shown on the tile and at the top of the expanded view |
| `art` | Decorative fallback when no cover is set: `code`, `terminal`, `grid`, `app`, `scatter`, `type`, or `chart` |
| `links` | Any number of resource buttons; `[]` means none |
| `note` | Optional small note at the bottom; omit to show none |

## Images and PDFs

Make an asset folder for your project, for example `public/projects/kalakriti/`. Put the actual files there, then use their website path **without `public`**:

```yaml
cover:
  src: /projects/kalakriti/cover.jpg
  alt: A painting created inside Kalakriti
  fit: cover
  position: 50% 50%
```

`fit: cover` fills the tile and may crop edges. Use `contain` to show the whole image. `position` sets the crop focus using two percentages (horizontal then vertical), such as `50% 25%`. Supported local images: JPG, PNG, WebP, GIF, SVG, and AVIF. Use lowercase filenames with hyphens to avoid path mistakes. A landscape cover around 1600 × 1000 is a useful starting size.

The same `src`, `alt`, `fit`, and `position` fields work for `brand.image` and `intro.image` in `site.yaml`. The logo replaces the sparkle icon; the intro image appears below the homepage description. The favicon path is in `site.yaml` too.

The island is a 3D Blender model, not a flat background image. Its model path is configurable under `scene.model`; changing its geometry or embedded painted textures still uses the Blender workflow in the main README. The three moon IDs (`dev`, `design`, `data`) remain fixed because they correspond to that scene.

Local paths are checked against files in `public/`. Full HTTPS image URLs also work, but local files avoid relying on another host. External URLs are checked for valid structure, not fetched to verify availability.

## Multiple links

Use a separate entry for every resource. The following placeholders must be replaced with your own URLs and existing files:

```yaml
links:
  - label: View GitHub repository
    url: https://github.com/YOUR-USERNAME/YOUR-REPOSITORY
  - label: View on Behance
    url: https://www.behance.net/gallery/YOUR-PROJECT-ID/YOUR-PROJECT
  - label: Read project PDF
    url: /projects/kalakriti/case-study.pdf
```

Links open in a new tab by default. Add `newTab: false` below a link's URL to open it in the current tab. The shared social links and contact link in `site.yaml` use the same fields. PDF buttons open the file using the visitor's browser PDF behavior.

## Write the expanded view in Markdown

Below the closing `---`, use ordinary paragraphs and Markdown:

```markdown
## My contribution

I designed **the interaction model** and built the prototype.

- First highlight
- Second highlight

![An early version of the painting interface](/projects/kalakriti/prototype.jpg)

[Read the full case study](/projects/kalakriti/case-study.pdf)

> A short quote or reflection.
```

Headings, lists, bold, italics, images, links, tables, and fenced code blocks are supported. Start headings with `##`; the project title already supplies the main heading. Images need meaningful text inside `![...]`. Body links open in new tabs. Interactive embeds, scripts, arbitrary HTML styles, and JavaScript are not supported; HTML is sanitized when the site is built.

## YAML tips

- Keep indentation consistent: two spaces, not tabs.
- Put text containing `: ` or ` #` inside quotes, for example `title: "Kalakriti: painting in 3D"`.
- Use `[]` for an empty list. Remove optional image blocks entirely when unused.
- For longer text, use `>-` followed by indented lines to combine them into one paragraph, or `|-` to preserve line breaks.
- Unknown fields are reported as errors to catch spelling mistakes.

## Preview and publish

From the portfolio folder:

```sh
npm run dev
```

Open the local address shown in the terminal. Saving, adding, deleting, or renaming content files refreshes the preview automatically. Changes to a referenced asset also refresh it. Drafts remain hidden in previews; temporarily set `draft: false` to review one, then restore it before publishing if needed.

Check all content without starting the website:

```sh
npm run content:check
```

Errors identify the file and field to fix, including missing local images or PDFs. A production build also runs these checks automatically. Use `npm run build` to build locally. Saving a file or building locally does **not** change the hosted website; after review, commit and push to `main` in `SiliconAlchemist.github.io` to trigger GitHub Pages publishing.

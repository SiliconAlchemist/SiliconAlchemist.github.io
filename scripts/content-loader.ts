import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, relative, sep, extname } from 'node:path';
import { parseDocument } from 'yaml';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import {
  artworkSchema,
  collectionsSchema,
  projectSchema,
  siteSchema,
} from './content-schema.ts';
import type { PortfolioContent, Project } from './content-schema.ts';
import type { ZodType } from 'zod';

function parseYaml(source: string, file: string): unknown {
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length)
    throw new Error(
      `${file}: ${document.errors.map((e) => e.message).join('\n')}`,
    );
  return document.toJS({ maxAliasCount: 50 });
}

function validate<T>(schema: ZodType<T>, value: unknown, file: string): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new Error(
      `${file}:\n${result.error.issues.map((i) => `  ${i.path.join('.') || 'content'}: ${i.message}`).join('\n')}`,
    );
  return result.data;
}

/** Public paths are rooted at public/. Never include private workspace files. */
export function checkUrl(
  url: string,
  root: string,
  context: string,
  image = false,
): void {
  const fail = (message: string): never => {
    throw new Error(`${context}: ${message} (${url})`);
  };
  if (/^[\s]|[\s]$|[\\\u0000-\u001f\u007f]/.test(url)) fail('Invalid URL');
  if (url.startsWith('/') && !url.startsWith('//')) {
    let pathname: string;
    try {
      pathname = decodeURIComponent(url.split(/[?#]/)[0]);
    } catch {
      fail('Invalid URL encoding');
    }
    const publicRoot = resolve(root, 'public');
    const target = resolve(publicRoot, `.${pathname!}`);
    const local = relative(publicRoot, target);
    if (
      local.startsWith(`..${sep}`) ||
      local === '..' ||
      local.includes(':') ||
      pathname!.includes('\\')
    )
      fail('Path must stay inside public/');
    if (!existsSync(target) || !statSync(target).isFile())
      fail(`Missing file: public${pathname!}`);
    if (
      image &&
      !['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'].includes(
        extname(target).toLowerCase(),
      )
    )
      fail('Expected an image file');
    return;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    fail('Use a full https:// URL or a /path inside public/');
  }
  const allowed = image ? ['https:'] : ['https:', 'http:', 'mailto:', 'tel:'];
  if (
    !allowed.includes(parsed!.protocol) ||
    parsed!.username ||
    parsed!.password
  )
    fail('Unsupported URL');
}

function checkReferences(value: unknown, root: string, context: string): void {
  if (Array.isArray(value))
    value.forEach((item, i) => checkReferences(item, root, `${context}.${i}`));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (
        typeof item === 'string' &&
        ['url', 'src', 'favicon', 'model'].includes(key)
      )
        checkUrl(
          item,
          root,
          `${context}.${key}`,
          key === 'src' || key === 'favicon',
        );
      else checkReferences(item, root, `${context}.${key}`);
    }
  }
}

export function renderMarkdown(
  body: string,
  root: string,
  file: string,
): string {
  const html = marked.parse(body, { async: false, gfm: true });
  return sanitizeHtml(html, {
    allowedTags: [
      'p',
      'br',
      'hr',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      'del',
      'blockquote',
      'pre',
      'code',
      'a',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'loading'],
      code: ['class'],
      ol: ['start'],
    },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowProtocolRelative: false,
    transformTags: {
      h1: 'h2',
      a: (_tag, attrs) => {
        if (attrs.href) checkUrl(attrs.href, root, `${file}: Markdown link`);
        return {
          tagName: 'a',
          attribs: { ...attrs, target: '_blank', rel: 'noopener noreferrer' },
        };
      },
      img: (_tag, attrs) => {
        if (!attrs.src || !attrs.alt?.trim())
          throw new Error(
            `${file}: Every Markdown image needs a source and descriptive alt text`,
          );
        checkUrl(attrs.src, root, `${file}: Markdown image`, true);
        return { tagName: 'img', attribs: { ...attrs, loading: 'lazy' } };
      },
    },
  });
}

export function loadContent(root = process.cwd()): PortfolioContent {
  const read = <T>(name: string, schema: ZodType<T>) => {
    const file = `content/${name}.yaml`;
    const value = validate(
      schema,
      parseYaml(readFileSync(resolve(root, file), 'utf8'), file),
      file,
    );
    checkReferences(value, root, file);
    return value;
  };
  const site = read('site', siteSchema);
  const artwork = read('artwork', artworkSchema);
  const definitions = read('collections', collectionsSchema);
  const collections = Object.fromEntries(
    Object.entries(definitions).map(([id, data]) => [
      id,
      { ...data, projects: [] as Project[] },
    ]),
  ) as PortfolioContent['collections'];
  for (const filename of readdirSync(
    resolve(root, 'content/projects'),
  ).sort()) {
    if (!filename.endsWith('.md') || filename.startsWith('_')) continue;
    const file = `content/projects/${filename}`;
    const id = filename.slice(0, -3);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
      throw new Error(
        `${file}: Use lowercase words separated by hyphens for the filename`,
      );
    const source = readFileSync(resolve(root, file), 'utf8').replace(
      /^\uFEFF/,
      '',
    );
    const match = source.match(
      /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/,
    );
    if (!match)
      throw new Error(
        `${file}: Start with YAML fields between two --- lines, followed by Markdown`,
      );
    const data = validate(projectSchema, parseYaml(match[1], file), file);
    // Drafts are excluded from all browser and server output; their assets can be unfinished.
    if (data.draft) continue;
    checkReferences(data, root, file);
    if (!match[2].trim())
      throw new Error(
        `${file}: Add a project story below the closing --- line`,
      );
    const bodyHtml = renderMarkdown(match[2], root, file);
    const project = { ...data, id, bodyHtml };
    collections[data.collection].projects.push(project);
    if (data.secondaryCollection)
      collections[data.secondaryCollection].projects.push(project);
  }
  for (const collection of Object.values(collections))
    collection.projects.sort(
      (a, b) => a.order - b.order || a.id.localeCompare(b.id),
    );
  return { site, artwork, collections };
}

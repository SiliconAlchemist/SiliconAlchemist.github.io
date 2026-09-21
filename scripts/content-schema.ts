import { z } from 'zod';

const text = z.string().trim().min(1);
export const worldSchema = z.enum(['dev', 'design', 'data']);
export const linkSchema = z
  .object({
    label: text,
    url: text,
    newTab: z.boolean().default(true),
  })
  .strict();
export const imageSchema = z
  .object({
    src: text,
    alt: text,
    fit: z.enum(['cover', 'contain']).default('cover'),
    position: z
      .string()
      .regex(/^(?:100|\d{1,2})% (?:100|\d{1,2})%$/)
      .default('50% 50%'),
  })
  .strict();
export const projectSchema = z
  .object({
    title: text,
    collection: worldSchema,
    secondaryCollection: worldSchema.optional(),
    order: z.number().int().nonnegative().default(100),
    draft: z.boolean().default(false),
    summary: text,
    category: text,
    tags: z.array(text).default([]),
    art: z
      .enum(['code', 'terminal', 'grid', 'app', 'scatter', 'type', 'chart'])
      .default('app'),
    cover: imageSchema.optional(),
    links: z.array(linkSchema).default([]),
    note: z.string().default(''),
  })
  .strict()
  .refine((project) => project.secondaryCollection !== project.collection, {
    path: ['secondaryCollection'],
    message: 'Choose a different collection from the primary one',
  });
const collectionSchema = z
  .object({
    label: text,
    title: text,
    description: text,
    number: text,
    color: z.string().regex(/^#[\da-fA-F]{6}$/),
    moonCaption: text,
    exploreLabel: text,
    orbitLabel: text,
  })
  .strict();
export const collectionsSchema = z
  .object({
    dev: collectionSchema,
    design: collectionSchema,
    data: collectionSchema,
  })
  .strict();
export const siteSchema = z
  .object({
    metadata: z
      .object({ title: text, description: text, language: text, favicon: text })
      .strict(),
    brand: z
      .object({
        name: text,
        suffix: z.string(),
        returnLabel: text,
        image: imageSchema.optional(),
      })
      .strict(),
    contact: linkSchema,
    intro: z
      .object({
        eyebrow: text,
        title: text,
        emphasis: z.string(),
        description: text,
        image: imageSchema.optional(),
      })
      .strict(),
    caption: z.object({ label: text, text }).strict(),
    navigation: z
      .object({
        label: text,
        back: text,
        exploring: text,
        titleSuffix: z.string(),
        selectedWork: text,
        selectedWorks: text,
        empty: text,
      })
      .strict(),
    links: z.array(linkSchema),
    footer: z
      .object({ beforeStar: text, afterStar: text, home: text })
      .strict(),
    controls: z
      .object({
        dayMode: text,
        day: text,
        night: text,
        soundOn: text,
        soundOff: text,
        resume: text,
        pause: text,
        close: text,
      })
      .strict(),
    scene: z
      .object({
        model: text,
        accessibleDescription: text,
        hint: text,
        zoomGroup: text,
        zoomOut: text,
        zoomIn: text,
        zoomLevel: text,
        resetLabel: text,
        reset: text,
        loading: text,
        unavailable: text,
      })
      .strict(),
  })
  .strict();
export const artworkSchema = z
  .object({
    code: z.object({ filename: text, snippet: text, status: text }).strict(),
    type: z.object({ eyebrow: text, sample: text, caption: text }).strict(),
    chart: z.object({ eyebrow: text, title: text }).strict(),
    grid: z
      .object({
        eyebrow: text,
        title: text,
        buttons: z.array(text),
        colors: z.array(z.string().regex(/^#[\da-fA-F]{6}$/)),
      })
      .strict(),
    terminal: z
      .object({ path: text, command: text, output: text, prompt: text })
      .strict(),
    scatter: z.object({ eyebrow: text, caption: text }).strict(),
    app: z.object({ eyebrow: text, title: text }).strict(),
  })
  .strict();

export type World = z.infer<typeof worldSchema>;
export type ContentLink = z.infer<typeof linkSchema>;
export type ContentImage = z.infer<typeof imageSchema>;
export type Project = z.infer<typeof projectSchema> & {
  id: string;
  bodyHtml: string;
};
export type PortfolioContent = {
  site: z.infer<typeof siteSchema>;
  artwork: z.infer<typeof artworkSchema>;
  collections: {
    [K in World]: z.infer<typeof collectionSchema> & { projects: Project[] };
  };
};

import { loadContent } from './content-loader.ts';

try {
  const { collections } = loadContent();
  const counts = Object.values(collections).map(
    (c) => `${c.label}: ${c.projects.length}`,
  );
  console.log(
    `Content is valid. Published projects — ${counts.join(', ')}. Local links and assets exist.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

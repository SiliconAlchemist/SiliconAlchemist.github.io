import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { loadContent } from './content-loader.ts';

/** Compile authored files into portable data; hosted code never reads the filesystem. */
export function portfolioContent(): Plugin {
  const moduleId = 'virtual:portfolio-content';
  const resolvedId = `\0${moduleId}`;
  let root = process.cwd();
  return {
    name: 'portfolio-content',
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      if (id === moduleId) return resolvedId;
    },
    load(id) {
      if (id !== resolvedId) return;
      const data = loadContent(root);
      return `const content = ${JSON.stringify(data).replace(/</g, '\\u003c')}; export const { site, artwork, collections } = content;`;
    },
    configureServer(server) {
      const directories = [resolve(root, 'content'), resolve(root, 'public')];
      server.watcher.add(directories);
      const update = (_event: string, file: string) => {
        if (
          !directories.some((directory) =>
            file
              .replaceAll('\\', '/')
              .startsWith(`${directory.replaceAll('\\', '/')}/`),
          )
        )
          return;
        // All Vinext environments consume the same content, including server metadata.
        for (const environment of Object.values(server.environments)) {
          const module = environment.moduleGraph.getModuleById(resolvedId);
          if (module) environment.moduleGraph.invalidateModule(module);
        }
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('all', update);
      server.httpServer?.once('close', () => server.watcher.off('all', update));
    },
  };
}

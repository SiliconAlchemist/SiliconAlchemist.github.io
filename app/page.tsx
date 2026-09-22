'use client';
import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  ArrowLeft,
  Sparkles,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { site, artwork, collections } from 'virtual:portfolio-content';
import type {
  World,
  Project,
  ContentImage,
  ContentLink,
} from '../scripts/content-schema';
const NightScene = lazy(() => import('./scene'));

export default function Home() {
  const [world, setWorld] = useState<World | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [day, setDay] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const gain = useRef<GainNode | null>(null);

  useEffect(() => {
    setPaused(matchMedia('(prefers-reduced-motion: reduce)').matches);
    return () => {
      void audio.current?.close();
    };
  }, []);
  useEffect(() => {
    const sync = () => {
      const id = location.hash.slice(1);
      setWorld(Object.hasOwn(collections, id) ? (id as World) : null);
      setProject(null);
    };
    sync();
    addEventListener('popstate', sync);
    addEventListener('hashchange', sync);
    return () => {
      removeEventListener('popstate', sync);
      removeEventListener('hashchange', sync);
    };
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !project) go(null);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [project]);
  useEffect(() => {
    if (world) {
      const timer = setTimeout(
        () => title.current?.focus(),
        paused ? 20 : 1100,
      );
      return () => clearTimeout(timer);
    }
  }, [world, paused]);

  function go(id: World | null) {
    setWorld(id);
    setProject(null);
    history.pushState({}, '', id ? `#${id}` : location.pathname);
  }
  async function toggleSound() {
    if (!audio.current) {
      const ctx = new AudioContext();
      audio.current = ctx;
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      gain.current = master;
      [110, 164.81, 220, 277.18].forEach((hz, i) => {
        const oscillator = ctx.createOscillator(),
          volume = ctx.createGain();
        oscillator.frequency.value = hz;
        volume.gain.value = 0.12 / (i + 1);
        oscillator.connect(volume);
        volume.connect(master);
        oscillator.start();
      });
    }
    await audio.current.resume();
    gain.current?.gain.setTargetAtTime(
      sound ? 0 : 0.16,
      audio.current.currentTime,
      0.6,
    );
    setSound(!sound);
  }

  const c = world ? collections[world] : null;
  return (
    <main
      className={`universe ${world ? 'is-exploring' : ''} ${paused ? 'motion-paused' : ''} ${day ? 'is-day' : ''}`}
      style={{ '--world-color': c?.color || '#c9bafa' } as React.CSSProperties}
    >
      <Suspense fallback={null}>
        <NightScene
          day={day}
          world={world}
          paused={paused}
          onSelect={go}
          onReady={() => setReady(true)}
          onError={() => {
            setFailed(true);
            setReady(true);
          }}
        />
      </Suspense>
      <div className="vignette" />
      <header className="site-header">
        <button
          className="brand"
          onClick={() => go(null)}
          aria-label={site.brand.returnLabel}
        >
          {site.brand.image ? (
            <ContentPicture image={site.brand.image} className="brand-image" />
          ) : (
            <Sparkles size={25} strokeWidth={1.3} />
          )}
          <span>
            {site.brand.name}
            <span className="brand-dot">{site.brand.suffix}</span>
          </span>
        </button>
        <nav aria-label={site.navigation.label}>
          {(Object.keys(collections) as World[]).map((id) => (
            <button
              key={id}
              className={world === id ? 'active' : ''}
              onClick={() => go(id)}
            >
              <span style={{ background: collections[id].color }} />
              {collections[id].label}
            </button>
          ))}
        </nav>
        <ContentAnchor link={site.contact} className="header-note" />
      </header>
      {!world && (
        <>
          <section className="intro">
            <p className="eyebrow">{site.intro.eyebrow}</p>
            <h1>
              {site.intro.title} <em>{site.intro.emphasis}</em>
            </h1>
            <p>{site.intro.description}</p>
            {site.intro.image && (
              <ContentPicture
                image={site.intro.image}
                className="intro-image"
              />
            )}
          </section>
          {(!ready || failed) && (
            <div className="scene-status" role="status">
              {failed ? site.scene.unavailable : site.scene.loading}
            </div>
          )}
          <div className="landscape-caption">
            <span className="caption-line" />
            <div>
              <span className="eyebrow">{site.caption.label}</span>
              <p>{site.caption.text}</p>
            </div>
          </div>
        </>
      )}
      {c && (
        <section
          className="collection"
          key={world}
          aria-labelledby="collection-title"
        >
          <button className="back-link" onClick={() => go(null)}>
            <ArrowLeft size={16} />
            {site.navigation.back}
          </button>
          <div className="collection-heading">
            <div>
              <p className="eyebrow">
                {site.navigation.exploring} {c.label.toUpperCase()}
              </p>
              <h1 ref={title} tabIndex={-1} id="collection-title">
                {c.title}
                <span>{site.navigation.titleSuffix}</span>
              </h1>
              <p>{c.description}</p>
            </div>
            <span className="project-count">
              {String(c.projects.length).padStart(2, '0')}{' '}
              {c.projects.length === 1
                ? site.navigation.selectedWork
                : site.navigation.selectedWorks}
            </span>
          </div>
          <div className="project-grid">
            {c.projects.map((p, i) => (
              <button
                className="project-card"
                key={p.id}
                onClick={() => setProject(p)}
                style={{ '--i': Math.min(i, 6) } as React.CSSProperties}
              >
                <div
                  className={`project-art art-${p.art} ${p.cover ? 'has-cover' : ''}`}
                >
                  {p.cover ? (
                    <ContentPicture
                      image={p.cover}
                      className="project-cover"
                      crop
                      lazy
                    />
                  ) : (
                    <ProjectArt type={p.art} />
                  )}
                  <span className="concept-label">{p.category}</span>
                  <span className="card-arrow">
                    <ArrowUpRight size={22} />
                  </span>
                </div>
                <div className="card-copy">
                  <div className="card-meta">{p.tags.join(' / ')}</div>
                  <h2>{p.title}</h2>
                  <p>{p.summary}</p>
                </div>
              </button>
            ))}
          </div>
          {!c.projects.length && (
            <p className="empty-collection">{site.navigation.empty}</p>
          )}
          <div className="collection-links">
            {site.links.map((link, i) => (
              <ContentAnchor key={i} link={link} />
            ))}
          </div>
        </section>
      )}
      <footer className="site-footer">
        <div className="scene-controls">
          <button
            className="day-toggle"
            role="switch"
            aria-checked={day}
            aria-label={site.controls.dayMode}
            onClick={() => setDay(!day)}
          >
            {day ? <Sun size={16} /> : <Moon size={16} />}
            <span>{day ? site.controls.day : site.controls.night}</span>
            <span className="day-toggle-track" aria-hidden="true">
              <i />
            </span>
          </button>
          <span className="control-divider" />
          <button onClick={toggleSound} aria-pressed={sound}>
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>
              {sound ? site.controls.soundOn : site.controls.soundOff}
            </span>
          </button>
          <span className="control-divider" />
          <button
            onClick={() => setPaused(!paused)}
            aria-label={paused ? site.controls.resume : site.controls.pause}
            aria-pressed={paused}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </div>
        <span className="footer-center">
          {site.footer.beforeStar} <span>✦</span> {site.footer.afterStar}
        </span>
        <span className="footer-right">
          {c ? c.orbitLabel : site.footer.home}
          <span className="tiny-star">✧</span>
        </span>
      </footer>
      <Dialog
        open={!!project}
        onOpenChange={(open) => {
          if (!open) setProject(null);
        }}
      >
        <DialogContent
          className="project-dialog"
          closeLabel={site.controls.close}
        >
          {project && (
            <>
              <p className="eyebrow">
                {project.category} / {c?.label.toUpperCase()}
              </p>
              <DialogTitle className="dialog-title">
                {project.title}
              </DialogTitle>
              <DialogDescription className="dialog-description">
                {project.summary}
              </DialogDescription>
              <div className="dialog-tags">
                {project.tags.map((tag, i) => (
                  <span key={i}>{tag}</span>
                ))}
              </div>
              {project.cover && (
                <ContentPicture
                  image={project.cover}
                  className="dialog-cover"
                  crop
                />
              )}
              {/* HTML is compiled and sanitized by scripts/content-loader.ts. */}
              <div
                className="project-story"
                dangerouslySetInnerHTML={{ __html: project.bodyHtml }}
              />
              {project.links.length > 0 && (
                <div className="project-resources">
                  {project.links.map((link, i) => (
                    <ContentAnchor
                      key={i}
                      link={link}
                      className="project-visit"
                    />
                  ))}
                </div>
              )}
              {project.note && <p className="dialog-note">{project.note}</p>}
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ContentAnchor({
  link,
  className,
}: {
  link: ContentLink;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={link.url}
      target={link.newTab ? '_blank' : undefined}
      rel={link.newTab ? 'noopener noreferrer' : undefined}
    >
      {link.label}
      <ArrowUpRight size={16} aria-hidden="true" />
    </a>
  );
}

function ContentPicture({
  image,
  className,
  crop = false,
  lazy = false,
}: {
  image: ContentImage;
  className: string;
  crop?: boolean;
  lazy?: boolean;
}) {
  return (
    <img
      className={className}
      src={image.src}
      alt={image.alt}
      loading={lazy ? 'lazy' : 'eager'}
      style={{
        objectFit: crop ? 'cover' : image.fit,
        objectPosition: image.position,
      }}
    />
  );
}

function ProjectArt({ type }: { type: Project['art'] }) {
  if (type === 'code')
    return (
      <div className="mini-editor">
        <div className="editor-dots">
          ● ● ● <span>{artwork.code.filename}</span>
        </div>
        <pre>{artwork.code.snippet}</pre>
        <div className="editor-status">{artwork.code.status}</div>
      </div>
    );
  if (type === 'type')
    return (
      <div className="type-study">
        <span>{artwork.type.eyebrow}</span>
        <strong>
          {artwork.type.sample}
          <span>↗</span>
        </strong>
        <div>{artwork.type.caption}</div>
      </div>
    );
  if (type === 'chart')
    return (
      <div className="mini-chart">
        <span>{artwork.chart.eyebrow}</span>
        <strong>{artwork.chart.title}</strong>
        <div className="bars">
          {[23, 40, 31, 54, 43, 68, 59, 80, 72, 95, 86, 100].map(
            (height, i) => (
              <i key={i} style={{ height: `${height}%` }} />
            ),
          )}
        </div>
      </div>
    );
  if (type === 'grid')
    return (
      <div className="mini-system">
        <span>{artwork.grid.eyebrow}</span>
        <div className="swatches">
          {artwork.grid.colors.map((color, i) => (
            <i key={i} style={{ background: color }} />
          ))}
        </div>
        <strong>{artwork.grid.title}</strong>
        <div className="sample-buttons">
          {artwork.grid.buttons.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      </div>
    );
  if (type === 'terminal')
    return (
      <div className="mini-terminal">
        <span>{artwork.terminal.path}</span>
        <p>
          <b>➜</b> {artwork.terminal.command}
        </p>
        <p className="muted">{artwork.terminal.output}</p>
        <strong>{artwork.terminal.prompt}</strong>
      </div>
    );
  if (type === 'scatter')
    return (
      <div className="mini-scatter">
        <span>{artwork.scatter.eyebrow}</span>
        <div>
          {Array.from({ length: 45 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${8 + ((i * 37) % 85)}%`,
                bottom: `${10 + ((i * 17) % 70)}%`,
                opacity: 0.25 + (i % 5) * 0.15,
              }}
            />
          ))}
        </div>
        <strong>{artwork.scatter.caption}</strong>
      </div>
    );
  return (
    <div className="mini-grid">
      <span>{artwork.app.eyebrow}</span>
      <strong>{artwork.app.title}</strong>
      <div className="sample-panels">
        {[1, 2, 3].map((n) => (
          <div key={n}>
            <i />
            <span />
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Download,
  FileBox,
  ImageIcon,
  Layers,
  Loader2,
  Triangle,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScenePreview, type ScenePreviewHandle } from "@/components/scene-preview";
import { copy, type Lang } from "@/lib/i18n";
import {
  downloadBytes,
  packLegacyZip,
  parsePrisma,
  statsOf,
  toLegacy21,
  type ParsedPrisma,
} from "@/lib/prisma";
import { cn } from "@/lib/utils";

type Ready = {
  source: ParsedPrisma;
  legacy: ParsedPrisma;
  fileName: string;
};

function loadLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return window.localStorage.getItem("prismback-lang") === "en" ? "en" : "ru";
}

export function ConverterApp() {
  const [lang, setLang] = useState<Lang>(loadLang);
  const t = copy[lang];
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<Ready | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<ScenePreviewHandle>(null);

  function toggleLang() {
    const next = lang === "ru" ? "en" : "ru";
    setLang(next);
    window.localStorage.setItem("prismback-lang", next);
  }

  async function ingest(file: File) {
    setBusy(true);
    setError(null);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const source = parsePrisma(buf, file.name);
      const legacy = toLegacy21(source);
      setReady({ source, legacy, fileName: file.name });
    } catch (err) {
      setReady(null);
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  async function ingestDemo() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/samples/demo-335.prisma");
      if (!res.ok) throw new Error(t.error);
      const buf = new Uint8Array(await res.arrayBuffer());
      const source = parsePrisma(buf, "Новый проект 1.prisma");
      const legacy = toLegacy21(source);
      setReady({ source, legacy, fileName: "Новый проект 1.prisma" });
    } catch (err) {
      setReady(null);
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  async function onDownload() {
    if (!ready) return;
    setBusy(true);
    try {
      let shot: Uint8Array | null = null;
      try {
        shot = (await previewRef.current?.capturePng()) ?? null;
      } catch {
        shot = null;
      }
      const zip = packLegacyZip(ready.legacy, shot);
      downloadBytes(zip, `${ready.legacy.name} 2.1.prisma`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  const stats = ready ? statsOf(ready.legacy) : null;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="pointer-events-none fixed inset-0 ambient-wash" aria-hidden="true" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 pb-2 pt-5 sm:px-8 sm:pt-8">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-sm border border-border bg-elevated">
            <FileBox className="size-4 text-accent" strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-display text-sm font-semibold tracking-tight">{t.brand}</p>
            <p className="font-mono text-xs uppercase tracking-caps text-subtle">{t.tag}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleLang} className="font-mono tracking-wide">
          {t.lang}
        </Button>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-8 sm:pt-10">
        <section className="max-w-2xl">
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-display text-balance sm:text-5xl">
            {t.headline}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted sm:text-base">{t.sub}</p>
        </section>

        {!ready && (
          <section className="mt-10">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void ingest(file);
              }}
              className={cn(
                "flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors duration-200",
                drag ? "border-accent bg-elevated" : "border-border bg-surface hover:border-border-strong",
              )}
            >
              {busy ? (
                <Loader2 className="size-8 animate-spin text-muted" />
              ) : (
                <Upload className="size-8 text-muted" strokeWidth={1.5} />
              )}
              <div>
                <p className="font-display text-lg font-medium">{busy ? t.converting : t.dropTitle}</p>
                <p className="mt-1 text-sm text-muted">{t.dropHint}</p>
              </div>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".prisma,application/zip"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void ingest(file);
                e.target.value = "";
              }}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => void ingestDemo()} disabled={busy}>
                {t.demo}
              </Button>
              {error && (
                <p className="flex items-start gap-2 text-sm text-danger">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </p>
              )}
            </div>
          </section>
        )}

        {ready && stats && (
          <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)]">
            <div className="flex min-h-[320px] flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:min-h-[420px] sm:p-4">
              <div className="flex items-center justify-between gap-3 px-1">
                <p className="text-sm font-medium">{t.preview}</p>
                <span className="font-mono text-xs text-subtle">{ready.legacy.name}</span>
              </div>
              <div className="min-h-0 flex-1">
                <ScenePreview ref={previewRef} project={ready.legacy} hint={t.orbit} />
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-caps text-subtle">{t.ready}</p>
                <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">{ready.legacy.name}</h2>
                <p className="mt-1 font-mono text-xs text-muted">
                  {ready.source.kind === "2.1" ? t.already21 : `${t.source} Prisma 3.3.5`}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-2">
                <Stat icon={Box} label={t.objects} value={stats.objects} />
                <Stat icon={Layers} label={t.meshes} value={stats.meshes} />
                <Stat icon={ImageIcon} label={t.textures} value={stats.textures} />
                <Stat icon={Triangle} label={t.triangles} value={stats.triangles} />
              </dl>

              {ready.source.kind === "2.1" && (
                <p className="rounded-md bg-elevated px-3 py-2 text-sm text-muted">{t.already21}</p>
              )}

              {ready.legacy.warnings.length > 0 && (
                <ul className="space-y-1.5 text-sm text-warn">
                  {ready.legacy.warnings.slice(0, 4).map((w) => (
                    <li key={w} className="flex gap-2">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto flex flex-col gap-2">
                <Button size="lg" onClick={() => void onDownload()} disabled={busy} className="w-full">
                  {busy ? <Loader2 className="animate-spin" /> : <Download />}
                  {t.download}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setReady(null);
                    setError(null);
                  }}
                >
                  {t.again}
                </Button>
              </div>
            </div>
          </section>
        )}

        <section className="mt-16 grid gap-10 border-t border-border pt-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-lg font-semibold">{t.howTitle}</h2>
            <ol className="mt-4 space-y-3">
              {t.how.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span className="font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-pretty">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">{t.noteTitle}</h2>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-muted">{t.noteBody}</p>
            <p className="mt-4 flex items-center gap-2 text-xs uppercase tracking-caps text-subtle">
              3.3.5
              <ArrowRight className="size-3" />
              2.1 Legacy
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Box;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md bg-elevated px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-subtle">
        <Icon className="size-3.5" strokeWidth={1.75} />
        <dt className="text-xs uppercase tracking-caps">{label}</dt>
      </div>
      <dd className="mt-1 font-mono text-lg tabular-nums">{value.toLocaleString()}</dd>
    </div>
  );
}

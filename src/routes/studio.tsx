import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  deleteAnalisis,
  deleteEdukasi,
  founderLogin,
  founderPing,
  listAnalisisStudio,
  listEdukasi,
  type Accent,
  type AnalisisItem,
  type AnalisisStatus,
  type EdukasiItem,
  type EduLevel,
  saveAnalisis,
  saveEdukasi,
} from "@/lib/content";
import { deleteNews, listNews, saveNews, type NewsItem, type NewsThumb } from "@/lib/news";
import { formatIdDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Archive,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Newspaper,
  PenLine,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/studio")({
  component: StudioPage,
  head: () => ({ meta: [{ title: "Producer Studio | Birustock Indonesia" }] }),
});

const TOKEN_KEY = "bs-producer-token";
const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:8080";
type Tab = "dashboard" | "analisis" | "news" | "edukasi";

const STATUS_META: Record<AnalisisStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "badge-orange" },
  PUBLISHED: { label: "Published", className: "badge-green" },
  ARCHIVED: { label: "Archived", className: "badge-red" },
};

function StudioPage() {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [analisis, setAnalisis] = useState<AnalisisItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [edukasi, setEdukasi] = useState<EdukasiItem[]>([]);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!token) return;
    const [a, n, e] = await Promise.all([
      listAnalisisStudio({ data: { token } }),
      listNews(),
      listEdukasi(),
    ]);
    setAnalisis(a);
    setNews(n);
    setEdukasi(e);
  }

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setChecking(false);
      return;
    }
    founderPing({ data: { token: stored } })
      .then((res) => {
        if (res.ok) setToken(stored);
        else localStorage.removeItem(TOKEN_KEY);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (token) void refresh();
  }, [token]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await founderLogin({ data: { pin } });
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setPin("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <section className="py-24">
        <div className="container-site">
          <div className="skeleton h-28 w-full max-w-xl mx-auto" />
        </div>
      </section>
    );
  }

  if (!token) {
    return (
      <section className="py-16">
        <div className="container-site">
          <form
            onSubmit={onLogin}
            className="enter-up mx-auto max-w-md rounded-lg border border-line bg-surface p-8"
          >
            <p className="eyebrow">Producer Studio</p>
            <h1 className="mt-2 mb-2 text-2xl font-extrabold tracking-tight">Kelola Birustock</h1>
            <p className="mb-6 text-sm text-muted">
              Ruang kerja internal untuk membuat, menyimpan, meninjau, dan menerbitkan konten.
            </p>
            {error ? <p className="mb-3 text-sm text-accent-red">{error}</p> : null}
            <Field label="PIN Studio">
              <input
                id="pin"
                type="password"
                className="form-field"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            <button type="submit" className="btn btn-primary btn-block mt-4" disabled={busy}>
              {busy ? "Memeriksa…" : "Masuk ke Studio"}
            </button>
            <p className="mt-4 text-center text-xs text-subtle">Akses internal Producer.</p>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-64px)] py-6 max-md:py-4">
      <div className="container-site">
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="h-fit rounded-md border border-line bg-surface p-3 lg:sticky lg:top-20">
            <div className="px-2 pb-4 pt-1">
              <p className="eyebrow">Producer</p>
              <div className="mt-1 flex items-center gap-2 font-extrabold tracking-tight">
                <span className="size-2 rounded-full bg-accent-green" /> Studio Birustock
              </div>
            </div>
            <nav className="grid gap-1" aria-label="Navigasi Producer">
              <StudioNavButton icon={<LayoutDashboard size={16} />} active={tab === "dashboard"} onClick={() => setTab("dashboard")}>
                Dashboard
              </StudioNavButton>
              <StudioNavButton icon={<BarChart3 size={16} />} active={tab === "analisis"} onClick={() => setTab("analisis")}>
                Analisis
              </StudioNavButton>
              <StudioNavButton icon={<Newspaper size={16} />} active={tab === "news"} onClick={() => setTab("news")}>
                News
              </StudioNavButton>
              <StudioNavButton icon={<BookOpen size={16} />} active={tab === "edukasi"} onClick={() => setTab("edukasi")}>
                Edukasi
              </StudioNavButton>
            </nav>
            <div className="mt-4 border-t border-line pt-3">
              <a href={PUBLIC_SITE_URL} className="studio-nav-link">
                <ArrowLeft size={16} /> Website publik
              </a>
              <button
                type="button"
                className="studio-nav-link mt-1 w-full text-accent-red"
                onClick={() => {
                  localStorage.removeItem(TOKEN_KEY);
                  setToken(null);
                }}
              >
                <LogOut size={16} /> Keluar
              </button>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{tab === "analisis" ? "Analisis CMS" : "Content Command Center"}</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
                  {tab === "dashboard" ? "Producer Dashboard" : tab[0].toUpperCase() + tab.slice(1)}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted">
                  {tab === "dashboard"
                    ? "Pantau konten dan lanjutkan pekerjaan dari satu ruang kerja internal."
                    : "Kelola konten database-backed dengan alur draft dan publish yang jelas."}
                </p>
              </div>
              {tab === "analisis" ? (
                <button type="button" className="btn btn-primary" onClick={() => window.dispatchEvent(new Event("studio:new-analysis"))}>
                  <Plus size={16} /> Analisis Baru
                </button>
              ) : null}
            </div>

            {tab === "dashboard" ? (
              <Dashboard analisis={analisis} news={news} edukasi={edukasi} onSelect={setTab} />
            ) : null}
            {tab === "analisis" ? (
              <AnalisisStudio token={token} items={analisis} onChange={refresh} busy={busy} setBusy={setBusy} />
            ) : null}
            {tab === "news" ? (
              <NewsStudio token={token} items={news} onChange={refresh} busy={busy} setBusy={setBusy} />
            ) : null}
            {tab === "edukasi" ? (
              <EdukasiStudio token={token} items={edukasi} onChange={refresh} busy={busy} setBusy={setBusy} />
            ) : null}
          </main>
        </div>
      </div>
    </section>
  );
}

function Dashboard({
  analisis,
  news,
  edukasi,
  onSelect,
}: {
  analisis: AnalisisItem[];
  news: NewsItem[];
  edukasi: EdukasiItem[];
  onSelect: (tab: Tab) => void;
}) {
  const published = analisis.filter((item) => item.status === "PUBLISHED").length;
  const drafts = analisis.filter((item) => item.status === "DRAFT").length;
  const archived = analisis.filter((item) => item.status === "ARCHIVED").length;
  const recent = [...analisis].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5);

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<FileText size={18} />} label="Total Analisis" value={analisis.length} hint="Semua status" onClick={() => onSelect("analisis")} />
        <MetricCard icon={<Check size={18} />} label="Published" value={published} hint="Tayang ke user" onClick={() => onSelect("analisis")} />
        <MetricCard icon={<PenLine size={18} />} label="Draft" value={drafts} hint="Perlu dilanjutkan" onClick={() => onSelect("analisis")} />
        <MetricCard icon={<Archive size={18} />} label="Arsip" value={archived} hint="Tidak ditampilkan" onClick={() => onSelect("analisis")} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
        <section className="rounded-md border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Aktivitas Analisis</p>
              <p className="mt-1 text-xs text-subtle">Konten yang terakhir diperbarui.</p>
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => onSelect("analisis")}>
              Buka CMS <ChevronRight size={15} />
            </button>
          </div>
          <div className="divide-y divide-line rounded-sm border border-line">
            {recent.length ? (
              recent.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center gap-3 p-4">
                  <span className={cn("badge", STATUS_META[item.status].className)}>{STATUS_META[item.status].label}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.title || "Untitled"}</p>
                    <p className="mt-1 text-xs text-subtle">
                      {item.pair} · {item.timeframe} · diperbarui {formatIdDate(item.updatedAt.slice(0, 10))}
                    </p>
                  </div>
                  <span className="text-xs text-muted">{item.bias}</span>
                </div>
              ))
            ) : (
              <EmptyState text="Belum ada analisis." />
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <MiniMetric label="News" value={news.length} desc="Konten tersimpan" onClick={() => onSelect("news")} />
          <MiniMetric label="Edukasi" value={edukasi.length} desc="Materi belajar" onClick={() => onSelect("edukasi")} />
          <MiniMetric label="Workflow" value="Draft → Publish" desc="Alur utama Producer" />
        </section>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, hint, onClick }: { icon: ReactNode; label: string; value: number; hint: string; onClick: () => void }) {
  return (
    <button type="button" className="group rounded-md border border-line bg-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-primary" onClick={onClick}>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-sm bg-primary-soft p-2 text-primary">{icon}</span>
        <ChevronRight size={16} className="text-subtle transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div className="mt-5 text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="mt-1 text-sm font-semibold">{label}</div>
      <div className="mt-1 text-xs text-subtle">{hint}</div>
    </button>
  );
}

function MiniMetric({ label, value, desc, onClick }: { label: string; value: number | string; desc: string; onClick?: () => void }) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        {onClick ? <ChevronRight size={15} className="text-subtle" /> : null}
      </div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
      <div className="mt-1 text-xs text-subtle">{desc}</div>
    </>
  );
  if (!onClick) return <div className="rounded-md border border-line bg-surface p-4">{content}</div>;
  return <button type="button" className="rounded-md border border-line bg-surface p-4 text-left hover:border-primary" onClick={onClick}>{content}</button>;
}

function StudioNavButton({ icon, active, children, onClick }: { icon: ReactNode; active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={cn("studio-nav-link", active && "is-active")} onClick={onClick}>
      {icon} <span>{children}</span>
    </button>
  );
}

function ImageField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_180px]">
      <div>
        <Field label="URL gambar">
          <input
            className="form-field"
            value={value.startsWith("data:") ? "" : value}
            placeholder="https://…"
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
        <input
          type="file"
          accept="image/*"
          className="mt-2 block w-full text-xs text-subtle"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 350_000) {
              alert("Maksimal 350KB.");
              return;
            }
            const reader = new FileReader();
            reader.onload = () => onChange(String(reader.result ?? ""));
            reader.readAsDataURL(file);
          }}
        />
      </div>
      <div className="cover-frame h-28 overflow-hidden rounded-sm">
        {value ? <img src={value} alt="" className="size-full object-cover" /> : <div className="skeleton size-full" />}
      </div>
    </div>
  );
}

function AnalisisStudio({
  token,
  items,
  onChange,
  busy,
  setBusy,
}: {
  token: string;
  items: AnalisisItem[];
  onChange: () => Promise<void>;
  busy: boolean;
  setBusy: (v: boolean) => void;
}) {
  const empty = useMemo<{
    id?: number;
    pair: string;
    title: string;
    excerpt: string;
    body: string;
    imageUrl: string;
    accent: Accent;
    publishedAt: string;
    status: AnalisisStatus;
    timeframe: string;
    bias: "Bullish" | "Bearish" | "Netral";
    support: string;
    resistance: string;
    target: string;
    invalidation: string;
    scenarioBullish: string;
    scenarioBearish: string;
  }>(() => ({
    id: undefined,
    pair: "XAU/USD",
    title: "",
    excerpt: "",
    body: "",
    imageUrl: "",
    accent: "blue",
    publishedAt: new Date().toISOString().slice(0, 10),
    status: "DRAFT",
    timeframe: "H4",
    bias: "Bullish",
    support: "",
    resistance: "",
    target: "",
    invalidation: "",
    scenarioBullish: "",
    scenarioBearish: "",
  }), []);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = () => setForm(empty);
    window.addEventListener("studio:new-analysis", handler);
    return () => window.removeEventListener("studio:new-analysis", handler);
  }, [empty]);

  const filtered = items.filter((item) => `${item.pair} ${item.title} ${item.bias} ${item.status}`.toLowerCase().includes(query.toLowerCase()));
  const selected = form.id ? items.find((item) => item.id === form.id) : undefined;

  function fill(item: AnalisisItem) {
    setError("");
    setForm({
      id: item.id,
      pair: item.pair,
      title: item.title,
      excerpt: item.excerpt,
      body: item.body,
      imageUrl: item.imageUrl,
      accent: item.accent,
      publishedAt: item.publishedAt,
      status: item.status,
      timeframe: item.timeframe,
      bias: item.bias as "Bullish" | "Bearish" | "Netral",
      support: item.support,
      resistance: item.resistance,
      target: item.target,
      invalidation: item.invalidation,
      scenarioBullish: item.scenarioBullish,
      scenarioBearish: item.scenarioBearish,
    });
  }

  async function submit(nextStatus: AnalisisStatus) {
    setError("");
    setBusy(true);
    try {
      await saveAnalisis({ data: { token, ...form, status: nextStatus } });
      setForm({ ...form, status: nextStatus });
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!form.id || !confirm("Hapus analisis ini secara permanen?")) return;
    setBusy(true);
    try {
      await deleteAnalisis({ data: { token, id: form.id } });
      setForm(empty);
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)_300px]">
      <aside className="h-fit rounded-md border border-line bg-surface p-3 lg:sticky lg:top-20">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold">Semua Analisis</p>
            <p className="text-xs text-subtle">{items.length} konten</p>
          </div>
          <button type="button" className="icon-btn" aria-label="Buat analisis" onClick={() => setForm(empty)}>
            <Plus size={16} />
          </button>
        </div>
        <input className="form-field mb-3" placeholder="Cari pair atau judul…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="flex max-h-[66vh] flex-col gap-1 overflow-auto">
          {filtered.map((item) => (
            <button key={item.id} type="button" className={cn("rounded-sm border px-3 py-2.5 text-left", form.id === item.id ? "border-primary bg-primary-soft" : "border-line hover:border-primary")} onClick={() => fill(item)}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-primary">{item.pair}</span>
                <span className={cn("badge", STATUS_META[item.status].className)}>{STATUS_META[item.status].label}</span>
              </div>
              <div className="mt-1 line-clamp-2 text-sm font-semibold">{item.title || "Tanpa judul"}</div>
              <div className="mt-1 text-[11px] text-subtle">{item.timeframe} · {item.bias}</div>
            </button>
          ))}
          {!filtered.length ? <EmptyState text="Tidak ada hasil." /> : null}
        </div>
      </aside>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(form.status);
        }}
        className="min-w-0 rounded-md border border-line bg-surface p-5"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">{form.id ? `ID ${form.id}` : "Konten baru"}</p>
            <h2 className="mt-1 text-lg font-extrabold">{form.id ? "Edit Analisis" : "Buat Analisis"}</h2>
          </div>
          {form.id ? <span className={cn("badge", STATUS_META[form.status].className)}>{STATUS_META[form.status].label}</span> : null}
        </div>
        {error ? <p className="mb-4 rounded-sm border border-accent-red/30 bg-accent-red-bg px-3 py-2 text-sm text-accent-red">{error}</p> : null}

        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Pair">
            <input className="form-field" value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })} required />
          </Field>
          <Field label="Timeframe">
            <select className="form-field" value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })}>
              {["M15", "H1", "H4", "D1", "W1"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Bias">
            <select className="form-field" value={form.bias} onChange={(e) => setForm({ ...form, bias: e.target.value as typeof form.bias })}>
              {["Bullish", "Bearish", "Netral"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Tanggal tayang">
            <input className="form-field" type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} required />
          </Field>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Status workflow">
            <select className="form-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AnalisisStatus })}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
          <Field label="Aksen kartu">
            <select className="form-field" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value as Accent })}>
              <option value="blue">Biru</option>
              <option value="orange">Oranye</option>
              <option value="green">Hijau</option>
              <option value="red">Merah</option>
            </select>
          </Field>
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-subtle">Market Setup</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Support"><input className="form-field" value={form.support} onChange={(e) => setForm({ ...form, support: e.target.value })} placeholder="2,380 · 2,365" /></Field>
            <Field label="Resistance"><input className="form-field" value={form.resistance} onChange={(e) => setForm({ ...form, resistance: e.target.value })} placeholder="2,420 · 2,450" /></Field>
            <Field label="Target"><input className="form-field" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></Field>
            <Field label="Invalidation"><input className="form-field" value={form.invalidation} onChange={(e) => setForm({ ...form, invalidation: e.target.value })} /></Field>
          </div>
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-subtle">Content</p>
          <Field label="Judul"><input className="form-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Ringkasan"><textarea className="form-field mt-3" rows={3} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} required /></Field>
          <Field label="Market commentary"><textarea className="form-field mt-3" rows={9} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field>
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-subtle">Scenario</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Skenario Bullish"><textarea className="form-field" rows={5} value={form.scenarioBullish} onChange={(e) => setForm({ ...form, scenarioBullish: e.target.value })} /></Field>
            <Field label="Skenario Bearish"><textarea className="form-field" rows={5} value={form.scenarioBearish} onChange={(e) => setForm({ ...form, scenarioBearish: e.target.value })} /></Field>
          </div>
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <ImageField value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline" disabled={busy} onClick={() => void submit("DRAFT")}><Save size={15} /> Simpan Draft</button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void submit("PUBLISHED")}><Check size={15} /> Publish</button>
            {form.id ? <button type="button" className="btn btn-danger" disabled={busy} onClick={() => void remove()}><Trash2 size={15} /> Hapus</button> : null}
          </div>
          {selected?.status === "PUBLISHED" ? <a href={`${PUBLIC_SITE_URL}/analisis/${selected.slug}`} className="link-arrow">Lihat halaman publik <ChevronRight size={15} /></a> : null}
        </div>
      </form>

      <aside className="h-fit rounded-md border border-line bg-surface p-4 lg:sticky lg:top-20">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Live Preview</p>
            <p className="text-xs text-subtle">Cek hierarki konten sebelum publish.</p>
          </div>
          <span className="badge">Draft view</span>
        </div>
        <article className="overflow-hidden rounded-sm border border-line bg-bg">
          <div className="aspect-[16/9] bg-bg-alt">
            {form.imageUrl ? <img src={form.imageUrl} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-xs text-subtle">No image</div>}
          </div>
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className={cn("badge", form.accent === "orange" ? "badge-orange" : form.accent === "green" ? "badge-green" : form.accent === "red" ? "badge-red" : "")}>{form.pair || "PAIR"}</span>
              <span className="text-[11px] text-subtle">{form.timeframe} · {form.publishedAt}</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{form.bias}</p>
              <h3 className="mt-1 text-lg font-extrabold leading-tight">{form.title || "Judul analisis"}</h3>
              <p className="mt-2 text-sm text-muted">{form.excerpt || "Ringkasan analisis akan tampil di sini."}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <PreviewLevel label="Support" value={form.support} />
              <PreviewLevel label="Resistance" value={form.resistance} />
              <PreviewLevel label="Target" value={form.target} />
              <PreviewLevel label="Invalidation" value={form.invalidation} />
            </div>
            <div className="rounded-sm border border-line p-3">
              <p className="text-xs font-bold">Scenario bullish</p>
              <p className="mt-1 whitespace-pre-line text-xs leading-5 text-muted">{form.scenarioBullish || "Belum diisi."}</p>
            </div>
            <div className="rounded-sm border border-line p-3">
              <p className="text-xs font-bold">Scenario bearish</p>
              <p className="mt-1 whitespace-pre-line text-xs leading-5 text-muted">{form.scenarioBearish || "Belum diisi."}</p>
            </div>
          </div>
        </article>
      </aside>
    </div>
  );
}

function PreviewLevel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-subtle">{label}</div>
      <div className="mt-1 text-xs font-semibold">{value || "—"}</div>
    </div>
  );
}

function NewsStudio({ token, items, onChange, busy, setBusy }: { token: string; items: NewsItem[]; onChange: () => Promise<void>; busy: boolean; setBusy: (v: boolean) => void }) {
  const empty = useMemo(() => ({ id: undefined as number | undefined, category: "Ekonomi Global", title: "", excerpt: "", body: "", thumb: "capitol" as NewsThumb, publishedAt: new Date().toISOString().slice(0, 10) }), []);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) { e.preventDefault(); setError(""); setBusy(true); try { await saveNews({ data: { token, ...form } }); setForm(empty); await onChange(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); } finally { setBusy(false); } }
  return <div className="studio-shell"><ListPane title="News" items={items} onSelect={(i) => setForm({ id: i.id, category: i.category, title: i.title, excerpt: i.excerpt, body: i.body.join("\n\n"), thumb: i.thumb, publishedAt: i.publishedAt })} render={(i) => <><div className="text-xs text-subtle">{i.category} · {formatIdDate(i.publishedAt)}</div><div className="text-sm font-semibold">{i.title}</div></>} /><form onSubmit={submit} className="rounded-md border border-line bg-surface p-5"><EditorTitle title={form.id ? "Edit news" : "News baru"} onNew={() => setForm(empty)} />{error ? <p className="mb-3 text-sm text-accent-red">{error}</p> : null}<div className="grid gap-3 sm:grid-cols-3"><Field label="Kategori"><input className="form-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></Field><Field label="Visual"><select className="form-field" value={form.thumb} onChange={(e) => setForm({ ...form, thumb: e.target.value as NewsItem["thumb"] })}><option value="capitol">Ekonomi</option><option value="gold">Emas</option><option value="bitcoin">Bitcoin</option></select></Field><Field label="Tanggal"><input className="form-field" type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} required /></Field></div><Field label="Judul"><input className="form-field mt-3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field><Field label="Ringkasan"><input className="form-field mt-3" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} required /></Field><Field label="Isi berita"><textarea className="form-field mt-3" rows={12} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field><Actions busy={busy} id={form.id} onDelete={async () => { if (!form.id || !confirm("Hapus news ini?")) return; setBusy(true); try { await deleteNews({ data: { token, id: form.id } }); setForm(empty); await onChange(); } finally { setBusy(false); } }} href={form.id ? `${PUBLIC_SITE_URL}/news/${items.find(i => i.id === form.id)?.slug ?? ""}` : undefined} /></form></div>;
}

function EdukasiStudio({ token, items, onChange, busy, setBusy }: { token: string; items: EdukasiItem[]; onChange: () => Promise<void>; busy: boolean; setBusy: (v: boolean) => void }) {
  const empty = useMemo(() => ({ id: undefined as number | undefined, level: "Pemula" as EduLevel, title: "", description: "", body: "", imageUrl: "" }), []); const [form, setForm] = useState(empty); const [error, setError] = useState("");
  async function submit(e: FormEvent) { e.preventDefault(); setError(""); setBusy(true); try { await saveEdukasi({ data: { token, ...form } }); setForm(empty); await onChange(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); } finally { setBusy(false); } }
  return <div className="studio-shell"><ListPane title="Edukasi" items={items} onSelect={(i) => setForm(i)} render={(i) => <><div className="text-xs text-subtle">{i.level}</div><div className="text-sm font-semibold">{i.title}</div></>} /><form onSubmit={submit} className="rounded-md border border-line bg-surface p-5"><EditorTitle title={form.id ? "Edit materi" : "Materi baru"} onNew={() => setForm(empty)} />{error ? <p className="mb-3 text-sm text-accent-red">{error}</p> : null}<Field label="Level"><select className="form-field" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as EduLevel })}><option>Pemula</option><option>Menengah</option><option>Lanjutan</option></select></Field><Field label="Judul"><input className="form-field mt-3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field><Field label="Ringkasan"><input className="form-field mt-3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></Field><Field label="Isi materi"><textarea className="form-field mt-3" rows={12} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field><div className="my-4"><ImageField value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} /></div><Actions busy={busy} id={form.id} onDelete={async () => { if (!form.id || !confirm("Hapus materi ini?")) return; setBusy(true); try { await deleteEdukasi({ data: { token, id: form.id } }); setForm(empty); await onChange(); } finally { setBusy(false); } }} /></form></div>;
}

function ListPane<T extends { id: number }>({ title, items, onSelect, render }: { title: string; items: T[]; onSelect: (item: T) => void; render: (item: T) => ReactNode }) { return <aside className="rounded-md border border-line bg-surface p-4"><h2 className="mb-3 text-sm font-bold tracking-wide text-subtle uppercase">{title}</h2><div className="flex max-h-[620px] flex-col gap-2 overflow-auto">{items.map(i => <button key={i.id} type="button" className="rounded-sm border border-line px-3 py-2.5 text-left hover:border-primary" onClick={() => onSelect(i)}>{render(i)}</button>)}</div></aside>; }
function EditorTitle({ title, onNew }: { title: string; onNew: () => void }) { return <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">{title}</h2><button type="button" className="btn btn-ghost" onClick={onNew}>Buat baru</button></div>; }
function Actions({ busy, id, onDelete, href }: { busy: boolean; id?: number; onDelete: () => Promise<void>; href?: string }) { return <div className="flex flex-wrap gap-2"><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>{id ? <button type="button" className="btn btn-danger" disabled={busy} onClick={() => void onDelete()}>Hapus</button> : null}{href ? <a href={href} target="_blank" rel="noreferrer" className="btn btn-outline">Lihat publik</a> : null}</div>; }
function EmptyState({ text }: { text: string }) { return <div className="px-3 py-6 text-center text-sm text-subtle">{text}</div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-sm font-semibold">{label}</span>{children}</label>; }

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
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Newspaper,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

export const Route = createFileRoute("/studio")({
  component: StudioPage,
  head: () => ({ meta: [{ title: "Producer Studio | Birustock Indonesia" }] }),
});

const TOKEN_KEY = "bs-producer-token";
const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:8080";
type Tab = "dashboard" | "analisis" | "news" | "edukasi";

const STATUS_META: Record<AnalisisStatus, { label: string; className: string; dot: string }> = {
  DRAFT: { label: "Draft", className: "badge-orange", dot: "bg-accent-orange" },
  PUBLISHED: { label: "Published", className: "badge-green", dot: "bg-accent-green" },
  ARCHIVED: { label: "Archived", className: "badge-red", dot: "bg-accent-red" },
};

const TAB_META: Record<Tab, { label: string; caption: string; icon: ReactNode }> = {
  dashboard: { label: "Dashboard", caption: "Overview", icon: <LayoutDashboard size={16} /> },
  analisis: { label: "Analisis", caption: "Market content", icon: <BarChart3 size={16} /> },
  news: { label: "News", caption: "Editorial content", icon: <Newspaper size={16} /> },
  edukasi: { label: "Edukasi", caption: "Learning content", icon: <BookOpen size={16} /> },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadError, setLoadError] = useState("");

  async function refresh() {
    if (!token) return;
    setLoadError("");
    const results = await Promise.allSettled([
      listAnalisisStudio({ data: { token } }),
      listNews(),
      listEdukasi(),
    ]);

    if (results[0].status === "fulfilled") setAnalisis(results[0].value);
    if (results[1].status === "fulfilled") setNews(results[1].value);
    if (results[2].status === "fulfilled") setEdukasi(results[2].value);

    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length) {
      const first = failures[0];
      setLoadError(first.status === "rejected" && first.reason instanceof Error ? first.reason.message : "Sebagian konten gagal dimuat.");
    }
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
          <div className="skeleton mx-auto h-28 w-full max-w-xl" />
        </div>
      </section>
    );
  }

  if (!token) {
    return <LoginView pin={pin} setPin={setPin} error={error} busy={busy} onLogin={onLogin} />;
  }

  const pageTitle = tab === "dashboard" ? "Producer Dashboard" : TAB_META[tab].label;
  const pageDescription = tab === "dashboard" ? "Pantau performa konten, status publikasi, dan pekerjaan terbaru dari satu ruang kerja." : TAB_META[tab].caption;

  return (
    <section className="min-h-[calc(100vh-64px)] py-5 md:py-6">
      <div className="container-site">
        <div className="producer-layout">
          <div className={cn("producer-sidebar-backdrop", sidebarOpen && "is-open")} onClick={() => setSidebarOpen(false)} />
          <aside className={cn("producer-sidebar", sidebarOpen && "is-open")}>
            <div className="producer-sidebar-head">
              <div>
                <p className="eyebrow">Producer</p>
                <div className="mt-1 flex items-center gap-2 font-extrabold tracking-tight">
                  <span className="size-2 rounded-full bg-accent-green shadow-[0_0_12px_rgb(93_204_138_/_.65)]" />
                  Studio Birustock
                </div>
              </div>
              <button type="button" className="icon-btn md:hidden" aria-label="Tutup menu" onClick={() => setSidebarOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="producer-workspace-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-subtle">Workspace</div>
                  <div className="mt-1 text-sm font-bold">Birustock Production</div>
                </div>
                <span className="badge badge-green">Live</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-alt">
                <div className="h-full w-[72%] rounded-full bg-primary" />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-subtle">
                <span>Content capacity</span>
                <span>72%</span>
              </div>
            </div>

            <nav className="grid gap-1" aria-label="Navigasi Producer">
              {Object.entries(TAB_META).map(([key, meta]) => (
                <StudioNavButton key={key} icon={meta.icon} active={tab === key} onClick={() => { setTab(key as Tab); setSidebarOpen(false); }}>
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span>{meta.label}</span>
                    {key === "analisis" && analisis.length ? <span className="nav-count">{analisis.length}</span> : null}
                    {key === "news" && news.length ? <span className="nav-count">{news.length}</span> : null}
                    {key === "edukasi" && edukasi.length ? <span className="nav-count">{edukasi.length}</span> : null}
                  </span>
                </StudioNavButton>
              ))}
            </nav>

            <div className="mt-auto border-t border-line pt-3">
              <a href={PUBLIC_SITE_URL} className="studio-nav-link">
                <ArrowLeft size={16} /> Website publik
              </a>
              <button type="button" className="studio-nav-link mt-1 w-full text-accent-red" onClick={() => { localStorage.removeItem(TOKEN_KEY); setToken(null); }}>
                <LogOut size={16} /> Keluar
              </button>
            </div>
          </aside>

          <main className="min-w-0">
            <header className="producer-topbar">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" className="icon-btn md:hidden" aria-label="Buka menu" onClick={() => setSidebarOpen(true)}>
                  <Menu size={18} />
                </button>
                <div className="min-w-0">
                  <div className="hidden items-center gap-2 text-xs text-subtle sm:flex">
                    <span>Producer</span><ChevronRight size={13} /><span>{TAB_META[tab].label}</span>
                  </div>
                  <div className="mt-0.5 truncate text-sm font-bold sm:text-base">{pageTitle}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="icon-btn" aria-label="Refresh data" onClick={() => void refresh()} disabled={busy}>
                  <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
                </button>
                <button type="button" className="icon-btn hidden sm:inline-flex" aria-label="Notifikasi"><Bell size={16} /></button>
                <div className="producer-user-pill">
                  <span className="producer-avatar">P</span>
                  <span className="hidden text-xs font-semibold sm:block">Producer</span>
                  <ChevronDown size={14} className="text-subtle" />
                </div>
              </div>
            </header>

            <div className="mb-5 mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{tab === "dashboard" ? "Content Command Center" : `${TAB_META[tab].label} CMS`}</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">{pageTitle}</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted">{pageDescription}</p>
              </div>
              <div className="flex items-center gap-2">
                {tab === "analisis" ? (
                  <button type="button" className="btn btn-primary shadow-[0_12px_32px_rgb(142_180_255_/_.12)]" onClick={() => window.dispatchEvent(new Event("studio:new-analysis"))}>
                    <Plus size={16} /> Analisis Baru
                  </button>
                ) : null}
                {tab === "news" ? (
                  <button type="button" className="btn btn-primary" onClick={() => window.dispatchEvent(new Event("studio:new-news"))}>
                    <Plus size={16} /> News Baru
                  </button>
                ) : null}
                {tab === "edukasi" ? (
                  <button type="button" className="btn btn-primary" onClick={() => window.dispatchEvent(new Event("studio:new-education"))}>
                    <Plus size={16} /> Edukasi Baru
                  </button>
                ) : null}
              </div>
            </div>

            {loadError ? <div className="mb-4 rounded-md border border-accent-orange/30 bg-accent-orange-bg px-4 py-3 text-sm text-accent-orange">{loadError}</div> : null}

            {tab === "dashboard" ? <Dashboard analisis={analisis} news={news} edukasi={edukasi} onSelect={setTab} /> : null}
            {tab === "analisis" ? <AnalisisStudio token={token} items={analisis} onChange={refresh} busy={busy} setBusy={setBusy} /> : null}
            {tab === "news" ? <NewsStudio token={token} items={news} onChange={refresh} busy={busy} setBusy={setBusy} /> : null}
            {tab === "edukasi" ? <EdukasiStudio token={token} items={edukasi} onChange={refresh} busy={busy} setBusy={setBusy} /> : null}
          </main>
        </div>
      </div>
    </section>
  );
}

function LoginView({ pin, setPin, error, busy, onLogin }: { pin: string; setPin: (v: string) => void; error: string; busy: boolean; onLogin: (e: FormEvent) => void }) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgb(142_180_255_/_0.15),transparent_60%)]" />
      <div className="container-site relative">
        <form onSubmit={onLogin} className="producer-login-card enter-up mx-auto max-w-md">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Producer Studio</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Kelola Birustock</h1>
            </div>
            <div className="producer-login-icon"><Sparkles size={20} /></div>
          </div>
          <p className="mb-7 text-sm leading-6 text-muted">Ruang kerja internal untuk membuat, menyimpan, meninjau, dan menerbitkan konten Birustock.</p>
          {error ? <div className="mb-4 rounded-sm border border-accent-red/30 bg-accent-red-bg px-4 py-3 text-sm text-accent-red">{error}</div> : null}
          <Field label="PIN Studio">
            <input id="pin" type="password" className="form-field form-field-lg" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="current-password" placeholder="Masukkan PIN" required />
          </Field>
          <button type="submit" className="btn btn-primary btn-block mt-4 h-12" disabled={busy}>
            {busy ? "Memeriksa…" : "Masuk ke Studio"}
          </button>
          <div className="mt-5 flex items-center gap-2 text-xs text-subtle"><span className="size-2 rounded-full bg-accent-green" /> Akses internal Producer.</div>
        </form>
      </div>
    </section>
  );
}

function Dashboard({ analisis, news, edukasi, onSelect }: { analisis: AnalisisItem[]; news: NewsItem[]; edukasi: EdukasiItem[]; onSelect: (tab: Tab) => void }) {
  const published = analisis.filter((item) => item.status === "PUBLISHED").length;
  const drafts = analisis.filter((item) => item.status === "DRAFT").length;
  const archived = analisis.filter((item) => item.status === "ARCHIVED").length;
  const recent = [...analisis].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 6);
  const totalContent = analisis.length + news.length + edukasi.length;

  return (
    <div className="grid gap-5 stagger">
      <section className="producer-hero-card">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-accent-green"><span className="size-2 rounded-full bg-accent-green" /> Sistem aktif</div>
          <h2 className="mt-3 max-w-2xl text-2xl font-extrabold tracking-tight md:text-3xl">Semua pekerjaan editorial Birustock, dari draft sampai tayang.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Gunakan Producer Studio untuk menyiapkan market analysis, berita, dan materi edukasi sebelum diterbitkan ke website publik.</p>
        </div>
        <div className="hero-command-grid">
          <QuickAction icon={<BarChart3 size={18} />} title="Tulis analisis" desc="Market setup & scenario" onClick={() => onSelect("analisis")} />
          <QuickAction icon={<Newspaper size={18} />} title="Kelola news" desc="Editorial & publishing" onClick={() => onSelect("news")} />
          <QuickAction icon={<BookOpen size={18} />} title="Susun edukasi" desc="Learning path" onClick={() => onSelect("edukasi")} />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<FileText size={18} />} label="Total Analisis" value={analisis.length} hint="Semua status" onClick={() => onSelect("analisis")} tone="blue" />
        <MetricCard icon={<Check size={18} />} label="Published" value={published} hint="Tayang ke user" onClick={() => onSelect("analisis")} tone="green" />
        <MetricCard icon={<PenLine size={18} />} label="Draft" value={drafts} hint="Perlu dilanjutkan" onClick={() => onSelect("analisis")} tone="orange" />
        <MetricCard icon={<Archive size={18} />} label="Archived" value={archived} hint="Tidak ditampilkan" onClick={() => onSelect("analisis")} tone="red" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <section className="producer-panel overflow-hidden">
          <div className="panel-header">
            <div><p className="text-sm font-bold">Aktivitas terbaru</p><p className="mt-1 text-xs text-subtle">Perubahan konten terakhir.</p></div>
            <button type="button" className="btn btn-ghost !px-2" onClick={() => onSelect("analisis")}>Buka CMS <ChevronRight size={15} /></button>
          </div>
          <div className="divide-y divide-line">
            {recent.length ? recent.map((item) => (
              <button key={item.id} type="button" className="activity-row" onClick={() => onSelect("analisis")}>
                <div className="activity-leading"><span className={cn("status-dot", STATUS_META[item.status].dot)} /><span className={cn("badge", STATUS_META[item.status].className)}>{STATUS_META[item.status].label}</span></div>
                <div className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold">{item.title || "Untitled"}</p><p className="mt-1 truncate text-xs text-subtle">{item.pair} · {item.timeframe} · diperbarui {formatIdDate(item.updatedAt.slice(0, 10))}</p></div>
                <div className="hidden items-center gap-2 text-xs text-subtle sm:flex"><span>{item.bias}</span><ChevronRight size={14} /></div>
              </button>
            )) : <EmptyState text="Belum ada analisis." />}
          </div>
        </section>

        <div className="grid gap-4">
          <section className="producer-panel p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">Portofolio konten</p><p className="mt-1 text-xs text-subtle">Semua channel.</p></div><span className="badge">{totalContent} items</span></div>
            <div className="mt-5 grid gap-3">
              <MiniMetric icon={<BarChart3 size={16} />} label="Analisis" value={analisis.length} desc={`${published} published · ${drafts} draft`} onClick={() => onSelect("analisis")} />
              <MiniMetric icon={<Newspaper size={16} />} label="News" value={news.length} desc="Konten editorial tersimpan" onClick={() => onSelect("news")} />
              <MiniMetric icon={<BookOpen size={16} />} label="Edukasi" value={edukasi.length} desc="Materi belajar tersimpan" onClick={() => onSelect("edukasi")} />
            </div>
          </section>
          <section className="producer-panel p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">Workflow</p><p className="mt-1 text-xs text-subtle">Alur publikasi utama.</p></div><CircleHelp size={16} className="text-subtle" /></div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <WorkflowStep index="01" label="Draft" tone="orange" />
              <WorkflowStep index="02" label="Review" tone="blue" />
              <WorkflowStep index="03" label="Publish" tone="green" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, title, desc, onClick }: { icon: ReactNode; title: string; desc: string; onClick: () => void }) {
  return <button type="button" className="quick-action-card" onClick={onClick}><span className="icon-tile">{icon}</span><span className="min-w-0 flex-1 text-left"><span className="block text-sm font-bold">{title}</span><span className="mt-1 block text-xs text-subtle">{desc}</span></span><ChevronRight size={15} className="text-subtle" /></button>;
}

function MetricCard({ icon, label, value, hint, onClick, tone }: { icon: ReactNode; label: string; value: number; hint: string; onClick: () => void; tone: "blue" | "green" | "orange" | "red" }) {
  return <button type="button" className={cn("metric-card", `metric-${tone}`)} onClick={onClick}><div className="flex items-center justify-between gap-3"><span className="rounded-sm bg-primary-soft p-2.5 text-primary">{icon}</span><ChevronRight size={15} className="text-subtle" /></div><div className="mt-5 text-3xl font-extrabold tracking-tight">{value}</div><div className="mt-1 text-sm font-semibold">{label}</div><div className="mt-1 text-xs text-subtle">{hint}</div></button>;
}

function MiniMetric({ icon, label, value, desc, onClick }: { icon: ReactNode; label: string; value: number; desc: string; onClick: () => void }) {
  return <button type="button" className="mini-metric" onClick={onClick}><span className="rounded-sm bg-bg-alt p-2 text-primary">{icon}</span><span className="min-w-0 flex-1 text-left"><span className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{label}</span><span className="text-lg font-extrabold">{value}</span></span><span className="mt-1 block truncate text-xs text-subtle">{desc}</span></span><ChevronRight size={14} className="text-subtle" /></button>;
}

function WorkflowStep({ index, label, tone }: { index: string; label: string; tone: "blue" | "green" | "orange" }) {
  const colors = tone === "green" ? "text-accent-green" : tone === "orange" ? "text-accent-orange" : "text-accent-blue";
  return <div className="rounded-sm border border-line bg-bg-alt px-2.5 py-3"><div className={cn("font-mono text-[10px]", colors)}>{index}</div><div className="mt-1 font-semibold">{label}</div></div>;
}

function StudioNavButton({ icon, active, children, onClick }: { icon: ReactNode; active: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" className={cn("studio-nav-link", active && "is-active")} onClick={onClick}>{icon}{children}</button>;
}

function ImageField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return <div className="grid gap-3 md:grid-cols-[1fr_190px]"><div><Field label="URL gambar"><input className="form-field" value={value.startsWith("data:") ? "" : value} placeholder="https://…" onChange={(e) => onChange(e.target.value)} /></Field><label className="upload-dropzone mt-3"><input type="file" accept="image/*" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 350_000) { alert("Maksimal 350KB."); return; } const reader = new FileReader(); reader.onload = () => onChange(String(reader.result ?? "")); reader.readAsDataURL(file); }} /><span className="text-xs font-semibold">Klik untuk pilih gambar</span><span className="text-[11px] text-subtle">PNG/JPG · maksimum 350KB</span></label></div><div className="cover-frame h-32 overflow-hidden rounded-md">{value ? <img src={value} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-xs text-subtle">No image</div>}</div></div>;
}

function AnalisisStudio({ token, items, onChange, busy, setBusy }: { token: string; items: AnalisisItem[]; onChange: () => Promise<void>; busy: boolean; setBusy: (v: boolean) => void }) {
  type FormState = { id?: number; pair: string; title: string; excerpt: string; body: string; imageUrl: string; accent: Accent; publishedAt: string; status: AnalisisStatus; timeframe: string; bias: "Bullish" | "Bearish" | "Netral"; support: string; resistance: string; target: string; invalidation: string; scenarioBullish: string; scenarioBearish: string };
  const empty = useMemo<FormState>(() => ({ id: undefined, pair: "XAU/USD", title: "", excerpt: "", body: "", imageUrl: "", accent: "blue", publishedAt: new Date().toISOString().slice(0, 10), status: "DRAFT", timeframe: "H4", bias: "Bullish", support: "", resistance: "", target: "", invalidation: "", scenarioBullish: "", scenarioBearish: "" }), []);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AnalisisStatus>("ALL");

  useEffect(() => { const handler = () => { setForm({ ...empty }); setError(""); }; window.addEventListener("studio:new-analysis", handler); return () => window.removeEventListener("studio:new-analysis", handler); }, [empty]);

  const filtered = items.filter((item) => { const q = query.trim().toLowerCase(); const matchesQuery = !q || `${item.pair} ${item.title} ${item.bias} ${item.status}`.toLowerCase().includes(q); const matchesStatus = statusFilter === "ALL" || item.status === statusFilter; return matchesQuery && matchesStatus; });
  const selected = form.id ? items.find((item) => item.id === form.id) : undefined;

  function fill(item: AnalisisItem) { setError(""); setForm({ id: item.id, pair: item.pair, title: item.title, excerpt: item.excerpt, body: item.body, imageUrl: item.imageUrl, accent: item.accent, publishedAt: item.publishedAt, status: item.status, timeframe: item.timeframe, bias: item.bias as FormState["bias"], support: item.support, resistance: item.resistance, target: item.target, invalidation: item.invalidation, scenarioBullish: item.scenarioBullish, scenarioBearish: item.scenarioBearish }); }
  async function submit(nextStatus: AnalisisStatus) { setError(""); setBusy(true); try { await saveAnalisis({ data: { token, ...form, status: nextStatus } }); setForm({ ...form, status: nextStatus }); await onChange(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); } finally { setBusy(false); } }
  async function remove() { if (!form.id || !confirm("Hapus analisis ini secara permanen?")) return; setBusy(true); try { await deleteAnalisis({ data: { token, id: form.id } }); setForm({ ...empty }); await onChange(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menghapus."); } finally { setBusy(false); } }

  return <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)_320px]">
    <aside className="producer-panel h-fit overflow-hidden lg:sticky lg:top-24">
      <div className="border-b border-line p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">Semua Analisis</p><p className="mt-1 text-xs text-subtle">{items.length} konten</p></div><button type="button" className="icon-btn" aria-label="Buat analisis" onClick={() => setForm({ ...empty })}><Plus size={16} /></button></div><label className="mt-4 flex items-center gap-2 rounded-sm border border-line bg-bg-alt px-3"><Search size={15} className="text-subtle" /><input className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari pair atau judul…" /></label><div className="mt-3 flex gap-1.5 overflow-auto pb-1"><FilterChip active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>Semua</FilterChip>{(["PUBLISHED", "DRAFT", "ARCHIVED"] as AnalisisStatus[]).map((status) => <FilterChip key={status} active={statusFilter === status} onClick={() => setStatusFilter(status)}>{STATUS_META[status].label}</FilterChip>)}</div></div>
      <div className="max-h-[680px] overflow-auto p-2">{filtered.length ? filtered.map((item) => <AnalysisListItem key={item.id} item={item} active={selected?.id === item.id} onClick={() => fill(item)} />) : <EmptyState text="Tidak ada hasil." />}</div>
    </aside>

    <form onSubmit={(e) => { e.preventDefault(); void submit(form.status); }} className="grid gap-4">
      <section className="producer-panel overflow-hidden">
        <div className="sticky-form-head"><div className="min-w-0"><div className="flex items-center gap-2"><span className="badge">{form.id ? `ID #${form.id}` : "Konten baru"}</span><span className={cn("badge", STATUS_META[form.status].className)}>{STATUS_META[form.status].label}</span></div><h2 className="mt-2 truncate text-xl font-extrabold">{form.title || "Buat Analisis"}</h2><p className="mt-1 text-xs text-subtle">Draft dapat diedit kapan saja sebelum dipublikasikan.</p></div><div className="flex flex-wrap items-center gap-2"><button type="button" className="btn btn-outline" disabled={busy} onClick={() => void submit("DRAFT")}>{busy ? "Menyimpan…" : "Simpan Draft"}</button><button type="button" className="btn btn-primary" disabled={busy} onClick={() => void submit("PUBLISHED")}><Check size={15} /> Publish</button><button type="button" className="icon-btn" aria-label="Lainnya"><MoreHorizontal size={17} /></button></div></div>
      </section>

      {error ? <div className="rounded-md border border-accent-red/30 bg-accent-red-bg px-4 py-3 text-sm text-accent-red">{error}</div> : null}

      <section className="producer-panel p-5"><SectionLabel icon={<BarChart3 size={15} />} title="Informasi Market" note="Identitas setup" /><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field label="Pair"><select className="form-field" value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })}><option>XAU/USD</option><option>BTC/USD</option><option>EUR/USD</option><option>GBP/USD</option><option>USD/JPY</option></select></Field><Field label="Timeframe"><select className="form-field" value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })}><option>M15</option><option>H1</option><option>H4</option><option>D1</option><option>W1</option></select></Field><Field label="Bias"><select className="form-field" value={form.bias} onChange={(e) => setForm({ ...form, bias: e.target.value as FormState["bias"] })}><option>Bullish</option><option>Bearish</option><option>Netral</option></select></Field><Field label="Tanggal tayang"><input className="form-field" type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} required /></Field></div></section>

      <section className="producer-panel p-5"><SectionLabel icon={<PenLine size={15} />} title="Market Levels" note="Level kunci setup" /><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Support"><input className="form-field" value={form.support} placeholder="2,380 · 2,365" onChange={(e) => setForm({ ...form, support: e.target.value })} /></Field><Field label="Resistance"><input className="form-field" value={form.resistance} placeholder="2,420 · 2,450" onChange={(e) => setForm({ ...form, resistance: e.target.value })} /></Field><Field label="Target"><input className="form-field" value={form.target} placeholder="2,520 / 2,560" onChange={(e) => setForm({ ...form, target: e.target.value })} /></Field><Field label="Invalidation"><input className="form-field" value={form.invalidation} placeholder="2,340" onChange={(e) => setForm({ ...form, invalidation: e.target.value })} /></Field></div></section>

      <section className="producer-panel p-5"><SectionLabel icon={<FileText size={15} />} title="Konten Utama" note="Headline dan isi analisis" /><div className="mt-4 grid gap-4"><Field label="Judul"><input className="form-field form-field-lg" value={form.title} placeholder="Judul analisis yang jelas dan actionable" onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field><Field label="Ringkasan"><textarea className="form-field min-h-[100px]" value={form.excerpt} placeholder="Ringkasan singkat untuk card dan metadata…" onChange={(e) => setForm({ ...form, excerpt: e.target.value })} required /></Field><Field label="Isi analisis"><textarea className="form-field min-h-[260px]" value={form.body} placeholder="Tulis market commentary, konteks, dan alasan setup…" onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field></div></section>

      <section className="producer-panel p-5"><SectionLabel icon={<Sparkles size={15} />} title="Scenario" note="Kondisi yang mengubah bias" /><div className="mt-4 grid gap-4 md:grid-cols-2"><div className="scenario-card scenario-green"><Field label="Bullish"><textarea className="form-field min-h-[180px]" value={form.scenarioBullish} placeholder="Apa yang harus terjadi agar skenario bullish valid?" onChange={(e) => setForm({ ...form, scenarioBullish: e.target.value })} /></Field></div><div className="scenario-card scenario-red"><Field label="Bearish"><textarea className="form-field min-h-[180px]" value={form.scenarioBearish} placeholder="Apa yang membatalkan bias dan memicu skenario bearish?" onChange={(e) => setForm({ ...form, scenarioBearish: e.target.value })} /></Field></div></div></section>

      <section className="producer-panel p-5"><SectionLabel icon={<Settings size={15} />} title="Media & Pengaturan" note="Visual dan tampilan card" /><div className="mt-4 grid gap-5"><ImageField value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} /><Field label="Aksen"><select className="form-field max-w-xs" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value as Accent })}><option value="blue">Biru</option><option value="orange">Orange</option><option value="green">Hijau</option><option value="red">Merah</option></select></Field></div></section>

      <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" className="btn btn-danger" disabled={!form.id || busy} onClick={() => void remove()}><Trash2 size={15} /> Hapus</button><div className="flex flex-wrap gap-2"><button type="submit" className="btn btn-outline" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>{form.id && selected?.slug ? <a href={`${PUBLIC_SITE_URL}/analisis/${selected.slug}`} target="_blank" rel="noreferrer" className="btn btn-primary">Lihat halaman publik <ChevronRight size={15} /></a> : null}</div></div>
    </form>

    <aside className="h-fit lg:sticky lg:top-24"><LivePreview form={form} /></aside>
  </div>;
}

function AnalysisListItem({ item, active, onClick }: { item: AnalisisItem; active: boolean; onClick: () => void }) {
  return <button type="button" className={cn("analysis-list-item", active && "is-active")} onClick={onClick}><div className="analysis-thumb">{item.imageUrl ? <img src={item.imageUrl} alt="" className="size-full object-cover" /> : <BarChart3 size={16} className="text-primary" />}</div><div className="min-w-0 flex-1 text-left"><div className="flex items-center gap-2"><span className="badge">{item.pair}</span><span className={cn("badge", STATUS_META[item.status].className)}>{STATUS_META[item.status].label}</span></div><p className="mt-2 truncate text-sm font-semibold">{item.title || "Untitled"}</p><p className="mt-1 truncate text-xs text-subtle">{item.timeframe} · {item.bias} · {formatIdDate(item.publishedAt)}</p></div><ChevronRight size={14} className="shrink-0 text-subtle" /></button>;
}

function LivePreview({ form }: { form: { pair: string; timeframe: string; bias: string; publishedAt: string; title: string; excerpt: string; imageUrl: string; accent: Accent; support: string; resistance: string; target: string; invalidation: string; scenarioBullish: string; scenarioBearish: string } }) {
  return <section className="producer-panel overflow-hidden"><div className="border-b border-line p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">Live Preview</p><p className="mt-1 text-xs text-subtle">Tampilan card sebelum publish.</p></div><span className="badge">Preview</span></div></div><article className="overflow-hidden bg-bg"><div className="aspect-[16/10] bg-bg-alt">{form.imageUrl ? <img src={form.imageUrl} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-xs text-subtle">No image</div>}</div><div className="space-y-4 p-4"><div className="flex items-center justify-between gap-3"><span className={cn("badge", form.accent === "orange" ? "badge-orange" : form.accent === "green" ? "badge-green" : form.accent === "red" ? "badge-red" : "")}>{form.pair || "PAIR"}</span><span className="text-[11px] text-subtle">{form.timeframe} · {form.publishedAt}</span></div><div><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-subtle">{form.bias}</div><h3 className="mt-1 text-lg font-extrabold leading-tight">{form.title || "Judul analisis"}</h3><p className="mt-2 text-sm leading-6 text-muted">{form.excerpt || "Ringkasan analisis akan tampil di sini."}</p></div><div className="grid grid-cols-2 gap-2"><PreviewLevel label="Support" value={form.support} /><PreviewLevel label="Resistance" value={form.resistance} /><PreviewLevel label="Target" value={form.target} /><PreviewLevel label="Invalidation" value={form.invalidation} /></div><div className="preview-scenario preview-green"><p className="text-xs font-bold">Bullish scenario</p><p className="mt-1 whitespace-pre-line text-xs leading-5 text-muted">{form.scenarioBullish || "Belum diisi."}</p></div><div className="preview-scenario preview-red"><p className="text-xs font-bold">Bearish scenario</p><p className="mt-1 whitespace-pre-line text-xs leading-5 text-muted">{form.scenarioBearish || "Belum diisi."}</p></div></div></article></section>;
}

function PreviewLevel({ label, value }: { label: string; value: string }) { return <div className="rounded-sm border border-line bg-bg-alt p-3"><div className="text-[10px] uppercase tracking-[0.12em] text-subtle">{label}</div><div className="mt-1 text-sm font-semibold">{value || "—"}</div></div>; }

function NewsStudio({ token, items, onChange, busy, setBusy }: { token: string; items: NewsItem[]; onChange: () => Promise<void>; busy: boolean; setBusy: (v: boolean) => void }) {
  const empty = useMemo(() => ({ id: undefined as number | undefined, category: "Ekonomi Global", title: "", excerpt: "", body: "", thumb: "capitol" as NewsThumb, publishedAt: new Date().toISOString().slice(0, 10) }), []);
  const [form, setForm] = useState(empty); const [error, setError] = useState(""); const [query, setQuery] = useState("");
  useEffect(() => { const handler = () => { setForm({ ...empty }); setError(""); }; window.addEventListener("studio:new-news", handler); return () => window.removeEventListener("studio:new-news", handler); }, [empty]);
  async function submit(e: FormEvent) { e.preventDefault(); setError(""); setBusy(true); try { await saveNews({ data: { token, ...form } }); setForm({ ...empty }); await onChange(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); } finally { setBusy(false); } }
  async function remove() { if (!form.id || !confirm("Hapus news ini secara permanen?")) return; setBusy(true); try { await deleteNews({ data: { token, id: form.id } }); setForm({ ...empty }); await onChange(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menghapus."); } finally { setBusy(false); } }
  const filtered = items.filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)_320px]">
    <aside className="producer-panel h-fit overflow-hidden xl:sticky xl:top-24"><div className="border-b border-line p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">Semua News</p><p className="mt-1 text-xs text-subtle">{items.length} konten</p></div><button type="button" className="icon-btn" onClick={() => setForm({ ...empty })}><Plus size={16} /></button></div><label className="mt-4 flex items-center gap-2 rounded-sm border border-line bg-bg-alt px-3"><Search size={15} className="text-subtle" /><input className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari judul…" /></label></div><div className="max-h-[680px] overflow-auto p-2">{filtered.length ? filtered.map((item) => <button key={item.id} type="button" className={cn("content-list-row", form.id === item.id && "is-active")} onClick={() => setForm({ id: item.id, category: item.category, title: item.title, excerpt: item.excerpt, body: item.body.join("\n\n"), thumb: item.thumb, publishedAt: item.publishedAt })}><span className="content-list-thumb">{item.thumb === "bitcoin" ? "₿" : item.thumb === "gold" ? "Au" : "E"}</span><span className="min-w-0 flex-1 text-left"><span className="block truncate text-xs text-subtle">{item.category}</span><span className="mt-1 block truncate text-sm font-semibold">{item.title}</span><span className="mt-1 block text-[11px] text-subtle">{formatIdDate(item.publishedAt)}</span></span><ChevronRight size={14} className="text-subtle" /></button>) : <EmptyState text="Tidak ada hasil." />}</div></aside>
    <form onSubmit={submit} className="grid gap-4"><section className="producer-panel overflow-hidden"><div className="sticky-form-head"><div><span className="badge">{form.id ? `ID #${form.id}` : "Konten baru"}</span><h2 className="mt-2 text-xl font-extrabold">{form.title || "News baru"}</h2><p className="mt-1 text-xs text-subtle">Konten editorial sebelum tayang.</p></div><div className="flex gap-2"><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan News"}</button></div></div></section>{error ? <div className="rounded-md border border-accent-red/30 bg-accent-red-bg px-4 py-3 text-sm text-accent-red">{error}</div> : null}<section className="producer-panel p-5"><SectionLabel icon={<Newspaper size={15} />} title="Editorial" note="Metadata dan isi" /><div className="mt-4 grid gap-4"><div className="grid gap-3 md:grid-cols-3"><Field label="Kategori"><input className="form-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></Field><Field label="Visual"><select className="form-field" value={form.thumb} onChange={(e) => setForm({ ...form, thumb: e.target.value as NewsThumb })}><option value="capitol">Ekonomi</option><option value="gold">Emas</option><option value="bitcoin">Bitcoin</option></select></Field><Field label="Tanggal"><input className="form-field" type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} required /></Field></div><Field label="Judul"><input className="form-field form-field-lg" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field><Field label="Ringkasan"><textarea className="form-field min-h-[110px]" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} required /></Field><Field label="Isi berita"><textarea className="form-field min-h-[320px]" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field></div></section><div className="flex justify-between gap-2"><button type="button" className="btn btn-danger" disabled={!form.id || busy} onClick={() => void remove()}><Trash2 size={15} /> Hapus</button></div></form>
    <aside className="h-fit xl:sticky xl:top-24"><NewsPreview form={form} /></aside>
  </div>;
}

function NewsPreview({ form }: { form: { category: string; title: string; excerpt: string; body: string; thumb: NewsThumb; publishedAt: string } }) { return <section className="producer-panel overflow-hidden"><div className="border-b border-line p-4"><p className="text-sm font-bold">Live Preview</p><p className="mt-1 text-xs text-subtle">Pratinjau artikel news.</p></div><article className="bg-bg"><div className="grid aspect-[16/10] place-items-center bg-bg-alt text-sm font-bold text-subtle">{form.thumb === "bitcoin" ? "₿" : form.thumb === "gold" ? "Au" : "EKONOMI"}</div><div className="p-4"><span className="badge">{form.category}</span><h3 className="mt-3 text-lg font-extrabold leading-tight">{form.title || "Judul news"}</h3><p className="mt-2 text-sm leading-6 text-muted">{form.excerpt || "Ringkasan news akan tampil di sini."}</p><div className="mt-4 flex items-center gap-2 text-xs text-subtle"><Clock3 size={13} /> {form.publishedAt}</div></div></article></section>; }

function EdukasiStudio({ token, items, onChange, busy, setBusy }: { token: string; items: EdukasiItem[]; onChange: () => Promise<void>; busy: boolean; setBusy: (v: boolean) => void }) {
  const empty = useMemo(() => ({ id: undefined as number | undefined, level: "Pemula" as EduLevel, title: "", description: "", body: "", imageUrl: "" }), []);
  const [form, setForm] = useState(empty); const [error, setError] = useState(""); const [query, setQuery] = useState("");
  useEffect(() => { const handler = () => { setForm({ ...empty }); setError(""); }; window.addEventListener("studio:new-education", handler); return () => window.removeEventListener("studio:new-education", handler); }, [empty]);
  async function submit(e: FormEvent) { e.preventDefault(); setError(""); setBusy(true); try { await saveEdukasi({ data: { token, ...form } }); setForm({ ...empty }); await onChange(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); } finally { setBusy(false); } }
  async function remove() { if (!form.id || !confirm("Hapus materi ini secara permanen?")) return; setBusy(true); try { await deleteEdukasi({ data: { token, id: form.id } }); setForm({ ...empty }); await onChange(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menghapus."); } finally { setBusy(false); } }
  const filtered = items.filter((item) => `${item.level} ${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)_320px]"><aside className="producer-panel h-fit overflow-hidden xl:sticky xl:top-24"><div className="border-b border-line p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">Semua Edukasi</p><p className="mt-1 text-xs text-subtle">{items.length} materi</p></div><button type="button" className="icon-btn" onClick={() => setForm({ ...empty })}><Plus size={16} /></button></div><label className="mt-4 flex items-center gap-2 rounded-sm border border-line bg-bg-alt px-3"><Search size={15} className="text-subtle" /><input className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari materi…" /></label></div><div className="max-h-[680px] overflow-auto p-2">{filtered.length ? filtered.map((item) => <button key={item.id} type="button" className={cn("content-list-row", form.id === item.id && "is-active")} onClick={() => setForm(item)}><span className="content-list-thumb"><BookOpen size={15} /></span><span className="min-w-0 flex-1 text-left"><span className="block text-xs text-subtle">{item.level}</span><span className="mt-1 block truncate text-sm font-semibold">{item.title}</span><span className="mt-1 block truncate text-[11px] text-subtle">{item.description}</span></span><ChevronRight size={14} className="text-subtle" /></button>) : <EmptyState text="Tidak ada hasil." />}</div></aside><form onSubmit={submit} className="grid gap-4"><section className="producer-panel overflow-hidden"><div className="sticky-form-head"><div><span className="badge">{form.id ? `ID #${form.id}` : "Konten baru"}</span><h2 className="mt-2 text-xl font-extrabold">{form.title || "Materi baru"}</h2><p className="mt-1 text-xs text-subtle">Susun materi untuk learning path Birustock.</p></div><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan Materi"}</button></div></section>{error ? <div className="rounded-md border border-accent-red/30 bg-accent-red-bg px-4 py-3 text-sm text-accent-red">{error}</div> : null}<section className="producer-panel p-5"><SectionLabel icon={<BookOpen size={15} />} title="Learning Content" note="Struktur materi" /><div className="mt-4 grid gap-4"><Field label="Level"><select className="form-field max-w-xs" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as EduLevel })}><option>Pemula</option><option>Menengah</option><option>Lanjutan</option></select></Field><Field label="Judul"><input className="form-field form-field-lg" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field><Field label="Deskripsi"><textarea className="form-field min-h-[110px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></Field><Field label="Isi materi"><textarea className="form-field min-h-[320px]" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field><ImageField value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} /></div></section><div className="flex justify-start"><button type="button" className="btn btn-danger" disabled={!form.id || busy} onClick={() => void remove()}><Trash2 size={15} /> Hapus</button></div></form><aside className="h-fit xl:sticky xl:top-24"><EducationPreview form={form} /></aside></div>;
}

function EducationPreview({ form }: { form: { level: EduLevel; title: string; description: string; body: string; imageUrl: string } }) { return <section className="producer-panel overflow-hidden"><div className="border-b border-line p-4"><p className="text-sm font-bold">Live Preview</p><p className="mt-1 text-xs text-subtle">Pratinjau materi belajar.</p></div><article className="bg-bg"><div className="aspect-[16/10] bg-bg-alt">{form.imageUrl ? <img src={form.imageUrl} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-xs text-subtle">No image</div>}</div><div className="p-4"><span className="badge">{form.level}</span><h3 className="mt-3 text-lg font-extrabold leading-tight">{form.title || "Judul materi"}</h3><p className="mt-2 text-sm leading-6 text-muted">{form.description || "Deskripsi materi akan tampil di sini."}</p><div className="mt-4 rounded-sm border border-line p-3"><div className="text-[10px] uppercase tracking-[0.12em] text-subtle">Isi</div><p className="mt-2 line-clamp-8 whitespace-pre-line text-xs leading-5 text-muted">{form.body || "Belum ada isi materi."}</p></div></div></article></section>; }

function SectionLabel({ icon, title, note }: { icon: ReactNode; title: string; note: string }) { return <div className="flex items-center gap-3"><span className="section-icon">{icon}</span><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs text-subtle">{note}</p></div></div>; }
function FilterChip({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) { return <button type="button" className={cn("filter-chip", active && "is-active")} onClick={onClick}>{children}</button>; }
function EmptyState({ text }: { text: string }) { return <div className="px-3 py-8 text-center text-sm text-subtle">{text}</div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</span>{children}</label>; }

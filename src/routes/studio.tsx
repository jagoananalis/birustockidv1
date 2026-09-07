import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteAnalisis,
  deleteEdukasi,
  founderLogin,
  founderPing,
  listAnalisisStudio,
  listEdukasi,
  saveAnalisis,
  saveEdukasi,
  type Accent,
  type AnalisisItem,
  type AnalisisStatus,
  type EdukasiItem,
  type EduLevel,
} from "@/lib/content";
import { deleteNews, listNews, saveNews, type NewsItem, type NewsThumb } from "@/lib/news";
import { formatIdDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio")({
  component: StudioPage,
  head: () => ({ meta: [{ title: "Producer Studio | Birustock Indonesia" }] }),
});

const TOKEN_KEY = "bs-producer-token";
const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:8080";

type Tab = "dashboard" | "analisis" | "news" | "edukasi" | "settings";

const STATUS_META: Record<AnalisisStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "status-draft" },
  PUBLISHED: { label: "Published", className: "status-published" },
  ARCHIVED: { label: "Archived", className: "status-archived" },
};

const NAV_ITEMS: Array<{ key: Tab; label: string; icon: ReactNode }> = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { key: "analisis", label: "Analisis", icon: <BarChart3 size={17} /> },
  { key: "news", label: "News", icon: <Newspaper size={17} /> },
  { key: "edukasi", label: "Edukasi", icon: <BookOpen size={17} /> },
];

function StudioPage() {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [analisis, setAnalisis] = useState<AnalisisItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [edukasi, setEdukasi] = useState<EdukasiItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refresh = async () => {
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
    const failed = results.find((result) => result.status === "rejected");
    if (failed?.status === "rejected") {
      setLoadError(failed.reason instanceof Error ? failed.reason.message : "Sebagian konten gagal dimuat.");
    }
  };

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

  const onLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setBusy(true);
    try {
      const res = await founderLogin({ data: { pin } });
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setPin("");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Gagal masuk.");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setTab("dashboard");
  };

  if (checking) return <LoadingScreen />;
  if (!token) return <LoginView pin={pin} setPin={setPin} error={loginError} busy={busy} onLogin={onLogin} />;

  const counts = {
    analisis: analisis.length,
    published: analisis.filter((item) => item.status === "PUBLISHED").length,
    drafts: analisis.filter((item) => item.status === "DRAFT").length,
    archived: analisis.filter((item) => item.status === "ARCHIVED").length,
    news: news.length,
    edukasi: edukasi.length,
  };

  return (
    <div className="producer-app">
      <div className={cn("producer-overlay", sidebarOpen && "is-open")} onClick={() => setSidebarOpen(false)} />
      <aside className={cn("producer-sidebar", sidebarOpen && "is-open")}>
        <div className="producer-brand-block">
          <a href="/" className="producer-brand-lockup">
            <img src="/logo-mark.svg" alt="Birustock" className="producer-logo" />
            <div>
              <div className="producer-brand-name">Birustock</div>
              <div className="producer-brand-sub">PRODUCER</div>
            </div>
          </a>
          <button className="mobile-close" type="button" aria-label="Tutup menu" onClick={() => setSidebarOpen(false)}>
            <X size={17} />
          </button>
        </div>

        <div className="producer-workspace">
          <div className="workspace-avatar">P</div>
          <div className="min-w-0">
            <p className="workspace-title">Studio Birustock</p>
            <p className="workspace-caption">Production Workspace</p>
          </div>
          <span className="live-dot" />
        </div>

        <nav className="producer-nav" aria-label="Navigasi Producer">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={cn("producer-nav-item", tab === item.key && "is-active")}
              onClick={() => {
                setTab(item.key);
                setSidebarOpen(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              <ChevronRight size={14} className="nav-arrow" />
            </button>
          ))}
        </nav>

        <div className="producer-nav-divider" />
        <button type="button" className={cn("producer-nav-item", tab === "settings" && "is-active")} onClick={() => { setTab("settings"); setSidebarOpen(false); }}>
          <span className="nav-icon"><Settings size={17} /></span>
          <span>Settings</span>
          <ChevronRight size={14} className="nav-arrow" />
        </button>

        <div className="producer-sidebar-footer">
          <div className="plan-card">
            <div className="plan-badge"><Sparkles size={13} /> Producer Workspace</div>
            <p>Kelola konten Birustock dari satu tempat.</p>
            <div className="plan-meter"><span style={{ width: "72%" }} /></div>
            <div className="plan-meta"><span>Workspace health</span><b>72%</b></div>
          </div>
          <a href={PUBLIC_SITE_URL} className="sidebar-footer-link"><ChevronRight size={15} /> Website publik</a>
          <button type="button" className="sidebar-footer-link danger" onClick={logout}><LogOut size={15} /> Keluar</button>
        </div>
      </aside>

      <main className="producer-main">
        <header className="producer-topbar">
          <div className="topbar-left">
            <button type="button" className="mobile-menu" aria-label="Buka menu" onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
            <div className="breadcrumbs">
              <span>Producer</span><ChevronRight size={13} /><b>{tabLabel(tab)}</b>
            </div>
          </div>
          <div className="topbar-right">
            <button type="button" className="topbar-icon" aria-label="Bantuan"><CircleHelp size={17} /></button>
            <button type="button" className="topbar-icon notification-dot" aria-label="Notifikasi"><Bell size={17} /></button>
            <div className="profile-pill">
              <span className="profile-avatar">P</span>
              <span className="profile-name">Producer</span>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        {loadError ? <div className="container-wide"><div className="load-alert"><span>{loadError}</span><button type="button" onClick={() => void refresh()}>Coba lagi</button></div></div> : null}

        <div className="container-wide producer-content">
          {tab === "dashboard" ? <Dashboard counts={counts} items={analisis} onSelect={setTab} /> : null}
          {tab === "analisis" ? <AnalisisManager token={token} items={analisis} busy={busy} setBusy={setBusy} onRefresh={refresh} /> : null}
          {tab === "news" ? <NewsManager token={token} items={news} busy={busy} setBusy={setBusy} onRefresh={refresh} /> : null}
          {tab === "edukasi" ? <EdukasiManager token={token} items={edukasi} busy={busy} setBusy={setBusy} onRefresh={refresh} /> : null}
          {tab === "settings" ? <SettingsPage /> : null}
        </div>
      </main>
    </div>
  );
}

function tabLabel(tab: Tab) {
  return { dashboard: "Dashboard", analisis: "Analisis", news: "News", edukasi: "Edukasi", settings: "Settings" }[tab];
}

function LoadingScreen() {
  return <div className="producer-loading"><div className="loading-card"><div className="loading-logo"><img src="/logo-mark.svg" alt="" /></div><div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-block" /></div></div>;
}

function LoginView({ pin, setPin, error, busy, onLogin }: { pin: string; setPin: (value: string) => void; error: string; busy: boolean; onLogin: (event: FormEvent) => void }) {
  return (
    <div className="producer-login">
      <div className="producer-login-art" />
      <div className="login-shell">
        <div className="producer-brand-lockup login-brand">
          <img src="/logo-mark.svg" alt="Birustock" className="producer-logo" />
          <div><div className="producer-brand-name">Birustock</div><div className="producer-brand-sub">PRODUCER</div></div>
        </div>
        <form onSubmit={onLogin} className="login-card">
          <div className="login-kicker">Producer Studio</div>
          <h1>Selamat datang kembali.</h1>
          <p className="login-copy">Masuk ke ruang kerja konten Birustock untuk mengelola analisis, news, dan edukasi.</p>
          {error ? <div className="login-error">{error}</div> : null}
          <label className="field-stack"><span>PIN Studio</span><input className="control" type="password" value={pin} onChange={(event) => setPin(event.target.value)} autoComplete="current-password" placeholder="Masukkan PIN" required /></label>
          <button className="primary-button full" type="submit" disabled={busy}>{busy ? "Memverifikasi…" : "Masuk ke Studio"}</button>
          <p className="login-footnote">Akses internal Producer. Jangan bagikan PIN workspace.</p>
        </form>
      </div>
    </div>
  );
}

type Counts = { analisis: number; published: number; drafts: number; archived: number; news: number; edukasi: number };

function Dashboard({ counts, items, onSelect }: { counts: Counts; items: AnalisisItem[]; onSelect: (tab: Tab) => void }) {
  const recent = [...items].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5);
  return (
    <div className="page-stack">
      <PageHeader eyebrow="Content Command Center" title="Dashboard" description="Pantau konten, status publikasi, dan pekerjaan terbaru dari satu ruang kerja." />

      <section className="hero-strip">
        <div><span className="hero-label">Hari ini di Birustock</span><h2>Semua konten, satu workspace.</h2><p>Bangun, rapikan, dan terbitkan konten tanpa berpindah-pindah alat.</p></div>
        <div className="hero-actions"><button className="secondary-button" type="button" onClick={() => onSelect("analisis")}><BarChart3 size={15} /> Kelola Analisis</button><button className="primary-button" type="button" onClick={() => onSelect("news")}><Plus size={15} /> Tulis News</button></div>
      </section>

      <div className="metric-grid">
        <MetricCard label="Total Analisis" value={counts.analisis} delta="Semua status" icon={<FileText size={17} />} onClick={() => onSelect("analisis")} />
        <MetricCard label="Published" value={counts.published} delta="Tayang ke customer" icon={<Check size={17} />} tone="green" onClick={() => onSelect("analisis")} />
        <MetricCard label="Draft" value={counts.drafts} delta="Perlu dilanjutkan" icon={<Pencil size={17} />} tone="orange" onClick={() => onSelect("analisis")} />
        <MetricCard label="Archived" value={counts.archived} delta="Tidak ditampilkan" icon={<Archive size={17} />} tone="purple" onClick={() => onSelect("analisis")} />
      </div>

      <div className="dashboard-grid">
        <section className="surface-card">
          <SectionTitle title="Konten terbaru" caption="Aktivitas analisis yang terakhir diperbarui." action={<button className="text-button" type="button" onClick={() => onSelect("analisis")}>Buka CMS <ChevronRight size={14} /></button>} />
          <div className="recent-list">
            {recent.length ? recent.map((item) => <RecentRow key={item.id} item={item} />) : <EmptyPanel text="Belum ada analisis." />}
          </div>
        </section>

        <section className="surface-card status-card">
          <SectionTitle title="Status konten" caption="Ringkasan analisis berdasarkan workflow." />
          <div className="status-chart-wrap">
            <div className="status-donut" style={{ background: donutGradient(counts) }}><div className="status-donut-center"><strong>{counts.analisis}</strong><span>Total</span></div></div>
            <div className="status-legend"><LegendRow label="Published" value={counts.published} dot="green" /><LegendRow label="Draft" value={counts.drafts} dot="orange" /><LegendRow label="Archived" value={counts.archived} dot="purple" /></div>
          </div>
        </section>
      </div>

      <div className="quick-grid">
        <QuickCard label="Analisis" value={counts.analisis} note="Kelola market insight" icon={<BarChart3 size={18} />} onClick={() => onSelect("analisis")} />
        <QuickCard label="News" value={counts.news} note="Kelola berita" icon={<Newspaper size={18} />} onClick={() => onSelect("news")} />
        <QuickCard label="Edukasi" value={counts.edukasi} note="Kelola materi belajar" icon={<BookOpen size={18} />} onClick={() => onSelect("edukasi")} />
      </div>
    </div>
  );
}

function donutGradient(c: Counts) {
  const total = Math.max(c.analisis, 1);
  const a = Math.round((c.published / total) * 360);
  const b = Math.round((c.drafts / total) * 360);
  return `conic-gradient(#246bfe 0deg ${a}deg, #ffb35c ${a}deg ${a + b}deg, #8b76ff ${a + b}deg 360deg)`;
}

function MetricCard({ label, value, delta, icon, tone = "blue", onClick }: { label: string; value: number; delta: string; icon: ReactNode; tone?: "blue" | "green" | "orange" | "purple"; onClick: () => void }) {
  return <button className="metric-card" type="button" onClick={onClick}><div className={cn("metric-icon", `tone-${tone}`)}>{icon}</div><div className="metric-value">{value}</div><div className="metric-label">{label}</div><div className="metric-delta">{delta}</div><ChevronRight className="metric-chevron" size={16} /></button>;
}

function RecentRow({ item }: { item: AnalisisItem }) {
  return <div className="recent-row"><div className="thumb-sm" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}>{item.imageUrl ? null : <BarChart3 size={17} />}</div><div className="recent-main"><div className="recent-title">{item.title || "Untitled"}</div><div className="recent-meta">{item.pair} · {item.timeframe} · {formatIdDate(item.updatedAt.slice(0, 10))}</div></div><span className={cn("status-pill", STATUS_META[item.status].className)}>{STATUS_META[item.status].label}</span><MoreHorizontal size={17} className="muted-icon" /></div>;
}

function LegendRow({ label, value, dot }: { label: string; value: number; dot: string }) { return <div className="legend-row"><span className={cn("legend-dot", dot)} /> <span>{label}</span><b>{value}</b></div>; }
function QuickCard({ label, value, note, icon, onClick }: { label: string; value: number; note: string; icon: ReactNode; onClick: () => void }) { return <button className="quick-card" type="button" onClick={onClick}><div className="quick-icon">{icon}</div><div><strong>{label}</strong><p>{value} konten · {note}</p></div><ChevronRight size={15} /></button>; }

function AnalisisManager({ token, items, busy, setBusy, onRefresh }: { token: string; items: AnalisisItem[]; busy: boolean; setBusy: (value: boolean) => void; onRefresh: () => Promise<void> }) {
  const empty = useMemo(() => ({ id: undefined as number | undefined, pair: "XAU/USD", title: "", excerpt: "", body: "", imageUrl: "", accent: "blue" as Accent, publishedAt: new Date().toISOString().slice(0, 10), status: "DRAFT" as AnalisisStatus, timeframe: "H4", bias: "Bullish" as "Bullish" | "Bearish" | "Netral", support: "", resistance: "", target: "", invalidation: "", scenarioBullish: "", scenarioBearish: "" }), []);
  const [form, setForm] = useState(empty);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | AnalisisStatus>("ALL");
  const [error, setError] = useState("");
  const selected = form.id ? items.find((item) => item.id === form.id) : undefined;
  const filtered = items.filter((item) => (filter === "ALL" || item.status === filter) && `${item.pair} ${item.title} ${item.bias} ${item.status}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => { if (typeof window === "undefined") return; const handler = () => setForm(empty); window.addEventListener("studio:new-analysis", handler); return () => window.removeEventListener("studio:new-analysis", handler); }, [empty]);
  const fill = (item: AnalisisItem) => setForm({ id: item.id, pair: item.pair, title: item.title, excerpt: item.excerpt, body: item.body, imageUrl: item.imageUrl, accent: item.accent, publishedAt: item.publishedAt, status: item.status, timeframe: item.timeframe, bias: item.bias as "Bullish" | "Bearish" | "Netral", support: item.support, resistance: item.resistance, target: item.target, invalidation: item.invalidation, scenarioBullish: item.scenarioBullish, scenarioBearish: item.scenarioBearish });
  const save = async (status: AnalisisStatus) => { setError(""); setBusy(true); try { await saveAnalisis({ data: { token, ...form, status } }); await onRefresh(); setForm({ ...form, status }); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); } finally { setBusy(false); } };
  const remove = async () => { if (!form.id || !confirm("Hapus analisis ini secara permanen?")) return; setBusy(true); try { await deleteAnalisis({ data: { token, id: form.id } }); setForm(empty); await onRefresh(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menghapus."); } finally { setBusy(false); } };

  return <div className="page-stack"><PageHeader eyebrow="Analisis CMS" title="Analisis" description="Kelola seluruh market insight dengan workflow draft, publish, dan archive." action={<button className="primary-button" type="button" onClick={() => setForm(empty)}><Plus size={15} /> Analisis Baru</button>} />
    <div className="content-toolbar"><div className="search-control"><Search size={15} /><input placeholder="Cari judul, pair, atau keyword…" value={query} onChange={(e) => setQuery(e.target.value)} /></div><select className="control compact" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option value="ALL">Semua Status</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option></select><button className="secondary-button compact-btn" type="button" onClick={() => void onRefresh()}><RefreshCw size={14} /> Refresh</button></div>
    <div className="cms-grid analysis-grid">
      <section className="surface-card list-card"><SectionTitle title="Semua Analisis" caption={`${filtered.length} dari ${items.length} konten`} /><div className="table-list">{filtered.length ? filtered.map((item) => <button type="button" key={item.id} className={cn("content-list-row", selected?.id === item.id && "is-selected")} onClick={() => fill(item)}><div className="thumb-sm" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}>{item.imageUrl ? null : <BarChart3 size={16} />}</div><div className="row-text"><strong>{item.title || "Untitled"}</strong><span>{item.pair} · {item.timeframe} · {formatIdDate(item.publishedAt)}</span></div><span className={cn("status-pill", STATUS_META[item.status].className)}>{STATUS_META[item.status].label}</span><ChevronRight size={15} /></button>) : <EmptyPanel text="Tidak ada hasil." />}</div></section>
      <AnalysisEditor form={form} setForm={setForm} error={error} busy={busy} save={save} remove={remove} selected={selected} />
      <AnalysisPreview form={form} />
    </div>
  </div>;
}

function AnalysisEditor({ form, setForm, error, busy, save, remove, selected }: { form: any; setForm: (value: any) => void; error: string; busy: boolean; save: (status: AnalisisStatus) => Promise<void>; remove: () => Promise<void>; selected?: AnalisisItem }) {
  return <form className="surface-card editor-card" onSubmit={(e) => { e.preventDefault(); void save(form.status); }}><div className="editor-head"><div><span className="editor-kicker">{form.id ? "Edit konten" : "Konten baru"}</span><h2>{form.id ? form.title || "Untitled" : "Buat Analisis"}</h2></div><span className={cn("status-pill", STATUS_META[form.status as AnalisisStatus].className)}>{STATUS_META[form.status as AnalisisStatus].label}</span></div>{error ? <div className="inline-error">{error}</div> : null}<div className="editor-section"><SectionHeading>Informasi market</SectionHeading><div className="field-grid four"><Field label="Pair"><select className="control" value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })}><option>XAU/USD</option><option>BTC/USD</option><option>EUR/USD</option><option>GBP/USD</option><option>USD/JPY</option></select></Field><Field label="Timeframe"><select className="control" value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })}><option>M15</option><option>H1</option><option>H4</option><option>D1</option><option>W1</option></select></Field><Field label="Bias"><select className="control" value={form.bias} onChange={(e) => setForm({ ...form, bias: e.target.value })}><option>Bullish</option><option>Bearish</option><option>Netral</option></select></Field><Field label="Tanggal tayang"><input className="control" type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} /></Field></div></div>
    <div className="editor-section"><SectionHeading>Market levels</SectionHeading><div className="field-grid four"><Field label="Support"><input className="control" value={form.support} onChange={(e) => setForm({ ...form, support: e.target.value })} placeholder="2,380 - 2,365" /></Field><Field label="Resistance"><input className="control" value={form.resistance} onChange={(e) => setForm({ ...form, resistance: e.target.value })} placeholder="2,420 - 2,450" /></Field><Field label="Target"><input className="control" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></Field><Field label="Invalidation"><input className="control" value={form.invalidation} onChange={(e) => setForm({ ...form, invalidation: e.target.value })} /></Field></div></div>
    <div className="editor-section"><SectionHeading>Konten</SectionHeading><div className="field-grid"><Field label="Judul"><input className="control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Contoh: XAU/USD - Potensi Bullish Lanjutan" required /></Field><Field label="Ringkasan"><textarea className="control textarea-sm" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Ringkasan singkat yang tampil di card customer." required /></Field><Field label="Isi analisis"><textarea className="control textarea-lg" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Tulis isi analisis lengkap di sini…" required /></Field></div></div>
    <div className="editor-section"><SectionHeading>Skenario</SectionHeading><div className="field-grid two"><Field label="Bullish scenario"><textarea className="control textarea-md" value={form.scenarioBullish} onChange={(e) => setForm({ ...form, scenarioBullish: e.target.value })} /></Field><Field label="Bearish scenario"><textarea className="control textarea-md" value={form.scenarioBearish} onChange={(e) => setForm({ ...form, scenarioBearish: e.target.value })} /></Field></div></div>
    <div className="editor-section"><SectionHeading>Media & pengaturan</SectionHeading><div className="field-grid two"><Field label="URL gambar"><input className="control" value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl} placeholder="https://…" onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></Field><Field label="Aksen kartu"><select className="control" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })}><option value="blue">Blue</option><option value="orange">Orange</option><option value="green">Green</option><option value="red">Red</option></select></Field></div></div>
    <div className="editor-footer"><div className="editor-actions-left">{form.id ? <button className="danger-button" type="button" onClick={() => void remove()} disabled={busy}><Trash2 size={14} /> Hapus</button> : null}{form.id && selected?.status === "PUBLISHED" ? <a href={`${PUBLIC_SITE_URL}/analisis/${selected.slug}`} className="secondary-button" target="_blank" rel="noreferrer">Lihat publik</a> : null}</div><div className="editor-actions-right"><button className="secondary-button" type="button" onClick={() => setForm({ ...form, status: "DRAFT" })}>Simpan Draft</button><button className="primary-button" type="button" onClick={() => void save("PUBLISHED")} disabled={busy}>{busy ? "Menyimpan…" : "Publish"}</button></div></div></form>;
}

function AnalysisPreview({ form }: { form: any }) {
  return <aside className="surface-card preview-card"><SectionTitle title="Preview" caption="Simulasi tampilan konten customer."/><article className="preview-shell"><div className="preview-image" style={form.imageUrl ? { backgroundImage: `url(${form.imageUrl})` } : undefined}>{form.imageUrl ? null : <><BarChart3 size={25} /><span>Cover image</span></>}</div><div className="preview-body"><div className="preview-meta"><span className={cn("status-pill", `accent-${form.accent}`)}>{form.pair}</span><span>{form.timeframe} · {form.publishedAt}</span></div><div className="preview-bias">{form.bias}</div><h3>{form.title || "Judul analisis"}</h3><p>{form.excerpt || "Ringkasan analisis akan tampil di sini."}</p><div className="preview-levels"><PreviewLevel label="Support" value={form.support} /><PreviewLevel label="Resistance" value={form.resistance} /><PreviewLevel label="Target" value={form.target} /><PreviewLevel label="Invalidation" value={form.invalidation} /></div><div className="preview-scenario"><div><span>Bullish</span><p>{form.scenarioBullish || "Belum diisi."}</p></div><div><span>Bearish</span><p>{form.scenarioBearish || "Belum diisi."}</p></div></div></div></article></aside>;
}
function PreviewLevel({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value || "—"}</strong></div>; }

function NewsManager({ token, items, busy, setBusy, onRefresh }: { token: string; items: NewsItem[]; busy: boolean; setBusy: (value: boolean) => void; onRefresh: () => Promise<void> }) {
  const empty = useMemo(() => ({ id: undefined as number | undefined, category: "Ekonomi Global", title: "", excerpt: "", body: "", thumb: "capitol" as NewsThumb, publishedAt: new Date().toISOString().slice(0, 10) }), []);
  const [form, setForm] = useState(empty); const [query, setQuery] = useState(""); const [error, setError] = useState("");
  const filtered = items.filter((item) => `${item.category} ${item.title}`.toLowerCase().includes(query.toLowerCase()));
  const fill = (item: NewsItem) => setForm({ id: item.id, category: item.category, title: item.title, excerpt: item.excerpt, body: item.body.join("\n\n"), thumb: item.thumb, publishedAt: item.publishedAt });
  const save = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(""); try { await saveNews({ data: { token, ...form } }); setForm(empty); await onRefresh(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); } finally { setBusy(false); } };
  const remove = async () => { if (!form.id || !confirm("Hapus news ini secara permanen?")) return; setBusy(true); try { await deleteNews({ data: { token, id: form.id } }); setForm(empty); await onRefresh(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menghapus."); } finally { setBusy(false); } };
  return <div className="page-stack"><PageHeader eyebrow="News CMS" title="News" description="Kelola berita dan editorial content dalam satu workspace." action={<button className="primary-button" type="button" onClick={() => setForm(empty)}><Plus size={15} /> News Baru</button>} /><div className="content-toolbar"><div className="search-control"><Search size={15} /><input placeholder="Cari berita…" value={query} onChange={(e) => setQuery(e.target.value)} /></div><button className="secondary-button compact-btn" type="button" onClick={() => void onRefresh()}><RefreshCw size={14} /> Refresh</button></div><div className="cms-grid"><section className="surface-card list-card"><SectionTitle title="Semua News" caption={`${filtered.length} konten`} /><div className="table-list">{filtered.length ? filtered.map((item) => <button key={item.id} type="button" className={cn("content-list-row", form.id === item.id && "is-selected")} onClick={() => fill(item)}><div className={cn("thumb-sm", `thumb-${item.thumb}`)}><Newspaper size={16} /></div><div className="row-text"><strong>{item.title}</strong><span>{item.category} · {formatIdDate(item.publishedAt)}</span></div><span className="status-pill status-published">Published</span><ChevronRight size={15} /></button>) : <EmptyPanel text="Belum ada news." />}</div></section><form className="surface-card editor-card" onSubmit={save}><div className="editor-head"><div><span className="editor-kicker">{form.id ? "Edit editorial" : "Konten baru"}</span><h2>{form.id ? form.title || "Untitled" : "Buat News"}</h2></div></div>{error ? <div className="inline-error">{error}</div> : null}<div className="editor-section"><SectionHeading>Informasi editorial</SectionHeading><div className="field-grid three"><Field label="Kategori"><input className="control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></Field><Field label="Visual"><select className="control" value={form.thumb} onChange={(e) => setForm({ ...form, thumb: e.target.value as NewsThumb })}><option value="capitol">Ekonomi</option><option value="gold">Emas</option><option value="bitcoin">Bitcoin</option></select></Field><Field label="Tanggal"><input className="control" type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} /></Field></div></div><div className="editor-section"><SectionHeading>Konten</SectionHeading><div className="field-grid"><Field label="Judul"><input className="control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field><Field label="Ringkasan"><textarea className="control textarea-sm" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} required /></Field><Field label="Isi berita"><textarea className="control textarea-lg" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field></div></div><div className="editor-footer"><div>{form.id ? <button className="danger-button" type="button" onClick={() => void remove()} disabled={busy}><Trash2 size={14} /> Hapus</button> : null}</div><button className="primary-button" type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan News"}</button></div></form></div></div>;
}

function EdukasiManager({ token, items, busy, setBusy, onRefresh }: { token: string; items: EdukasiItem[]; busy: boolean; setBusy: (value: boolean) => void; onRefresh: () => Promise<void> }) {
  const empty = useMemo(() => ({ id: undefined as number | undefined, slug: undefined as string | undefined, level: "Pemula" as EduLevel, title: "", description: "", body: "", imageUrl: "" }), []);
  const [form, setForm] = useState(empty); const [query, setQuery] = useState(""); const [error, setError] = useState("");
  const filtered = items.filter((item) => `${item.level} ${item.title}`.toLowerCase().includes(query.toLowerCase()));
  const fill = (item: EdukasiItem) => setForm(item);
  const save = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(""); try { await saveEdukasi({ data: { token, ...form } }); setForm(empty); await onRefresh(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); } finally { setBusy(false); } };
  const remove = async () => { if (!form.id || !confirm("Hapus materi ini secara permanen?")) return; setBusy(true); try { await deleteEdukasi({ data: { token, id: form.id } }); setForm(empty); await onRefresh(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menghapus."); } finally { setBusy(false); } };
  return <div className="page-stack"><PageHeader eyebrow="Edukasi CMS" title="Edukasi" description="Susun materi belajar Birustock dari pemula sampai lanjutan." action={<button className="primary-button" type="button" onClick={() => setForm(empty)}><Plus size={15} /> Edukasi Baru</button>} /><div className="content-toolbar"><div className="search-control"><Search size={15} /><input placeholder="Cari materi…" value={query} onChange={(e) => setQuery(e.target.value)} /></div><button className="secondary-button compact-btn" type="button" onClick={() => void onRefresh()}><RefreshCw size={14} /> Refresh</button></div><div className="cms-grid"><section className="surface-card list-card"><SectionTitle title="Semua Edukasi" caption={`${filtered.length} materi`} /><div className="table-list">{filtered.length ? filtered.map((item) => <button key={item.id} type="button" className={cn("content-list-row", form.id === item.id && "is-selected")} onClick={() => fill(item)}><div className="thumb-sm edu-thumb"><BookOpen size={16} /></div><div className="row-text"><strong>{item.title}</strong><span>{item.level}</span></div><span className="level-pill">{item.level}</span><ChevronRight size={15} /></button>) : <EmptyPanel text="Belum ada materi." />}</div></section><form className="surface-card editor-card" onSubmit={save}><div className="editor-head"><div><span className="editor-kicker">{form.id ? "Edit materi" : "Konten baru"}</span><h2>{form.id ? form.title || "Untitled" : "Buat Edukasi"}</h2></div><span className="level-pill">{form.level}</span></div>{error ? <div className="inline-error">{error}</div> : null}<div className="editor-section"><SectionHeading>Informasi materi</SectionHeading><div className="field-grid two"><Field label="Level"><select className="control" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as EduLevel })}><option>Pemula</option><option>Menengah</option><option>Lanjutan</option></select></Field><Field label="URL gambar"><input className="control" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" /></Field></div></div><div className="editor-section"><SectionHeading>Konten</SectionHeading><div className="field-grid"><Field label="Judul"><input className="control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field><Field label="Ringkasan"><textarea className="control textarea-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></Field><Field label="Isi materi"><textarea className="control textarea-lg" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field></div></div><div className="editor-footer"><div>{form.id ? <button className="danger-button" type="button" onClick={() => void remove()} disabled={busy}><Trash2 size={14} /> Hapus</button> : null}</div><button className="primary-button" type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan Materi"}</button></div></form></div></div>;
}

function SettingsPage() {
  return <div className="page-stack"><PageHeader eyebrow="Workspace" title="Settings" description="Pengaturan dasar untuk workspace Producer Birustock." /><div className="settings-grid"><section className="surface-card setting-card"><div className="setting-head"><div className="setting-icon"><Settings size={17} /></div><div><h3>Workspace</h3><p>Identitas ruang kerja internal.</p></div></div><Field label="Nama workspace"><input className="control" value="Birustock Producer" readOnly /></Field><Field label="Environment"><input className="control" value="Production" readOnly /></Field><div className="connected-badge"><span /> Neon database connected</div></section><section className="surface-card setting-card"><div className="setting-head"><div className="setting-icon green"><Bell size={17} /></div><div><h3>Notifications</h3><p>Kontrol notifikasi workspace.</p></div></div><ToggleRow label="Konten baru dipublish" checked /><ToggleRow label="Draft belum diperbarui" checked /><ToggleRow label="Update sistem" checked={false} /></section></div></div>;
}
function ToggleRow({ label, checked }: { label: string; checked: boolean }) { return <div className="toggle-row"><span>{label}</span><div className={cn("switch", checked && "is-on")}><span /></div></div>; }

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) { return <div className="page-header"><div><div className="page-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action ? <div>{action}</div> : null}</div>; }
function SectionTitle({ title, caption, action }: { title: string; caption?: string; action?: ReactNode }) { return <div className="section-title"><div><h3>{title}</h3>{caption ? <p>{caption}</p> : null}</div>{action}</div>; }
function SectionHeading({ children }: { children: ReactNode }) { return <div className="section-heading">{children}</div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field-stack"><span>{label}</span>{children}</label>; }
function EmptyPanel({ text }: { text: string }) { return <div className="empty-panel">{text}</div>; }


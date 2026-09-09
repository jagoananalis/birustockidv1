import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BrandLockup } from "@/components/brand-mark";
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Upload,
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
const CACHE_PREFIX = "bs-producer-cache-v1";

function usePersistentState<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}:${key}`);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      // Ignore malformed/expired local cache and keep the normal defaults.
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(`${CACHE_PREFIX}:${key}`, JSON.stringify(value));
    } catch {
      // Storage may be unavailable or full; the editor itself must remain usable.
    }
  }, [hydrated, key, value]);

  return [value, setValue, hydrated] as const;
}

function clearPersistentState(key: string) {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}:${key}`);
  } catch {
    // Ignore storage failures.
  }
}

type Tab = "dashboard" | "analisis" | "news" | "edukasi" | "settings";
type AnalysisSection = "overview" | "content" | "market" | "scenario" | "media";
type NewsSection = "overview" | "content" | "media";
type EducationSection = "overview" | "content" | "media";

const STATUS_META: Record<AnalisisStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "status-draft" },
  PUBLISHED: { label: "Published", className: "status-published" },
  ARCHIVED: { label: "Archived", className: "status-archived" },
};

type AnalisisForm = {
  id?: number;
  slug?: string;
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
};

type NewsForm = {
  id?: number;
  slug?: string;
  category: string;
  title: string;
  excerpt: string;
  body: string;
  thumb: NewsThumb;
  publishedAt: string;
};

type EdukasiForm = {
  id?: number;
  slug?: string;
  level: EduLevel;
  title: string;
  description: string;
  body: string;
  imageUrl: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyAnalisis = (): AnalisisForm => ({
  pair: "XAU/USD",
  title: "",
  excerpt: "",
  body: "",
  imageUrl: "",
  accent: "blue",
  publishedAt: today(),
  status: "DRAFT",
  timeframe: "H4",
  bias: "Bullish",
  support: "",
  resistance: "",
  target: "",
  invalidation: "",
  scenarioBullish: "",
  scenarioBearish: "",
});

const emptyNews = (): NewsForm => ({
  category: "Ekonomi Global",
  title: "",
  excerpt: "",
  body: "",
  thumb: "capitol",
  publishedAt: today(),
});

const emptyEdukasi = (): EdukasiForm => ({
  level: "Pemula",
  title: "",
  description: "",
  body: "",
  imageUrl: "",
});

function StudioPage() {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = usePersistentState<Tab>("studio:tab", "dashboard");
  const [analisis, setAnalisis] = useState<AnalisisItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [edukasi, setEdukasi] = useState<EdukasiItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selection, setSelection] = usePersistentState<{ tab: Tab; id: number } | null>("studio:selection", null);
  const globalSearchRef = useRef<HTMLInputElement | null>(null);

  const globalResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return [];
    return [
      ...analisis.map((item) => ({ tab: "analisis" as const, id: item.id, eyebrow: item.pair, title: item.title, meta: `${item.status} · ${item.timeframe}` })),
      ...news.map((item) => ({ tab: "news" as const, id: item.id, eyebrow: item.category, title: item.title, meta: formatIdDate(item.publishedAt) })),
      ...edukasi.map((item) => ({ tab: "edukasi" as const, id: item.id, eyebrow: item.level, title: item.title, meta: "Materi belajar" })),
    ].filter((item) => `${item.eyebrow} ${item.title} ${item.meta}`.toLowerCase().includes(q)).slice(0, 8);
  }, [analisis, news, edukasi, globalQuery]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setGlobalSearchOpen(true);
        requestAnimationFrame(() => globalSearchRef.current?.focus());
      }
      if (event.key === "Escape") {
        setGlobalSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function refresh() {
    if (!token) return;
    setRefreshing(true);
    setGlobalError("");
    const results = await Promise.allSettled([
      listAnalisisStudio({ data: { token } }),
      listNews(),
      listEdukasi(),
    ]);
    const [a, n, e] = results;
    const errors: string[] = [];
    if (a.status === "fulfilled") setAnalisis(a.value);
    else errors.push("Analisis gagal dimuat");
    if (n.status === "fulfilled") setNews(n.value);
    else errors.push("News gagal dimuat");
    if (e.status === "fulfilled") setEdukasi(e.value);
    else errors.push("Edukasi gagal dimuat");
    if (errors.length) setGlobalError(`${errors.join(" · ")}. Coba refresh lagi.`);
    setRefreshing(false);
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

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setTab("dashboard");
    setAnalisis([]);
    setNews([]);
    setEdukasi([]);
  }

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

  if (checking) return <LoadingScreen />;

  if (!token) {
    return (
      <main className="producer-auth">
        <div className="producer-auth-glow" />
        <form onSubmit={onLogin} className="producer-auth-card">
          <div className="producer-auth-brand">
            <div className="brand-mark-small">B</div>
            <div>
              <div className="producer-auth-brand-name">Birustock</div>
              <div className="producer-auth-brand-sub">Producer Workspace</div>
            </div>
          </div>
          <div className="producer-auth-copy">
            <span className="eyebrow">Private Workspace</span>
            <h1>Masuk ke Studio</h1>
            <p>Kelola analisis, news, dan edukasi dari satu workspace yang fokus pada publishing.</p>
          </div>
          {error ? <div className="inline-error">{error}</div> : null}
          <Field label="PIN Studio">
            <input id="pin" type="password" className="control control-lg" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="current-password" placeholder="Masukkan PIN" required />
          </Field>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? "Memeriksa…" : "Masuk ke Studio"}</button>
          <div className="producer-auth-foot"><CircleHelp size={14} /><span>Akses internal Producer.</span></div>
        </form>
      </main>
    );
  }

  return (
    <main className="producer-app">
      <header className="producer-topbar">
        <div className="producer-topbar-inner">
          <div className="producer-topbar-brand"><button type="button" className="producer-mobile-trigger" onClick={() => setMobileNav(true)} aria-label="Buka navigasi"><Menu size={19} /></button><BrandLockup /></div>
          <div className="producer-topbar-search-wrap">
            <label className={cn("producer-topbar-search", globalSearchOpen && "is-focused")}>
              <Search size={16} />
              <input ref={globalSearchRef} value={globalQuery} onChange={(event) => { setGlobalQuery(event.target.value); setGlobalSearchOpen(true); }} onFocus={() => setGlobalSearchOpen(true)} placeholder="Cari konten, judul, atau topik…" aria-label="Cari konten" />
              <button type="button" className="search-clear" onClick={() => { setGlobalQuery(""); setGlobalSearchOpen(false); globalSearchRef.current?.focus(); }} aria-label="Bersihkan pencarian" hidden={!globalQuery}><X size={14} /></button>
              <kbd>Ctrl K</kbd>
            </label>
            {globalSearchOpen ? <div className="global-search-popover">
              {globalQuery ? (globalResults.length ? <div className="global-search-results">{globalResults.map((result) => <button key={`${result.tab}-${result.id}`} type="button" className="global-search-result" onClick={() => { setTab(result.tab); setSelection({ tab: result.tab, id: result.id }); setGlobalSearchOpen(false); setGlobalQuery(""); }}><span className="global-search-result-icon">{result.tab === "analisis" ? <BarChart3 size={15} /> : result.tab === "news" ? <Newspaper size={15} /> : <BookOpen size={15} />}</span><span className="global-search-result-copy"><strong>{result.title}</strong><small>{result.eyebrow} · {result.meta}</small></span><ChevronRight size={14} /></button>)}</div> : <div className="global-search-empty"><Search size={16} /><span>Tidak menemukan konten yang cocok.</span></div>) : <div className="global-search-empty"><Search size={16} /><span>Ketik untuk mencari Analisis, News, atau Edukasi.</span></div>}
            </div> : null}
          </div>
          <div className="producer-topbar-actions">
            <button type="button" className="icon-btn" title="Refresh data" aria-label="Refresh data" onClick={() => void refresh()} disabled={refreshing}><RefreshCw size={17} className={cn(refreshing && "animate-spin")} /></button>
            <div className="topbar-popover-wrap">
              <button type="button" className={cn("icon-btn", notificationsOpen && "is-active")} title="Notifikasi" aria-label="Notifikasi" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false); }}><Bell size={17} />{(globalError || analisis.some((item) => item.status === "DRAFT")) ? <span className="notification-dot" /> : null}</button>
              {notificationsOpen ? <div className="topbar-popover notifications-popover"><div className="topbar-popover-head"><div><strong>Notifikasi</strong><small>Ringkasan workspace</small></div><button type="button" className="icon-btn tiny" onClick={() => setNotificationsOpen(false)} aria-label="Tutup"><X size={14} /></button></div><div className="notification-list">{globalError ? <div className="notification-item warning"><span className="notification-item-icon"><CircleHelp size={15} /></span><span><strong>Ada masalah pemuatan</strong><small>{globalError}</small></span></div> : null}{analisis.filter((item) => item.status === "DRAFT").slice(0, 3).map((item) => <button type="button" className="notification-item" key={item.id} onClick={() => { setTab("analisis"); setSelection({ tab: "analisis", id: item.id }); setNotificationsOpen(false); }}><span className="notification-item-icon"><PencilLine size={15} /></span><span><strong>Draft menunggu dilanjutkan</strong><small>{item.title}</small></span></button>)}{!globalError && !analisis.some((item) => item.status === "DRAFT") ? <div className="notification-empty"><Check size={16} /><span>Tidak ada notifikasi baru.</span></div> : null}</div></div> : null}
            </div>
            <div className="topbar-popover-wrap">
              <button type="button" className={cn("producer-profile", profileOpen && "is-active")} aria-expanded={profileOpen} onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }}><span className="producer-avatar">P</span><span className="producer-profile-copy"><strong>Producer</strong><small>Birustock</small></span><ChevronDown size={14} className={cn("text-subtle", profileOpen && "rotate-180")} /></button>
              {profileOpen ? <div className="topbar-popover profile-popover"><button type="button" className="profile-action" onClick={() => window.open(PUBLIC_SITE_URL, "_blank")}><ExternalLink size={15} /><span>Website publik</span></button><button type="button" className="profile-action" onClick={() => { setTab("settings"); setProfileOpen(false); }}><Settings2 size={15} /><span>Pengaturan</span></button><div className="profile-divider" /><button type="button" className="profile-action danger-link" onClick={logout}><LogOut size={15} /><span>Keluar</span></button></div> : null}
            </div>
          </div>
        </div>
      </header>

      <div className="producer-layout">
        <aside className={cn("producer-sidebar", mobileNav && "is-mobile-open")}>
          <div className="producer-sidebar-mobile-head"><span>Menu</span><button type="button" className="icon-btn" onClick={() => setMobileNav(false)} aria-label="Tutup navigasi"><X size={18} /></button></div>
          <div className="producer-sidebar-brand"><div className="producer-sidebar-mark">B</div><div><div className="producer-sidebar-title">Birustock</div><div className="producer-sidebar-sub">Producer</div></div></div>
          <div className="producer-workspace-card"><div className="workspace-topline"><span>Workspace</span><span className="workspace-status"><i />Live</span></div><strong>Birustock Production</strong><div className="workspace-progress"><span style={{ width: "74%" }} /></div><div className="workspace-meta"><span>Content capacity</span><strong>74%</strong></div></div>
          <nav className="producer-nav" aria-label="Producer Navigation">
            <ProducerNavItem icon={<LayoutDashboard size={17} />} label="Dashboard" active={tab === "dashboard"} onClick={() => { setTab("dashboard"); setSelection(null); setMobileNav(false); }} />
            <ProducerNavItem icon={<BarChart3 size={17} />} label="Analisis" count={analisis.length} active={tab === "analisis"} onClick={() => { setTab("analisis"); setSelection(null); setMobileNav(false); }} />
            <ProducerNavItem icon={<Newspaper size={17} />} label="News" count={news.length} active={tab === "news"} onClick={() => { setTab("news"); setSelection(null); setMobileNav(false); }} />
            <ProducerNavItem icon={<BookOpen size={17} />} label="Edukasi" count={edukasi.length} active={tab === "edukasi"} onClick={() => { setTab("edukasi"); setSelection(null); setMobileNav(false); }} />
            <ProducerNavItem icon={<Settings2 size={17} />} label="Pengaturan" active={tab === "settings"} onClick={() => { setTab("settings"); setSelection(null); setMobileNav(false); }} />
          </nav>
          <div className="producer-sidebar-foot"><button type="button" className="producer-nav-secondary" onClick={() => window.open(PUBLIC_SITE_URL, "_blank")}><ExternalLink size={16} /><span>Website publik</span><ArrowUpRight size={14} /></button><button type="button" className="producer-nav-secondary danger-link" onClick={logout}><LogOut size={16} /><span>Keluar</span></button></div>
        </aside>
        {mobileNav ? <button aria-label="Tutup navigasi" className="producer-mobile-backdrop" onClick={() => setMobileNav(false)} /> : null}

        <section className="producer-main">
          {globalError ? <div className="workspace-alert"><span>{globalError}</span><button type="button" onClick={() => void refresh()}><RefreshCw size={14} /> Refresh</button></div> : null}
          {tab === "dashboard" ? <Dashboard analisis={analisis} news={news} edukasi={edukasi} onSelect={setTab} /> : null}
          {tab === "analisis" ? <AnalisisStudio token={token} items={analisis} onChange={refresh} busy={busy} setBusy={setBusy} selectId={selection?.tab === "analisis" ? selection.id : null} /> : null}
          {tab === "news" ? <NewsStudio token={token} items={news} onChange={refresh} busy={busy} setBusy={setBusy} selectId={selection?.tab === "news" ? selection.id : null} /> : null}
          {tab === "edukasi" ? <EdukasiStudio token={token} items={edukasi} onChange={refresh} busy={busy} setBusy={setBusy} selectId={selection?.tab === "edukasi" ? selection.id : null} /> : null}
          {tab === "settings" ? <SettingsPage /> : null}
        </section>
      </div>
    </main>
  );
}

function LoadingScreen() {
  return <section className="producer-loading"><div className="producer-loading-card"><div className="skeleton h-12 w-12 rounded-2xl" /><div className="skeleton h-4 w-40" /><div className="skeleton h-3 w-28" /></div></section>;
}

function ProducerNavItem({ icon, label, count, active, onClick }: { icon: ReactNode; label: string; count?: number; active: boolean; onClick: () => void }) {
  return <button type="button" className={cn("producer-nav-item", active && "is-active")} onClick={onClick}><span className="nav-item-icon">{icon}</span><span className="nav-item-label">{label}</span>{typeof count === "number" ? <span className="nav-item-count">{count}</span> : null}</button>;
}

function Dashboard({ analisis, news, edukasi, onSelect }: { analisis: AnalisisItem[]; news: NewsItem[]; edukasi: EdukasiItem[]; onSelect: (tab: Tab) => void }) {
  const published = analisis.filter((item) => item.status === "PUBLISHED").length;
  const drafts = analisis.filter((item) => item.status === "DRAFT").length;
  const archived = analisis.filter((item) => item.status === "ARCHIVED").length;
  const total = analisis.length + news.length + edukasi.length;
  const recent = [...analisis].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 5);
  return (
    <div className="producer-page producer-dashboard-page">
      <PageHeader eyebrow="Content Command Center" title="Dashboard" description="Pantau pekerjaan editorial dan lanjutkan konten dari satu tempat."><span className="page-date"><Clock3 size={14} /> {formatIdDate(today())}</span></PageHeader>
      <div className="metric-grid">
        <MetricCard icon={<BarChart3 size={18} />} label="Total Analisis" value={analisis.length} detail={`${published} tayang · ${drafts} draft`} onClick={() => onSelect("analisis")} />
        <MetricCard icon={<Newspaper size={18} />} label="Total News" value={news.length} detail="Konten editorial tersimpan" onClick={() => onSelect("news")} />
        <MetricCard icon={<BookOpen size={18} />} label="Total Edukasi" value={edukasi.length} detail="Materi learning path" onClick={() => onSelect("edukasi")} />
        <MetricCard icon={<FileText size={18} />} label="Total Konten" value={total} detail="Semua modul Producer" onClick={() => onSelect("dashboard")} />
      </div>
      <div className="dashboard-grid-main">
        <section className="surface-card dashboard-card status-card"><PanelHeader title="Status Analisis" description="Distribusi status khusus konten analisis." /><div className="status-summary"><div className="status-ring" style={{ background: `conic-gradient(#1769ff 0 ${published / Math.max(analisis.length, 1) * 360}deg, #8fb7ff ${published / Math.max(analisis.length, 1) * 360}deg ${(published + drafts) / Math.max(analisis.length, 1) * 360}deg, #dbe8ff ${(published + drafts) / Math.max(analisis.length, 1) * 360}deg 360deg)` }}><div><strong>{analisis.length}</strong><span>Total</span></div></div><div className="legend-list"><LegendRow dot="dot-blue" label="Published" value={published} /><LegendRow dot="dot-soft" label="Draft" value={drafts} /><LegendRow dot="dot-gray" label="Archived" value={archived} /></div></div></section>
        <section className="surface-card dashboard-card"><PanelHeader title="Konten Terbaru" description="Terakhir diperbarui." action={<button type="button" className="link-arrow" onClick={() => onSelect("analisis")}>Lihat semua <ChevronRight size={14} /></button>} /><div className="recent-list">{recent.length ? recent.map((item) => <button key={item.id} type="button" className="recent-item" onClick={() => onSelect("analisis")}><Thumb src={item.imageUrl} fallback={item.pair} className="recent-thumb" /><span><strong>{item.title}</strong><small>{item.pair} · {formatIdDate(item.publishedAt)}</small></span><span className={cn("status-pill", STATUS_META[item.status].className)}>{STATUS_META[item.status].label}</span></button>) : <EmptyState text="Belum ada analisis." />}</div></section>
      </div>
      <div className="dashboard-grid-secondary">
        <section className="surface-card dashboard-card"><PanelHeader title="Quick Actions" description="Mulai pekerjaan baru tanpa berpindah menu." /><div className="quick-action-grid"><QuickAction icon={<BarChart3 size={17} />} label="Analisis Baru" detail="Market setup & scenario" onClick={() => onSelect("analisis")} /><QuickAction icon={<Newspaper size={17} />} label="News Baru" detail="Editorial content" onClick={() => onSelect("news")} /><QuickAction icon={<BookOpen size={17} />} label="Edukasi Baru" detail="Learning material" onClick={() => onSelect("edukasi")} /></div></section>
        <section className="surface-card dashboard-card"><PanelHeader title="Publishing Queue" description="Draft analisis yang perlu diselesaikan atau dipublikasikan." action={<button type="button" className="link-arrow" onClick={() => onSelect("analisis")}>Buka Analisis <ChevronRight size={14} /></button>} /><div className="queue-list">{drafts ? analisis.filter((item) => item.status === "DRAFT").slice(0, 3).map((item) => <button key={item.id} type="button" className="queue-item" onClick={() => onSelect("analisis")}><span className="queue-index">D</span><span className="queue-copy"><strong>{item.title}</strong><small>{item.pair} · {item.timeframe} · {formatIdDate(item.updatedAt || item.publishedAt)}</small></span><span className="queue-action"><span className="status-pill status-draft">Draft</span><ChevronRight size={15} /></span></button>) : <div className="queue-empty"><Check size={16} /><div><strong>Queue bersih</strong><small>Tidak ada draft analisis yang menunggu perhatian.</small></div></div>}</div></section>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, onClick }: { icon: ReactNode; label: string; value: number; detail: string; onClick: () => void }) {
  return <button type="button" className="metric-card" onClick={onClick}><div className="metric-icon">{icon}</div><div className="metric-value">{value}</div><div className="metric-label">{label}</div><div className="metric-detail">{detail}</div><ChevronRight size={16} className="metric-arrow" /></button>;
}
function LegendRow({ dot, label, value }: { dot: string; label: string; value: number }) { return <div className="legend-row"><span className={cn("legend-dot", dot)} /> <span>{label}</span><strong>{value}</strong></div>; }
function QuickAction({ icon, label, detail, onClick }: { icon: ReactNode; label: string; detail: string; onClick: () => void }) { return <button type="button" className="quick-action" onClick={onClick}><span className="quick-action-icon">{icon}</span><span><strong>{label}</strong><small>{detail}</small></span><ChevronRight size={15} /></button>; }

function AnalisisStudio({ token, items, onChange, busy, setBusy, selectId }: { token: string; items: AnalisisItem[]; onChange: () => Promise<void>; busy: boolean; setBusy: (v: boolean) => void; selectId?: number | null }) {
  const [form, setForm, formHydrated] = usePersistentState<AnalisisForm>("analisis:form", emptyAnalisis);
  const [query, setQuery] = usePersistentState<string>("analisis:query", "");
  const [statusFilter, setStatusFilter] = usePersistentState<"ALL" | AnalisisStatus>("analisis:status-filter", "ALL");
  const [section, setSection] = usePersistentState<AnalysisSection>("analisis:section", "overview");
  const [error, setError] = useState("");
  const filtered = useMemo(() => items.filter((item) => {
    const matchesText = `${item.title} ${item.pair} ${item.bias}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesText && matchesStatus;
  }), [items, query, statusFilter]);

  useEffect(() => {
    if (!formHydrated || selectId == null) return;
    // Restore the unsaved local draft for this same record after data arrives.
    if (form.id === selectId) return;
    const item = items.find((candidate) => candidate.id === selectId);
    if (item) fill(item);
  }, [formHydrated, items, selectId, form.id]);

  function fill(item: AnalisisItem) {
    setForm({ id: item.id, slug: item.slug, pair: item.pair, title: item.title, excerpt: item.excerpt, body: item.body, imageUrl: item.imageUrl, accent: item.accent, publishedAt: item.publishedAt, status: item.status, timeframe: item.timeframe, bias: item.bias as AnalisisForm["bias"], support: item.support, resistance: item.resistance, target: item.target, invalidation: item.invalidation, scenarioBullish: item.scenarioBullish, scenarioBearish: item.scenarioBearish });
    setSection("overview");
    setError("");
  }

  async function save(status: AnalisisStatus) {
    setError("");
    setBusy(true);
    try { await saveAnalisis({ data: { token, ...form, status } }); setForm((prev) => ({ ...prev, status })); clearPersistentState("analisis:form"); await onChange(); }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!form.id || !confirm("Hapus analisis ini? Data akan dihapus permanen dari database.")) return;
    setBusy(true);
    try { await deleteAnalisis({ data: { token, id: form.id } }); clearPersistentState("analisis:form"); setForm(emptyAnalisis()); await onChange(); }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal menghapus."); }
    finally { setBusy(false); }
  }

  return (
    <div className="producer-page editor-page">
      <PageHeader eyebrow="Analisis CMS" title="Analisis" description="Kelola insight market dengan struktur yang rapi, cepat diedit, dan siap dipublikasikan."><button type="button" className="btn btn-primary" onClick={() => { clearPersistentState("analisis:form"); setForm(emptyAnalisis()); setSection("overview"); }}><Plus size={16} /> Analisis Baru</button></PageHeader>
      <div className="editor-layout">
        <aside className="surface-card content-library">
          <div className="content-library-head"><div><span className="panel-eyebrow">Content library</span><h2>Semua Analisis</h2><p>{items.length} konten</p></div><button type="button" className="icon-btn subtle-icon" onClick={() => { clearPersistentState("analisis:form"); setForm(emptyAnalisis()); }} title="Analisis baru"><Plus size={17} /></button></div>
          <div className="library-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari pair atau judul..." /></div>
          <FilterChips value={statusFilter} onChange={setStatusFilter} />
          <div className="content-library-scroll">{filtered.map((item) => <button key={item.id} type="button" className={cn("library-item", form.id === item.id && "is-selected")} onClick={() => fill(item)}><Thumb src={item.imageUrl} fallback={item.pair} className="library-thumb" /><span className="library-item-main"><span className="library-item-meta"><strong>{item.pair}</strong><span className={cn("status-pill", STATUS_META[item.status].className)}>{STATUS_META[item.status].label}</span></span><strong className="library-item-title">{item.title}</strong><small>{item.timeframe} · {item.bias} · {formatIdDate(item.publishedAt)}</small></span><ChevronRight size={15} /></button>)}{!filtered.length ? <EmptyState text="Tidak ada konten yang cocok." /> : null}</div>
          <div className="library-footer"><span>Total {items.length} analisis</span><span>Sorted by update</span></div>
        </aside>

        <section className="editor-workspace">
          <form onSubmit={(e) => { e.preventDefault(); void save(form.status); }} className="surface-card editor-surface">
            <div className="editor-toolbar">
              <div className="editor-toolbar-main"><span className="panel-eyebrow">{form.id ? `Analisis #${form.id}` : "Konten baru"}</span><h2>{form.title || "Buat Analisis"}</h2><div className="editor-meta-row"><span className={cn("status-pill", STATUS_META[form.status].className)}>{STATUS_META[form.status].label}</span><span>Draft lokal tersimpan otomatis</span></div></div>
              <div className="editor-toolbar-actions"><span className="preview-mode-badge"><EyeIcon /> Preview permanen</span><button type="button" className="btn btn-outline" onClick={() => window.open(`${PUBLIC_SITE_URL}/analisis/${form.slug || ""}`, "_blank")} disabled={!form.slug}>Lihat publik <ArrowUpRight size={15} /></button></div>
            </div>
            {error ? <div className="inline-error">{error}</div> : null}
            <EditorTabs items={["overview", "content", "market", "scenario", "media"] as AnalysisSection[]} active={section} onChange={setSection} labels={{ overview: "Detail", content: "Konten", market: "Market", scenario: "Skenario", media: "Media" }} />

            {section === "overview" ? <div className="editor-section-grid two-col"><FormSection icon={<BarChart3 size={17} />} title="Informasi Market" description="Identitas analisis yang tampil di metadata."><div className="field-grid two"><Field label="Pair"><select className="control" value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })}><option>XAU/USD</option><option>BTC/USD</option><option>EUR/USD</option><option>GBP/USD</option><option>USD/JPY</option></select></Field><Field label="Timeframe"><select className="control" value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })}><option>M15</option><option>H1</option><option>H4</option><option>D1</option><option>W1</option></select></Field><Field label="Bias"><select className="control" value={form.bias} onChange={(e) => setForm({ ...form, bias: e.target.value as AnalisisForm["bias"] })}><option>Bullish</option><option>Bearish</option><option>Netral</option></select></Field><Field label="Tanggal tayang"><input className="control" type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} /></Field></div></FormSection><FormSection icon={<Clock3 size={17} />} title="Workflow" description="Tentukan status publishing konten."><div className="field-grid two"><Field label="Status"><select className="control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AnalisisStatus })}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></Field><Field label="Aksen kartu"><select className="control" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value as Accent })}><option value="blue">Biru</option><option value="orange">Orange</option><option value="green">Hijau</option><option value="red">Merah</option></select></Field></div></FormSection><FormSection icon={<PencilLine size={17} />} title="Judul & Ringkasan" description="Buat headline yang mudah dipahami dan summary yang singkat."><Field label="Judul"><input className="control control-lg" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Contoh: XAU/USD — Potensi Bullish Lanjutan" required /></Field><Field label="Ringkasan"><textarea className="control" rows={4} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Ringkasan yang akan tampil pada listing dan preview..." required /></Field></FormSection></div> : null}

            {section === "content" ? <FormSection icon={<FileText size={17} />} title="Konten Utama" description="Tulis analisis dengan paragraf yang pendek dan mudah dipindai."><SimpleEditor value={form.body} onChange={(body) => setForm({ ...form, body })} placeholder="Tulis analisis market di sini..." /></FormSection> : null}

            {section === "market" ? <FormSection icon={<BarChart3 size={17} />} title="Market Levels" description="Gunakan format harga yang konsisten agar preview mudah dibaca."><div className="field-grid two"><Field label="Support"><input className="control" value={form.support} onChange={(e) => setForm({ ...form, support: e.target.value })} placeholder="2,380 - 2,365" /></Field><Field label="Resistance"><input className="control" value={form.resistance} onChange={(e) => setForm({ ...form, resistance: e.target.value })} placeholder="2,420 - 2,450" /></Field><Field label="Target"><input className="control" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="2,500 / 2,530" /></Field><Field label="Invalidation"><input className="control" value={form.invalidation} onChange={(e) => setForm({ ...form, invalidation: e.target.value })} placeholder="2,390" /></Field></div></FormSection> : null}

            {section === "scenario" ? <div className="scenario-grid"><ScenarioCard tone="positive" title="Skenario Bullish" hint="Apa yang harus terjadi agar bias bullish aktif?" value={form.scenarioBullish} onChange={(scenarioBullish) => setForm({ ...form, scenarioBullish })} /><ScenarioCard tone="negative" title="Skenario Bearish" hint="Apa yang membatalkan atau membalikkan bias?" value={form.scenarioBearish} onChange={(scenarioBearish) => setForm({ ...form, scenarioBearish })} /></div> : null}

            {section === "media" ? <FormSection icon={<ImageIcon size={17} />} title="Media & Cover" description="Pilih visual yang membantu pembaca memahami konteks analisis."><ImageField value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} /></FormSection> : null}

            <div className="editor-action-bar"><div className="editor-action-left">{form.id ? <button type="button" className="btn btn-danger-outline" onClick={() => void remove()} disabled={busy}><Trash2 size={15} /> Hapus</button> : <span className="save-state"><span className="save-dot" /> Perubahan lokal belum disimpan</span>}</div><div className="editor-action-right"><button type="button" className="btn btn-outline" onClick={() => { clearPersistentState("analisis:form"); setForm(emptyAnalisis()); setSection("overview"); }}>Batal</button><button type="button" className="btn btn-outline" onClick={() => void save("DRAFT")} disabled={busy}>{busy ? "Menyimpan…" : "Simpan Draft"}</button><button type="button" className="btn btn-primary" onClick={() => void save("PUBLISHED")} disabled={busy}><Check size={15} /> {busy ? "Memproses…" : form.id && form.status === "PUBLISHED" ? "Update" : "Publish"}</button></div></div>
          </form>
        </section>

        <aside className="preview-sticky"><div className="surface-card preview-surface"><div className="preview-head"><div><span className="panel-eyebrow">Preview Publik</span><h3>Card Analisis</h3><p>Selalu terlihat agar editing dan hasil akhir bisa dibandingkan langsung.</p></div></div><AnalisisPreview form={form} /></div></aside>
      </div>
    </div>
  );
}

function AnalisisPreview({ form }: { form: AnalisisForm }) {
  return <article className="public-preview analysis-preview"><div className="public-preview-cover">{form.imageUrl ? <img src={form.imageUrl} alt="" /> : <div className="preview-image-empty"><ImageIcon size={28} /><span>Belum ada gambar</span></div>}</div><div className="public-preview-body"><div className="preview-chip-row"><span className="preview-chip">{form.pair}</span><span className="preview-meta">{form.timeframe} · {form.publishedAt || today()}</span></div><span className="preview-bias">{form.bias}</span><h4>{form.title || "Judul analisis"}</h4><p>{form.excerpt || "Ringkasan analisis akan tampil di sini."}</p><div className="preview-level-grid"><PreviewLevel label="Support" value={form.support} /><PreviewLevel label="Resistance" value={form.resistance} /><PreviewLevel label="Target" value={form.target} /><PreviewLevel label="Invalidation" value={form.invalidation} /></div><div className="preview-mini-block"><span>Scenario</span><p>{form.scenarioBullish || form.scenarioBearish || "Tambahkan skenario agar preview terasa lengkap."}</p></div><button type="button" className="btn btn-primary btn-block" disabled>Preview publik</button></div></article>;
}

function NewsStudio({ token, items, onChange, busy, setBusy, selectId }: { token: string; items: NewsItem[]; onChange: () => Promise<void>; busy: boolean; setBusy: (v: boolean) => void; selectId?: number | null }) {
  const [form, setForm, formHydrated] = usePersistentState<NewsForm>("news:form", emptyNews);
  const [query, setQuery] = usePersistentState<string>("news:query", "");
  const [section, setSection] = usePersistentState<NewsSection>("news:section", "overview");
  const [error, setError] = useState("");
  const filtered = items.filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  function fill(item: NewsItem) { setForm({ id: item.id, slug: item.slug, category: item.category, title: item.title, excerpt: item.excerpt, body: item.body.join("\n\n"), thumb: item.thumb, publishedAt: item.publishedAt }); setSection("overview"); setError(""); }
  async function submit(e: FormEvent) { e.preventDefault(); setError(""); setBusy(true); try { await saveNews({ data: { token, ...form } }); clearPersistentState("news:form"); await onChange(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); } finally { setBusy(false); } }
  async function remove() { if (!form.id || !confirm("Hapus news ini?")) return; setBusy(true); try { await deleteNews({ data: { token, id: form.id } }); clearPersistentState("news:form"); setForm(emptyNews()); await onChange(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menghapus."); } finally { setBusy(false); } }
  return <div className="producer-page editor-page"><PageHeader eyebrow="News CMS" title="News" description="Kelola berita dan editorial dengan alur kerja yang fokus dan mudah dipindai."><button type="button" className="btn btn-primary" onClick={() => { setForm(emptyNews()); setSection("overview"); }}><Plus size={16} /> News Baru</button></PageHeader><div className="editor-layout news-layout"><aside className="surface-card content-library"><div className="content-library-head"><div><span className="panel-eyebrow">Editorial library</span><h2>Semua News</h2><p>{items.length} konten</p></div><button type="button" className="icon-btn subtle-icon" onClick={() => setForm(emptyNews())}><Plus size={17} /></button></div><div className="library-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari judul..." /></div><div className="content-library-scroll">{filtered.map((item) => <button key={item.id} type="button" className={cn("library-item", form.id === item.id && "is-selected")} onClick={() => fill(item)}><Thumb src="" fallback={item.category} className="library-thumb" /><span className="library-item-main"><span className="library-item-meta"><strong>{item.category}</strong><span className="status-pill status-published">Published</span></span><strong className="library-item-title">{item.title}</strong><small>{formatIdDate(item.publishedAt)}</small></span><ChevronRight size={15} /></button>)}{!filtered.length ? <EmptyState text="Tidak ada news yang cocok." /> : null}</div></aside><section className="editor-workspace"><form className="surface-card editor-surface" onSubmit={submit}><div className="editor-toolbar"><div className="editor-toolbar-main"><span className="panel-eyebrow">{form.id ? `News #${form.id}` : "Konten baru"}</span><h2>{form.title || "Buat News"}</h2><div className="editor-meta-row"><span className="status-pill status-published">Published</span><span>Draft lokal tersimpan otomatis</span></div></div><div className="editor-toolbar-actions"><button type="button" className="btn btn-outline" onClick={() => window.open(`${PUBLIC_SITE_URL}/news/${form.slug || ""}`, "_blank")} disabled={!form.slug}>Lihat publik <ArrowUpRight size={15} /></button></div></div>{error ? <div className="inline-error">{error}</div> : null}<EditorTabs items={["overview", "content", "media"] as NewsSection[]} active={section} onChange={setSection} labels={{ overview: "Detail", content: "Konten", media: "Media" }} />{section === "overview" ? <FormSection icon={<Newspaper size={17} />} title="Editorial" description="Metadata berita yang akan tampil pada listing."><div className="field-grid two"><Field label="Kategori"><input className="control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></Field><Field label="Visual"><select className="control" value={form.thumb} onChange={(e) => setForm({ ...form, thumb: e.target.value as NewsThumb })}><option value="capitol">Capitol</option><option value="gold">Gold</option><option value="bitcoin">Bitcoin</option></select></Field></div><Field label="Tanggal tayang"><input className="control" type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} /></Field><Field label="Judul"><input className="control control-lg" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field><Field label="Ringkasan"><textarea className="control" rows={4} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} required /></Field></FormSection> : null}{section === "content" ? <FormSection icon={<FileText size={17} />} title="Konten Artikel" description="Susun artikel dalam paragraf yang singkat dan jelas."><SimpleEditor value={form.body} onChange={(body) => setForm({ ...form, body })} placeholder="Tulis isi artikel..." /></FormSection> : null}{section === "media" ? <FormSection icon={<ImageIcon size={17} />} title="Visual" description="Pengaturan visual saat ini menggunakan pilihan thumbnail yang tersedia."><div className="media-note"><div className="media-note-icon"><ImageIcon size={18} /></div><div><strong>{form.thumb}</strong><span>Thumbnail source dari preset editorial.</span></div></div></FormSection> : null}<div className="editor-action-bar"><div className="editor-action-left">{form.id ? <button type="button" className="btn btn-danger-outline" onClick={() => void remove()} disabled={busy}><Trash2 size={15} /> Hapus</button> : null}</div><div className="editor-action-right"><button type="button" className="btn btn-outline" onClick={() => setForm(emptyNews())}>Batal</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan News"}</button></div></div></form></section><aside className="preview-sticky"><div className="surface-card preview-surface"><div className="preview-head"><div><span className="panel-eyebrow">Preview Publik</span><h3>News Card</h3></div></div><article className="public-preview news-preview"><div className="public-preview-cover news-cover"><span>{form.category || "Kategori"}</span></div><div className="public-preview-body"><span className="preview-chip">{form.category || "Kategori"}</span><h4>{form.title || "Judul news"}</h4><p>{form.excerpt || "Ringkasan news akan tampil di sini."}</p><div className="preview-meta-row"><Clock3 size={14} />{formatIdDate(form.publishedAt)}</div></div></article></div></aside></div></div>;
}

function EdukasiStudio({ token, items, onChange, busy, setBusy, selectId }: { token: string; items: EdukasiItem[]; onChange: () => Promise<void>; busy: boolean; setBusy: (v: boolean) => void; selectId?: number | null }) {
  const [form, setForm, formHydrated] = usePersistentState<EdukasiForm>("edukasi:form", emptyEdukasi);
  const [query, setQuery] = usePersistentState<string>("edukasi:query", "");
  const [section, setSection] = usePersistentState<EducationSection>("edukasi:section", "overview");
  const [error, setError] = useState("");
  const filtered = items.filter((item) => `${item.title} ${item.level}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (!formHydrated || selectId == null) return;
    if (form.id === selectId) return;
    const item = items.find((candidate) => candidate.id === selectId);
    if (item) fill(item);
  }, [formHydrated, items, selectId, form.id]);
  function fill(item: EdukasiItem) { setForm({ id: item.id, slug: item.slug, level: item.level, title: item.title, description: item.description, body: item.body, imageUrl: item.imageUrl }); setSection("overview"); setError(""); }
  async function submit(e: FormEvent) { e.preventDefault(); setError(""); setBusy(true); try { await saveEdukasi({ data: { token, ...form } }); clearPersistentState("edukasi:form"); await onChange(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); } finally { setBusy(false); } }
  async function remove() { if (!form.id || !confirm("Hapus materi ini?")) return; setBusy(true); try { await deleteEdukasi({ data: { token, id: form.id } }); clearPersistentState("edukasi:form"); setForm(emptyEdukasi()); await onChange(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menghapus."); } finally { setBusy(false); } }
  return <div className="producer-page editor-page"><PageHeader eyebrow="Edukasi CMS" title="Edukasi" description="Susun materi belajar dengan struktur yang jelas, fokus, dan nyaman untuk diedit."><button type="button" className="btn btn-primary" onClick={() => { setForm(emptyEdukasi()); setSection("overview"); }}><Plus size={16} /> Edukasi Baru</button></PageHeader><div className="editor-layout education-layout"><aside className="surface-card content-library"><div className="content-library-head"><div><span className="panel-eyebrow">Learning library</span><h2>Semua Edukasi</h2><p>{items.length} materi</p></div><button type="button" className="icon-btn subtle-icon" onClick={() => setForm(emptyEdukasi())}><Plus size={17} /></button></div><div className="library-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari materi..." /></div><div className="level-filter-row"><span className="filter-pill is-active">Semua</span><span className="filter-pill">Pemula</span><span className="filter-pill">Menengah</span><span className="filter-pill">Lanjutan</span></div><div className="content-library-scroll">{filtered.map((item) => <button key={item.id} type="button" className={cn("library-item", form.id === item.id && "is-selected")} onClick={() => fill(item)}><Thumb src={item.imageUrl} fallback={item.level} className="library-thumb" /><span className="library-item-main"><span className="library-item-meta"><strong>{item.level}</strong><span className="status-pill status-published">Published</span></span><strong className="library-item-title">{item.title}</strong><small>Materi belajar</small></span><ChevronRight size={15} /></button>)}{!filtered.length ? <EmptyState text="Tidak ada materi yang cocok." /> : null}</div></aside><section className="editor-workspace"><form className="surface-card editor-surface" onSubmit={submit}><div className="editor-toolbar"><div className="editor-toolbar-main"><span className="panel-eyebrow">{form.id ? `Materi #${form.id}` : "Konten baru"}</span><h2>{form.title || "Buat Materi"}</h2><div className="editor-meta-row"><span className="status-pill status-published">Published</span><span>Draft lokal tersimpan otomatis</span></div></div><div className="editor-toolbar-actions"><button type="button" className="btn btn-outline" onClick={() => window.open(`${PUBLIC_SITE_URL}/edukasi/${form.slug || ""}`, "_blank")} disabled={!form.slug}>Lihat publik <ArrowUpRight size={15} /></button></div></div>{error ? <div className="inline-error">{error}</div> : null}<EditorTabs items={["overview", "content", "media"] as EducationSection[]} active={section} onChange={setSection} labels={{ overview: "Detail", content: "Konten", media: "Media" }} />{section === "overview" ? <FormSection icon={<BookOpen size={17} />} title="Informasi Materi" description="Tetapkan level dan headline materi."><Field label="Level"><select className="control" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as EduLevel })}><option>Pemula</option><option>Menengah</option><option>Lanjutan</option></select></Field><Field label="Judul"><input className="control control-lg" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field><Field label="Deskripsi"><textarea className="control" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></Field></FormSection> : null}{section === "content" ? <FormSection icon={<FileText size={17} />} title="Isi Materi" description="Jaga struktur tulisan per bagian agar mudah dipelajari."><SimpleEditor value={form.body} onChange={(body) => setForm({ ...form, body })} placeholder="Tulis materi pembelajaran..." /></FormSection> : null}{section === "media" ? <FormSection icon={<ImageIcon size={17} />} title="Cover Materi" description="Tambahkan visual cover agar materi lebih mudah dikenali."><ImageField value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} /></FormSection> : null}<div className="editor-action-bar"><div className="editor-action-left">{form.id ? <button type="button" className="btn btn-danger-outline" onClick={() => void remove()} disabled={busy}><Trash2 size={15} /> Hapus</button> : null}</div><div className="editor-action-right"><button type="button" className="btn btn-outline" onClick={() => setForm(emptyEdukasi())}>Batal</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan Materi"}</button></div></div></form></section><aside className="preview-sticky"><div className="surface-card preview-surface"><div className="preview-head"><div><span className="panel-eyebrow">Preview Publik</span><h3>Learning Card</h3></div></div><article className="public-preview learning-preview"><div className="public-preview-cover">{form.imageUrl ? <img src={form.imageUrl} alt="" /> : <div className="preview-image-empty"><BookOpen size={28} /><span>Belum ada gambar</span></div>}</div><div className="public-preview-body"><span className="preview-chip">{form.level}</span><h4>{form.title || "Judul materi"}</h4><p>{form.description || "Deskripsi materi akan tampil di sini."}</p><div className="preview-mini-block"><span>Isi materi</span><p>{form.body ? `${form.body.slice(0, 170)}${form.body.length > 170 ? "…" : ""}` : "Belum ada isi materi."}</p></div><button type="button" className="btn btn-primary btn-block" disabled>Mulai Belajar</button></div></article></div></aside></div></div>;
}

function SettingsPage() {
  return <div className="producer-page"><PageHeader eyebrow="Workspace" title="Pengaturan" description="Kelola preferensi workspace Producer dan informasi koneksi." /><div className="settings-grid"><section className="surface-card settings-card"><FormSection icon={<Settings2 size={17} />} title="Workspace" description="Informasi dasar workspace internal."><Field label="Nama Workspace"><input className="control" value="Birustock Production" readOnly /></Field><Field label="Website publik"><input className="control" value={PUBLIC_SITE_URL} readOnly /></Field></FormSection></section><section className="surface-card settings-card"><FormSection icon={<CircleHelp size={17} />} title="Status Sistem" description="Status yang terlihat oleh Producer."><div className="system-status-list"><StatusLine label="Database" value="Terhubung" /><StatusLine label="Vercel deployment" value="Aktif" /><StatusLine label="Producer auth" value="Aktif" /></div></FormSection></section></div></div>;
}

function StatusLine({ label, value }: { label: string; value: string }) { return <div className="system-status-line"><span>{label}</span><strong><i />{value}</strong></div>; }

function FilterChips({ value, onChange }: { value: "ALL" | AnalisisStatus; onChange: (next: "ALL" | AnalisisStatus) => void }) {
  const chips: Array<["ALL" | AnalisisStatus, string]> = [["ALL", "Semua"], ["PUBLISHED", "Published"], ["DRAFT", "Draft"], ["ARCHIVED", "Arsip"]];
  return <div className="filter-chip-row">{chips.map(([key, label]) => <button key={key} type="button" className={cn("filter-pill", value === key && "is-active")} onClick={() => onChange(key)}>{label}</button>)}</div>;
}

function EditorTabs<T extends string>({ items, active, onChange, labels }: { items: T[]; active: T; onChange: (next: T) => void; labels: Record<T, string> }) {
  return <div className="editor-tabs" role="tablist">{items.map((item) => <button key={item} type="button" role="tab" aria-selected={active === item} className={cn(active === item && "is-active")} onClick={() => onChange(item)}>{labels[item]}</button>)}</div>;
}

function SimpleEditor({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  function insert(prefix: string, suffix = "") {
    const el = ref.current;
    if (!el) return onChange(`${value}${value ? "\n" : ""}${prefix}`);
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => { el.focus(); const cursor = start + prefix.length + selected.length + suffix.length; el.setSelectionRange(cursor, cursor); });
  }
  return <div className="simple-editor"><div className="editor-formatbar"><button type="button" onClick={() => insert("## ")}>H2</button><button type="button" onClick={() => insert("**", "**")}>B</button><button type="button" onClick={() => insert("> ")}>Quote</button><button type="button" onClick={() => insert("• ")}>List</button><button type="button" onClick={() => insert("---\n")}>Divider</button><span className="formatbar-hint">Editor teks sederhana · preview mengikuti konten</span></div><textarea ref={ref} className="control rich-text-area" rows={19} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required /></div>;
}

function ScenarioCard({ tone, title, hint, value, onChange }: { tone: "positive" | "negative"; title: string; hint: string; value: string; onChange: (value: string) => void }) {
  return <section className={cn("scenario-card", tone)}><div className="scenario-card-head"><span className="scenario-icon">{tone === "positive" ? <Check size={16} /> : <X size={16} />}</span><div><h3>{title}</h3><p>{hint}</p></div></div><textarea className="control" rows={12} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Tulis kondisi, trigger, invalidasi, atau konfirmasi yang perlu diperhatikan..." /></section>;
}

async function optimizeImageForEditor(file: File): Promise<string> {
  const maxOriginalBytes = 5 * 1024 * 1024;
  const maxDimension = 2200;
  const targetBytes = 900 * 1024;
  if (file.size > maxOriginalBytes) throw new Error("Ukuran gambar terlalu besar. Maksimal 5MB.");

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Gagal membaca gambar."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("File gambar tidak valid."));
    img.src = dataUrl;
  });

  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(image, 0, 0, width, height);

  if (file.size <= targetBytes && width === image.naturalWidth && height === image.naturalHeight) return dataUrl;

  const mime = file.type === "image/png" && file.size <= targetBytes ? "image/png" : "image/webp";
  let quality = 0.86;
  let result = canvas.toDataURL(mime, quality);
  for (let i = 0; i < 4 && result.length * 0.75 > targetBytes; i += 1) {
    quality -= 0.1;
    result = canvas.toDataURL(mime, quality);
  }
  return result;
}

function ImageField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  return <div className="image-field"><div className="image-field-input"><Field label="URL gambar"><input className="control" value={value.startsWith("data:") ? "" : value} placeholder="https://..." onChange={(e) => onChange(e.target.value)} /></Field><label className={cn("file-drop", imageBusy && "is-disabled")}><input type="file" accept="image/jpeg,image/png,image/webp" disabled={imageBusy} onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; setImageError(""); setImageBusy(true); void optimizeImageForEditor(file).then(onChange).catch((error) => setImageError(error instanceof Error ? error.message : "Gagal memproses gambar.")).finally(() => setImageBusy(false)); e.currentTarget.value = ""; }} /><Upload size={17} /><span><strong>{imageBusy ? "Memproses gambar…" : "Upload gambar"}</strong><small>JPG / PNG / WebP · maks 5MB · otomatis dioptimalkan</small></span></label>{imageError ? <div className="inline-error">{imageError}</div> : null}</div><div className="media-preview-large">{value ? <img src={value} alt="Preview" /> : <div className="media-placeholder"><ImageIcon size={26} /><span>Belum ada visual</span><small>Gunakan URL atau upload file.</small></div>}</div></div>;
}

function Thumb({ src, fallback, className }: { src?: string; fallback: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <span className={cn("thumb-fallback", className)}>{src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : <span>{fallback.slice(0, 2)}</span>}</span>;
}

function FormSection({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return <section className="form-section"><div className="form-section-head"><span className="section-icon">{icon}</span><div><h3>{title}</h3><p>{description}</p></div></div><div className="form-section-body">{children}</div></section>;
}

function PageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <div className="producer-page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children ? <div className="page-header-actions">{children}</div> : null}</div>;
}

function PanelHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <div className="panel-head"><div><h2>{title}</h2><p>{description}</p></div>{action}</div>; }
function EmptyState({ text }: { text: string }) { return <div className="empty-state"><FileText size={18} /><span>{text}</span></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span className="field-label">{label}</span>{children}</label>; }
function PreviewLevel({ label, value }: { label: string; value: string }) { return <div className="preview-level"><span>{label}</span><strong>{value || "—"}</strong></div>; }
function EyeIcon() { return <span className="eye-icon">◉</span>; }

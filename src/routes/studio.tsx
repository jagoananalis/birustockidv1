import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Archive,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Newspaper,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Settings2,
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
type Tab = "dashboard" | "analisis" | "news" | "edukasi";

const STATUS_META: Record<AnalisisStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "badge-orange" },
  PUBLISHED: { label: "Published", className: "badge-green" },
  ARCHIVED: { label: "Archived", className: "badge-red" },
};

type AnalisisForm = {
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
};

type NewsForm = {
  id?: number;
  category: string;
  title: string;
  excerpt: string;
  body: string;
  thumb: NewsThumb;
  publishedAt: string;
};

type EdukasiForm = {
  id?: number;
  level: EduLevel;
  title: string;
  description: string;
  body: string;
  imageUrl: string;
};

const emptyAnalisis = (): AnalisisForm => ({
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
});

const emptyNews = (): NewsForm => ({
  category: "Ekonomi Global",
  title: "",
  excerpt: "",
  body: "",
  thumb: "capitol",
  publishedAt: new Date().toISOString().slice(0, 10),
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
  const [tab, setTab] = useState<Tab>("dashboard");
  const [analisis, setAnalisis] = useState<AnalisisItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [edukasi, setEdukasi] = useState<EdukasiItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  async function refresh() {
    if (!token) return;
    setRefreshing(true);
    const results = await Promise.allSettled([
      listAnalisisStudio({ data: { token } }),
      listNews(),
      listEdukasi(),
    ]);
    const [analisisResult, newsResult, edukasiResult] = results;
    if (analisisResult.status === "fulfilled") setAnalisis(analisisResult.value);
    if (newsResult.status === "fulfilled") setNews(newsResult.value);
    if (edukasiResult.status === "fulfilled") setEdukasi(edukasiResult.value);
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

  function navigate(next: Tab) {
    setTab(next);
    setMobileNav(false);
  }

  if (checking) {
    return (
      <section className="producer-loading">
        <div className="producer-loading-card">
          <div className="skeleton h-12 w-12 rounded-2xl" />
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-3 w-28" />
        </div>
      </section>
    );
  }

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
            <p>Kelola analisis, news, dan edukasi dari satu ruang kerja editorial.</p>
          </div>
          {error ? <div className="inline-error">{error}</div> : null}
          <Field label="PIN Studio">
            <input
              id="pin"
              type="password"
              className="control control-lg"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="current-password"
              placeholder="Masukkan PIN"
              required
            />
          </Field>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? "Memeriksa…" : "Masuk ke Studio"}
          </button>
          <div className="producer-auth-foot">
            <CircleHelp size={14} />
            <span>Akses hanya untuk Producer.</span>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="producer-app">
      <header className="producer-topbar">
        <div className="producer-topbar-inner">
          <button type="button" className="producer-mobile-trigger" onClick={() => setMobileNav(true)} aria-label="Buka navigasi">
            <Menu size={20} />
          </button>
          <div className="producer-breadcrumb">
            <span className="producer-breadcrumb-muted">Studio</span>
            <ChevronRight size={14} />
            <strong>{tab === "dashboard" ? "Dashboard" : tab[0].toUpperCase() + tab.slice(1)}</strong>
          </div>
          <div className="producer-topbar-actions">
            <button type="button" className="icon-btn" title="Refresh data" onClick={() => void refresh()} disabled={refreshing}>
              <RefreshCw size={17} className={cn(refreshing && "animate-spin")} />
            </button>
            <button type="button" className="icon-btn" title="Notifikasi">
              <Bell size={17} />
            </button>
            <div className="producer-profile">
              <span className="producer-avatar">P</span>
              <span className="hidden sm:block">
                <strong>Producer</strong>
                <small>Birustock</small>
              </span>
              <ChevronDown size={14} className="text-subtle" />
            </div>
          </div>
        </div>
      </header>

      <div className="producer-layout">
        <aside className="producer-sidebar">
          <div className="producer-sidebar-brand">
            <div className="producer-sidebar-mark">B</div>
            <div>
              <div className="producer-sidebar-title">Birustock</div>
              <div className="producer-sidebar-sub">Producer</div>
            </div>
          </div>
          <div className="producer-workspace-card">
            <div className="workspace-topline"><span>Workspace</span><span className="workspace-status"><i />Live</span></div>
            <strong>Birustock Production</strong>
            <div className="workspace-progress"><span style={{ width: "74%" }} /></div>
            <div className="workspace-meta"><span>Content capacity</span><strong>74%</strong></div>
          </div>
          <nav className="producer-nav" aria-label="Producer Navigation">
            <ProducerNavItem icon={<LayoutDashboard size={17} />} label="Dashboard" active={tab === "dashboard"} onClick={() => navigate("dashboard")} />
            <ProducerNavItem icon={<BarChart3 size={17} />} label="Analisis" count={analisis.length} active={tab === "analisis"} onClick={() => navigate("analisis")} />
            <ProducerNavItem icon={<Newspaper size={17} />} label="News" count={news.length} active={tab === "news"} onClick={() => navigate("news")} />
            <ProducerNavItem icon={<BookOpen size={17} />} label="Edukasi" count={edukasi.length} active={tab === "edukasi"} onClick={() => navigate("edukasi")} />
            <ProducerNavItem icon={<Settings2 size={17} />} label="Workspace" active={false} onClick={() => {}} disabled />
          </nav>
          <div className="producer-sidebar-foot">
            <a href={PUBLIC_SITE_URL} className="producer-nav-secondary"><ExternalLink size={16} />Website publik</a>
            <button type="button" className="producer-nav-secondary danger" onClick={() => { localStorage.removeItem(TOKEN_KEY); setToken(null); }}><LogOut size={16} />Keluar</button>
          </div>
        </aside>

        {mobileNav ? (
          <>
            <button type="button" className="producer-mobile-overlay" aria-label="Tutup navigasi" onClick={() => setMobileNav(false)} />
            <aside className="producer-mobile-drawer">
              <div className="producer-sidebar-brand">
                <div className="producer-sidebar-mark">B</div>
                <div><div className="producer-sidebar-title">Birustock</div><div className="producer-sidebar-sub">Producer</div></div>
                <button type="button" className="icon-btn ml-auto" onClick={() => setMobileNav(false)}><X size={18} /></button>
              </div>
              <nav className="producer-nav">
                <ProducerNavItem icon={<LayoutDashboard size={17} />} label="Dashboard" active={tab === "dashboard"} onClick={() => navigate("dashboard")} />
                <ProducerNavItem icon={<BarChart3 size={17} />} label="Analisis" count={analisis.length} active={tab === "analisis"} onClick={() => navigate("analisis")} />
                <ProducerNavItem icon={<Newspaper size={17} />} label="News" count={news.length} active={tab === "news"} onClick={() => navigate("news")} />
                <ProducerNavItem icon={<BookOpen size={17} />} label="Edukasi" count={edukasi.length} active={tab === "edukasi"} onClick={() => navigate("edukasi")} />
              </nav>
            </aside>
          </>
        ) : null}

        <section className="producer-main">
          {tab === "dashboard" ? <Dashboard analisis={analisis} news={news} edukasi={edukasi} onSelect={navigate} /> : null}
          {tab === "analisis" ? <AnalisisStudio token={token} items={analisis} onChange={refresh} busy={busy} setBusy={setBusy} /> : null}
          {tab === "news" ? <NewsStudio token={token} items={news} onChange={refresh} busy={busy} setBusy={setBusy} /> : null}
          {tab === "edukasi" ? <EdukasiStudio token={token} items={edukasi} onChange={refresh} busy={busy} setBusy={setBusy} /> : null}
        </section>
      </div>
    </main>
  );
}

function ProducerNavItem({ icon, label, count, active, onClick, disabled = false }: { icon: ReactNode; label: string; count?: number; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={cn("producer-nav-item", active && "is-active", disabled && "is-disabled")} onClick={onClick} disabled={disabled}>
      <span className="nav-item-icon">{icon}</span>
      <span className="nav-item-label">{label}</span>
      {typeof count === "number" ? <span className="nav-item-count">{count}</span> : null}
    </button>
  );
}

function Dashboard({ analisis, news, edukasi, onSelect }: { analisis: AnalisisItem[]; news: NewsItem[]; edukasi: EdukasiItem[]; onSelect: (tab: Tab) => void }) {
  const published = analisis.filter((item) => item.status === "PUBLISHED").length;
  const drafts = analisis.filter((item) => item.status === "DRAFT").length;
  const archived = analisis.filter((item) => item.status === "ARCHIVED").length;
  const recent = [...analisis].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 6);
  const total = analisis.length + news.length + edukasi.length;

  return (
    <div className="producer-page">
      <PageHeader
        eyebrow="Content Command Center"
        title="Dashboard"
        description="Pantau performa konten dan lanjutkan pekerjaan editorial dari satu ruang kerja."
      >
        <button type="button" className="btn btn-primary" onClick={() => onSelect("analisis")}><Plus size={16} />Buat Analisis</button>
      </PageHeader>

      <section className="metric-grid">
        <MetricCard icon={<FileText size={18} />} label="Total Konten" value={total} detail="Semua format" onClick={() => onSelect("analisis")} />
        <MetricCard icon={<Check size={18} />} label="Published" value={published} detail="Tayang ke user" onClick={() => onSelect("analisis")} tone="green" />
        <MetricCard icon={<PencilLine size={18} />} label="Draft" value={drafts} detail="Perlu dilanjutkan" onClick={() => onSelect("analisis")} tone="orange" />
        <MetricCard icon={<Archive size={18} />} label="Arsip" value={archived} detail="Tidak ditampilkan" onClick={() => onSelect("analisis")} tone="red" />
      </section>

      <section className="dashboard-grid-two">
        <div className="panel-card">
          <PanelHeader title="Status konten" description="Distribusi workflow Analisis" />
          <div className="status-dashboard">
            <div className="status-ring" style={{ "--published": `${published}`, "--draft": `${drafts}`, "--archived": `${archived}` } as React.CSSProperties}>
              <div><strong>{analisis.length}</strong><span>Analisis</span></div>
            </div>
            <div className="status-legend">
              <LegendRow dot="green" label="Published" value={published} />
              <LegendRow dot="orange" label="Draft" value={drafts} />
              <LegendRow dot="red" label="Archived" value={archived} />
            </div>
          </div>
        </div>

        <div className="panel-card">
          <PanelHeader title="Quick actions" description="Pindah cepat ke workflow utama" />
          <div className="quick-actions">
            <QuickAction icon={<BarChart3 size={18} />} label="Analisis" detail={`${analisis.length} konten`} onClick={() => onSelect("analisis")} />
            <QuickAction icon={<Newspaper size={18} />} label="News" detail={`${news.length} konten`} onClick={() => onSelect("news")} tone="orange" />
            <QuickAction icon={<BookOpen size={18} />} label="Edukasi" detail={`${edukasi.length} materi`} onClick={() => onSelect("edukasi")} tone="green" />
          </div>
        </div>
      </section>

      <section className="panel-card">
        <PanelHeader title="Aktivitas terbaru" description="Konten yang terakhir diperbarui" action={<button type="button" className="text-link" onClick={() => onSelect("analisis")}>Buka semua <ArrowUpRight size={15} /></button>} />
        <div className="activity-list">
          {recent.length ? recent.map((item) => (
            <button key={item.id} type="button" className="activity-row" onClick={() => onSelect("analisis")}>
              <StatusDot status={item.status} />
              <div className="activity-main">
                <strong>{item.title || "Tanpa judul"}</strong>
                <span>{item.pair} · {item.timeframe} · {formatIdDate(item.updatedAt.slice(0, 10))}</span>
              </div>
              <span className="activity-bias">{item.bias}</span>
              <ChevronRight size={16} className="text-subtle" />
            </button>
          )) : <EmptyState text="Belum ada aktivitas analisis." />}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, onClick, tone = "blue" }: { icon: ReactNode; label: string; value: number; detail: string; onClick: () => void; tone?: "blue" | "green" | "orange" | "red" }) {
  return (
    <button type="button" className={cn("metric-card", `tone-${tone}`)} onClick={onClick}>
      <div className="metric-card-top"><span className="metric-icon">{icon}</span><ArrowUpRight size={16} className="text-subtle" /></div>
      <div className="metric-card-value">{value}</div>
      <div className="metric-card-label">{label}</div>
      <div className="metric-card-detail">{detail}</div>
    </button>
  );
}

function LegendRow({ dot, label, value }: { dot: string; label: string; value: number }) {
  return <div className="legend-row"><span className={cn("legend-dot", `dot-${dot}`)} /> <span>{label}</span><strong>{value}</strong></div>;
}

function QuickAction({ icon, label, detail, onClick, tone = "blue" }: { icon: ReactNode; label: string; detail: string; onClick: () => void; tone?: "blue" | "orange" | "green" }) {
  return <button type="button" className="quick-action" onClick={onClick}><span className={cn("quick-action-icon", `tone-${tone}`)}>{icon}</span><span><strong>{label}</strong><small>{detail}</small></span><ChevronRight size={15} className="text-subtle" /></button>;
}

function StatusDot({ status }: { status: AnalisisStatus }) {
  return <span className={cn("status-dot", STATUS_META[status].className.replace("badge-", "dot-"))} />;
}

function AnalisisStudio({ token, items, onChange, busy, setBusy }: { token: string; items: AnalisisItem[]; onChange: () => Promise<void>; busy: boolean; setBusy: (v: boolean) => void }) {
  const [form, setForm] = useState<AnalisisForm>(emptyAnalisis);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AnalisisStatus>("ALL");
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    function handler() { setForm(emptyAnalisis()); setError(""); }
    window.addEventListener("studio:new-analysis", handler);
    return () => window.removeEventListener("studio:new-analysis", handler);
  }, []);

  const filtered = items.filter((item) => {
    const matchesText = `${item.pair} ${item.title} ${item.bias} ${item.status}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesText && matchesStatus;
  });

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
      bias: item.bias as AnalisisForm["bias"],
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
      setForm(emptyAnalisis());
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="producer-page">
      <PageHeader eyebrow="Analisis CMS" title="Analisis" description="Tulis insight market dengan workflow yang jelas dari draft sampai publish.">
        <div className="page-header-actions">
          <button type="button" className={cn("btn btn-outline", preview && "is-active")} onClick={() => setPreview((v) => !v)}><Sparkles size={16} />{preview ? "Preview aktif" : "Preview mati"}</button>
          <button type="button" className="btn btn-primary" onClick={() => setForm(emptyAnalisis())}><Plus size={16} />Analisis Baru</button>
        </div>
      </PageHeader>

      <div className={cn("content-workspace", preview && "with-preview")}>
        <aside className="content-list-panel">
          <div className="content-list-head">
            <div><span className="panel-eyebrow">Library</span><h2>Semua Analisis</h2><p>{items.length} konten tersimpan</p></div>
            <button type="button" className="icon-btn" onClick={() => setForm(emptyAnalisis())}><Plus size={17} /></button>
          </div>
          <div className="content-filter-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari pair atau judul…" /></div>
          <div className="chip-row">
            {(["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"] as const).map((key) => <button key={key} type="button" className={cn("filter-chip", statusFilter === key && "is-active")} onClick={() => setStatusFilter(key)}>{key === "ALL" ? "Semua" : STATUS_META[key].label}</button>)}
          </div>
          <div className="content-list-scroll">
            {filtered.map((item) => (
              <button key={item.id} type="button" className={cn("content-list-item", form.id === item.id && "is-selected")} onClick={() => fill(item)}>
                <Thumb src={item.imageUrl} fallback={item.pair.slice(0, 1)} className="content-thumb" />
                <span className="content-item-main"><span className="content-item-top"><strong>{item.pair}</strong><span className={cn("badge", STATUS_META[item.status].className)}>{STATUS_META[item.status].label}</span></span><span className="content-item-title">{item.title || "Tanpa judul"}</span><span className="content-item-meta">{item.timeframe} · {item.bias} · {formatIdDate(item.publishedAt)}</span></span>
                <ChevronRight size={15} className="text-subtle" />
              </button>
            ))}
            {!filtered.length ? <EmptyState text="Tidak ada konten yang cocok." /> : null}
          </div>
        </aside>

        <AnalisisEditor form={form} error={error} busy={busy} setForm={setForm} onSave={submit} onDelete={remove} />

        {preview ? <AnalisisPreview form={form} /> : null}
      </div>
    </div>
  );
}

function AnalisisEditor({ form, error, busy, setForm, onSave, onDelete }: { form: AnalisisForm; error: string; busy: boolean; setForm: React.Dispatch<React.SetStateAction<AnalisisForm>>; onSave: (status: AnalisisStatus) => Promise<void>; onDelete: () => Promise<void> }) {
  return (
    <form className="editor-panel" onSubmit={(e) => { e.preventDefault(); void onSave(form.status); }}>
      <div className="editor-topbar">
        <div><span className="panel-eyebrow">{form.id ? `Analisis #${form.id}` : "Konten baru"}</span><h2>{form.id ? form.title || "Untitled" : "Buat analisis"}</h2><p>{form.id ? "Perbarui konten dan pilih status workflow." : "Mulai dari setup market, lalu lanjutkan ke insight."}</p></div>
        <div className="editor-topbar-status"><span className={cn("badge", STATUS_META[form.status].className)}>{STATUS_META[form.status].label}</span><button type="button" className="icon-btn"><MoreHorizontal size={18} /></button></div>
      </div>
      {error ? <div className="inline-error">{error}</div> : null}

      <FormSection icon={<BarChart3 size={17} />} title="Informasi market" description="Identitas setup yang akan tampil pada kartu analisis.">
        <div className="field-grid four">
          <Field label="Pair"><select className="control" value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })}><option>XAU/USD</option><option>BTC/USD</option><option>EUR/USD</option><option>GBP/USD</option><option>USD/JPY</option></select></Field>
          <Field label="Timeframe"><select className="control" value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })}>{["M15", "H1", "H4", "D1", "W1"].map((v) => <option key={v}>{v}</option>)}</select></Field>
          <Field label="Bias"><select className="control" value={form.bias} onChange={(e) => setForm({ ...form, bias: e.target.value as AnalisisForm["bias"] })}>{["Bullish", "Bearish", "Netral"].map((v) => <option key={v}>{v}</option>)}</select></Field>
          <Field label="Tanggal tayang"><input type="date" className="control" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} required /></Field>
        </div>
      </FormSection>

      <FormSection icon={<Settings2 size={17} />} title="Workflow" description="Kontrol status dan tampilan kartu konten.">
        <div className="field-grid two">
          <Field label="Status"><select className="control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AnalisisStatus })}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></Field>
          <Field label="Aksen kartu"><select className="control" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value as Accent })}><option value="blue">Biru</option><option value="orange">Oranye</option><option value="green">Hijau</option><option value="red">Merah</option></select></Field>
        </div>
      </FormSection>

      <FormSection icon={<Sparkles size={17} />} title="Market setup" description="Level yang membantu user memahami risk dan invalidation.">
        <div className="field-grid four">
          <Field label="Support"><input className="control" value={form.support} onChange={(e) => setForm({ ...form, support: e.target.value })} placeholder="2,380 · 2,365" /></Field>
          <Field label="Resistance"><input className="control" value={form.resistance} onChange={(e) => setForm({ ...form, resistance: e.target.value })} placeholder="2,420 · 2,450" /></Field>
          <Field label="Target"><input className="control" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="2,520 / 2,560" /></Field>
          <Field label="Invalidation"><input className="control" value={form.invalidation} onChange={(e) => setForm({ ...form, invalidation: e.target.value })} placeholder="2,360" /></Field>
        </div>
      </FormSection>

      <FormSection icon={<FileText size={17} />} title="Konten utama" description="Tulis judul, ringkasan, dan body untuk halaman publik.">
        <Field label="Judul"><input className="control control-lg" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Contoh: XAU/USD — Potensi bullish lanjutan" required /></Field>
        <div className="field-gap" />
        <Field label="Ringkasan"><textarea className="control" rows={3} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Ringkasan singkat untuk kartu dan pembuka artikel." required /></Field>
        <div className="field-gap" />
        <Field label="Body"><textarea className="control editor-textarea" rows={12} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Tulis analisis lengkap di sini…" required /></Field>
      </FormSection>

      <FormSection icon={<Sparkles size={17} />} title="Skenario" description="Pisahkan thesis bullish dan bearish secara eksplisit.">
        <div className="scenario-grid">
          <Field label="Skenario bullish"><textarea className="control scenario-green" rows={6} value={form.scenarioBullish} onChange={(e) => setForm({ ...form, scenarioBullish: e.target.value })} placeholder="Apa yang perlu terjadi agar bullish valid?" /></Field>
          <Field label="Skenario bearish"><textarea className="control scenario-red" rows={6} value={form.scenarioBearish} onChange={(e) => setForm({ ...form, scenarioBearish: e.target.value })} placeholder="Apa yang membatalkan thesis bullish?" /></Field>
        </div>
      </FormSection>

      <FormSection icon={<ExternalLink size={17} />} title="Media" description="Gunakan URL publik atau unggah gambar kecil untuk preview.">
        <ImageField value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} />
      </FormSection>

      <div className="editor-actions">
        <div className="editor-actions-left">
          {form.id ? <button type="button" className="btn btn-danger" onClick={() => void onDelete()} disabled={busy}><Trash2 size={15} />Hapus</button> : null}
          {form.id && form.status === "PUBLISHED" ? <a className="btn btn-outline" href={`${PUBLIC_SITE_URL}/analisis/${form.id}`} target="_blank" rel="noreferrer"><ExternalLink size={15} />Lihat publik</a> : null}
        </div>
        <div className="editor-actions-right">
          <button type="button" className="btn btn-outline" disabled={busy} onClick={() => void onSave("DRAFT")}>{busy ? "Menyimpan…" : "Simpan draft"}</button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void onSave("PUBLISHED")}><Check size={15} />Publish</button>
        </div>
      </div>
    </form>
  );
}

function AnalisisPreview({ form }: { form: AnalisisForm }) {
  return (
    <aside className="preview-panel">
      <div className="preview-panel-head"><div><span className="panel-eyebrow">Public Preview</span><h3>Analisis card</h3></div><span className="preview-state">Draft view</span></div>
      <article className="preview-card">
        <div className="preview-cover">{form.imageUrl ? <img src={form.imageUrl} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="preview-cover-fallback"><BarChart3 size={32} /><span>Preview image</span></div>}<div className="preview-cover-overlay" /></div>
        <div className="preview-card-body">
          <div className="preview-meta"><span className={cn("badge", form.accent === "green" ? "badge-green" : form.accent === "orange" ? "badge-orange" : form.accent === "red" ? "badge-red" : "")}>{form.pair}</span><span>{form.timeframe} · {form.publishedAt}</span></div>
          <div><span className="preview-bias">{form.bias}</span><h4>{form.title || "Judul analisis"}</h4><p>{form.excerpt || "Ringkasan analisis akan tampil di sini."}</p></div>
          <div className="preview-level-grid"><PreviewLevel label="Support" value={form.support} /><PreviewLevel label="Resistance" value={form.resistance} /><PreviewLevel label="Target" value={form.target} /><PreviewLevel label="Invalidation" value={form.invalidation} /></div>
          <div className="preview-scenario"><span>Bullish scenario</span><p>{form.scenarioBullish || "Belum diisi."}</p></div>
          <div className="preview-scenario"><span>Bearish scenario</span><p>{form.scenarioBearish || "Belum diisi."}</p></div>
        </div>
      </article>
      <div className="preview-note"><Sparkles size={15} /><span>Preview mengikuti struktur kartu yang dibaca user di website publik.</span></div>
    </aside>
  );
}

function NewsStudio({ token, items, onChange, busy, setBusy }: { token: string; items: NewsItem[]; onChange: () => Promise<void>; busy: boolean; setBusy: (v: boolean) => void }) {
  const [form, setForm] = useState<NewsForm>(emptyNews);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const filtered = items.filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase()));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await saveNews({ data: { token, ...form } });
      setForm(emptyNews());
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!form.id || !confirm("Hapus news ini?")) return;
    setBusy(true);
    try {
      await deleteNews({ data: { token, id: form.id } });
      setForm(emptyNews());
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="producer-page">
      <PageHeader eyebrow="News CMS" title="News" description="Kelola berita editorial dan pastikan metadata publik tetap rapi.">
        <button type="button" className="btn btn-primary" onClick={() => setForm(emptyNews())}><Plus size={16} />News Baru</button>
      </PageHeader>
      <div className="content-workspace editorial-workspace">
        <aside className="content-list-panel">
          <div className="content-list-head"><div><span className="panel-eyebrow">Editorial library</span><h2>Semua News</h2><p>{items.length} konten tersimpan</p></div><button type="button" className="icon-btn" onClick={() => setForm(emptyNews())}><Plus size={17} /></button></div>
          <div className="content-filter-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari judul…" /></div>
          <div className="content-list-scroll">
            {filtered.map((item) => <button key={item.id} type="button" className={cn("content-list-item", form.id === item.id && "is-selected")} onClick={() => setForm({ id: item.id, category: item.category, title: item.title, excerpt: item.excerpt, body: item.body.join("\n\n"), thumb: item.thumb, publishedAt: item.publishedAt })}><Thumb fallback={item.thumb === "gold" ? "Au" : item.thumb === "bitcoin" ? "₿" : "E"} className="content-thumb" /><span className="content-item-main"><span className="content-item-top"><strong>{item.category}</strong><span className="badge badge-green">Published</span></span><span className="content-item-title">{item.title}</span><span className="content-item-meta">{formatIdDate(item.publishedAt)}</span></span><ChevronRight size={15} className="text-subtle" /></button>)}
            {!filtered.length ? <EmptyState text="Belum ada news yang cocok." /> : null}
          </div>
        </aside>
        <form className="editor-panel" onSubmit={submit}>
          <div className="editor-topbar"><div><span className="panel-eyebrow">{form.id ? `News #${form.id}` : "Konten baru"}</span><h2>{form.id ? form.title : "Buat news"}</h2><p>Susun metadata, headline, dan isi artikel dalam satu tempat.</p></div><span className="badge badge-green">Editorial</span></div>
          {error ? <div className="inline-error">{error}</div> : null}
          <FormSection icon={<Newspaper size={17} />} title="Metadata editorial" description="Atur kategori, visual, dan tanggal tayang."><div className="field-grid three"><Field label="Kategori"><input className="control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></Field><Field label="Visual"><select className="control" value={form.thumb} onChange={(e) => setForm({ ...form, thumb: e.target.value as NewsThumb })}><option value="capitol">Ekonomi</option><option value="gold">Emas</option><option value="bitcoin">Bitcoin</option></select></Field><Field label="Tanggal"><input type="date" className="control" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} required /></Field></div></FormSection>
          <FormSection icon={<FileText size={17} />} title="Article content" description="Headline harus tajam, ringkas, dan mudah dipindai."><Field label="Judul"><input className="control control-lg" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field><div className="field-gap" /><Field label="Ringkasan"><textarea className="control" rows={3} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} required /></Field><div className="field-gap" /><Field label="Isi berita"><textarea className="control editor-textarea" rows={16} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field></FormSection>
          <div className="editor-actions"><div className="editor-actions-left">{form.id ? <button type="button" className="btn btn-danger" onClick={() => void remove()} disabled={busy}><Trash2 size={15} />Hapus</button> : null}</div><div className="editor-actions-right"><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan News"}</button></div></div>
        </form>
        <aside className="preview-panel"><div className="preview-panel-head"><div><span className="panel-eyebrow">Public Preview</span><h3>News card</h3></div><span className="preview-state">Preview</span></div><article className="editorial-preview"><div className="editorial-preview-hero"><span className="badge">{form.category || "Kategori"}</span></div><div className="editorial-preview-body"><h4>{form.title || "Judul news"}</h4><p>{form.excerpt || "Ringkasan news akan tampil di sini."}</p><div className="preview-footer-row"><span>{formatIdDate(form.publishedAt)}</span><ArrowUpRight size={15} /></div></div></article></aside>
      </div>
    </div>
  );
}

function EdukasiStudio({ token, items, onChange, busy, setBusy }: { token: string; items: EdukasiItem[]; onChange: () => Promise<void>; busy: boolean; setBusy: (v: boolean) => void }) {
  const [form, setForm] = useState<EdukasiForm>(emptyEdukasi);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const filtered = items.filter((item) => `${item.title} ${item.level}`.toLowerCase().includes(query.toLowerCase()));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await saveEdukasi({ data: { token, ...form } });
      setForm(emptyEdukasi());
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!form.id || !confirm("Hapus materi ini?")) return;
    setBusy(true);
    try {
      await deleteEdukasi({ data: { token, id: form.id } });
      setForm(emptyEdukasi());
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="producer-page">
      <PageHeader eyebrow="Edukasi CMS" title="Edukasi" description="Susun materi belajar bertahap dengan struktur yang jelas dan mudah dipindai.">
        <button type="button" className="btn btn-primary" onClick={() => setForm(emptyEdukasi())}><Plus size={16} />Edukasi Baru</button>
      </PageHeader>
      <div className="content-workspace editorial-workspace">
        <aside className="content-list-panel"><div className="content-list-head"><div><span className="panel-eyebrow">Learning library</span><h2>Semua Edukasi</h2><p>{items.length} materi tersimpan</p></div><button type="button" className="icon-btn" onClick={() => setForm(emptyEdukasi())}><Plus size={17} /></button></div><div className="content-filter-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari materi…" /></div><div className="content-list-scroll">{filtered.map((item) => <button key={item.id} type="button" className={cn("content-list-item", form.id === item.id && "is-selected")} onClick={() => setForm(item)}><Thumb src={item.imageUrl} fallback="B" className="content-thumb" /><span className="content-item-main"><span className="content-item-top"><strong>{item.level}</strong><span className="badge">Published</span></span><span className="content-item-title">{item.title}</span><span className="content-item-meta">Materi belajar</span></span><ChevronRight size={15} className="text-subtle" /></button>)}{!filtered.length ? <EmptyState text="Belum ada materi yang cocok." /> : null}</div></aside>
        <form className="editor-panel" onSubmit={submit}><div className="editor-topbar"><div><span className="panel-eyebrow">{form.id ? `Materi #${form.id}` : "Konten baru"}</span><h2>{form.id ? form.title : "Buat materi"}</h2><p>Struktur materi yang fokus pada learning path.</p></div><span className="badge">{form.level}</span></div>{error ? <div className="inline-error">{error}</div> : null}<FormSection icon={<BookOpen size={17} />} title="Learning content" description="Tentukan level lalu susun materi dengan urutan yang mudah dipelajari."><Field label="Level"><select className="control" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as EduLevel })}><option>Pemula</option><option>Menengah</option><option>Lanjutan</option></select></Field><div className="field-gap" /><Field label="Judul"><input className="control control-lg" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field><div className="field-gap" /><Field label="Deskripsi"><textarea className="control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></Field><div className="field-gap" /><Field label="Isi materi"><textarea className="control editor-textarea" rows={16} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field></FormSection><FormSection icon={<ExternalLink size={17} />} title="Media" description="Tambahkan visual untuk cover materi."><ImageField value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} /></FormSection><div className="editor-actions"><div className="editor-actions-left">{form.id ? <button type="button" className="btn btn-danger" onClick={() => void remove()} disabled={busy}><Trash2 size={15} />Hapus</button> : null}</div><div className="editor-actions-right"><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan materi"}</button></div></div></form>
        <aside className="preview-panel"><div className="preview-panel-head"><div><span className="panel-eyebrow">Public Preview</span><h3>Learning card</h3></div><span className="preview-state">Preview</span></div><article className="learning-preview"><div className="learning-preview-cover">{form.imageUrl ? <img src={form.imageUrl} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <BookOpen size={34} />}</div><div className="learning-preview-body"><span className="badge">{form.level}</span><h4>{form.title || "Judul materi"}</h4><p>{form.description || "Deskripsi materi akan tampil di sini."}</p><div className="learning-preview-block"><span>Isi</span><p>{form.body ? `${form.body.slice(0, 180)}${form.body.length > 180 ? "…" : ""}` : "Belum ada isi materi."}</p></div></div></article></aside>
      </div>
    </div>
  );
}

function ImageField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return <div className="media-field"><div className="media-input-stack"><Field label="URL gambar"><input className="control" value={value.startsWith("data:") ? "" : value} placeholder="https://..." onChange={(e) => onChange(e.target.value)} /></Field><label className="file-drop"><input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 350_000) { alert("Maksimal 350KB."); return; } const reader = new FileReader(); reader.onload = () => onChange(String(reader.result ?? "")); reader.readAsDataURL(file); }} /><span><UploadIcon /><strong>Pilih gambar</strong><small>JPG / PNG · maks 350KB</small></span></label></div><div className="media-preview">{value ? <img src={value} alt="" /> : <div><FileText size={24} /><span>Preview media</span></div>}</div></div>;
}

function UploadIcon() { return <ArrowUpRight size={17} />; }

function Thumb({ src, fallback, className }: { src?: string; fallback: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <span className={cn("thumb-fallback", className)}>{src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : <span>{fallback.slice(0, 2)}</span>}</span>;
}

function PreviewLevel({ label, value }: { label: string; value: string }) { return <div className="preview-level"><span>{label}</span><strong>{value || "—"}</strong></div>; }

function FormSection({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return <section className="form-section"><div className="form-section-head"><span className="section-icon">{icon}</span><div><h3>{title}</h3><p>{description}</p></div></div><div className="form-section-body">{children}</div></section>;
}

function PageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <div className="producer-page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children ? <div className="page-header-actions">{children}</div> : null}</div>;
}

function PanelHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="panel-head"><div><h2>{title}</h2><p>{description}</p></div>{action}</div>;
}

function EmptyState({ text }: { text: string }) { return <div className="empty-state"><FileText size={18} /><span>{text}</span></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span className="field-label">{label}</span>{children}</label>; }

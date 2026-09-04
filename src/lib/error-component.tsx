export function AppErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  const message = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak terduga.";
  return (
    <section className="py-24">
      <div className="container-site max-w-3xl">
        <div className="rounded-md border border-accent-red/30 bg-surface p-6">
          <p className="eyebrow">Producer Error</p>
          <h1 className="mt-2 text-2xl font-extrabold">Halaman gagal dimuat</h1>
          <p className="mt-2 text-sm text-muted">{message}</p>
          <button type="button" className="btn btn-outline mt-5" onClick={reset}>Coba lagi</button>
        </div>
      </div>
    </section>
  );
}

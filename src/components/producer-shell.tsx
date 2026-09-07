import { useEffect, useState, type ReactNode } from "react";
import { BrandLockup } from "@/components/brand-mark";

export function ProducerShell({ children }: { children: ReactNode }) {
  const [booting, setBooting] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("bs-producer-booted")) return;
    setBooting(true);
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("bs-producer-booted", "1");
      setBooting(false);
    }, 650);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {booting ? (
        <div className="boot-screen" role="status" aria-label="Memuat Producer Studio">
          <div className="boot-mark"><BrandLockup size="lg" /></div>
          <div className="boot-bar" aria-hidden="true"><div className="boot-bar-fill" /></div>
        </div>
      ) : null}
      <main>{children}</main>
    </div>
  );
}

export function RoutePending() {
  return <div className="route-pending" role="progressbar" aria-label="Memuat halaman"><div className="route-pending-fill" /></div>;
}

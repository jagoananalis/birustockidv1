import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { ProducerShell } from "@/components/producer-shell";
import { AppErrorComponent } from "@/lib/error-component";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Producer Studio | Birustock" },
      { name: "description", content: "Internal content management system Birustock." },
      { name: "theme-color", content: "#070708" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  errorComponent: AppErrorComponent,
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="id" className="antialiased" suppressHydrationWarning>
      <head><HeadContent /></head>
      <body><ProducerShell><Outlet /></ProducerShell><Scripts /></body>
    </html>
  );
}

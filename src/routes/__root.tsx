import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import { createServerFn } from "@tanstack/react-start";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "sonner";
import { STUDIO_NAME } from "@/lib/catalog";
import { cancelScrollAnim } from "@/lib/scroll-to-section";
import appCss from "../styles.css?url";

/** Same host guard the injector uses for og:image — skip vercel/IP/local. */
const fetchPublicHost = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { resolvePublicHost } = await import("../../scripts/grok-pwa-shared.mjs");
    const req = getRequest();
    const header =
      req?.headers.get("x-forwarded-host") || req?.headers.get("host") || "";
    return resolvePublicHost(header);
  } catch {
    return "";
  }
});

export const Route = createRootRoute({
  loader: async () => {
    try {
      const host = await fetchPublicHost();
      return { xBanner: host ? `https://${host}/x-banner.jpg` : "" };
    } catch {
      return { xBanner: "" };
    }
  },
  head: ({ loaderData }) => {
    const xBanner = loaderData?.xBanner;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { title: STUDIO_NAME },
        {
          name: "description",
          content:
            "Dog Training with Emily — private in-home dog training in Houston. Enrichment, structure, and ownership for dogs and the people who love them.",
        },
        { name: "theme-color", content: "#43C5B9" },
        ...(xBanner ? [{ property: "x:game:image", content: xBanner }] : []),
      ],
      links: [
        { rel: "icon", type: "image/png", href: "/favicon.png?v=2" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=2" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/__grok/manifest.webmanifest" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500;1,600;1,700&display=swap",
        },
      ],
    };
  },
  component: RootDocument,
});

function ScrollToTop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useLayoutEffect(() => {
    cancelScrollAnim();
    if (pathname === "/") return;
    const id = requestAnimationFrame(() => {
      const scroller = document.getElementById("app-scroll");
      if (scroller) scroller.scrollTop = 0;
      window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);
  return null;
}

function RootDocument() {
  return (
    <html lang="en" className="h-full overflow-hidden antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{history.scrollRestoration="manual"}catch(e){}',
          }}
        />
      </head>
      <body className="h-full overflow-hidden bg-bg text-ink">
        <div id="app-scroll" className="app-scroll">
          <ScrollToTop />
          <PreviewHostBridge />
          <AuthProvider>
            <div className="flex min-h-full flex-col">
              <SiteHeader />
              <div className="flex min-h-0 flex-1 flex-col">
                <Outlet />
              </div>
            </div>
          </AuthProvider>
        </div>
        <Toaster
          position="bottom-center"
          toastOptions={{
            className: "font-sans",
            style: {
              background: "#FBF8F1",
              color: "#2F1C12",
              border: "1px solid rgba(47,28,18,0.12)",
            },
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}

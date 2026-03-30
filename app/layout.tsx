import "./globals.css";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { SiteHeader } from "@/components/SiteHeader";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <SiteHeader />
          <main className="pt-[120px] md:pt-[112px]">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}

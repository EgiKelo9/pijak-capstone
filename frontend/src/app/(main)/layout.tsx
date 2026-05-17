import { AppSidebarLayout } from "./mainSidebar";

export default function LandingPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="fixed top-0 left-0 w-full z-50">
          <AppSidebarLayout>
            {children}
          </AppSidebarLayout>
        </div>
      </body>
    </html>
  );
}
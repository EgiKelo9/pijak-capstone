import { AppSidebarLayout } from "./mainSidebar";

export default function LandingPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // <html lang="en" suppressHydrationWarning>
      // <body>
        <div className="fixed top-0 left-0 w-full h-screen z-50 flex flex-col overflow-hidden">
          <AppSidebarLayout>
            {children}
          </AppSidebarLayout>
        </div>
      // </body>
    // </html>
  );
}
import { cookies } from "next/headers";
import { AppSidebarLayout } from "./mainSidebar";

export default async function LandingPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state");
  let defaultOpen = true;
  if (sidebarState) {
    defaultOpen = sidebarState.value === "true";
  }

  return (
    // <html lang="en" suppressHydrationWarning>
      // <body>
        <div className="fixed top-0 left-0 w-full h-screen z-50 flex flex-col overflow-hidden">
          <AppSidebarLayout defaultOpen={defaultOpen}>
            {children}
          </AppSidebarLayout>
        </div>
      // </body>
    // </html>
  );
}
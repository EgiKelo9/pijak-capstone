import NavbarDemo from "./navbar";

export default function LandingPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <div>
    <div className="fixed top-0 left-0 w-full z-50">
      <NavbarDemo />
    </div>
    {children}
  </div>
)
}
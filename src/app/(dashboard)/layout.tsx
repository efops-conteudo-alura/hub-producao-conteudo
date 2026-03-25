export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      <main className="flex-1">{children}</main>
    </div>
  );
}

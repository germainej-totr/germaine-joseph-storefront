export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section className="min-h-screen bg-white">
      {children}
    </section>
  );
}
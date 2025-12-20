export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-dark-primary to-dark-secondary">
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}

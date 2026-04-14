
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 pb-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />

      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        {children}
      </div>
    </div>
  )
}

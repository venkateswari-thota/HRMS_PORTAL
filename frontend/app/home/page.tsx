import Link from 'next/link';
import { ArrowRight, ShieldCheck, UserCheck, MapPin, ScanFace } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 selection:bg-blue-500/30 overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[128px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[128px] pointer-events-none mix-blend-multiply" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] pointer-events-none" />

      <main className="relative z-10 container mx-auto px-4 min-h-screen flex flex-col justify-center items-center">

        {/* Header Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-sm text-blue-600 shadow-sm mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            System Operational
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900">
            Pragyatmika Intelligence
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            Next-Generation Human Resource Management System powered by <span className="text-blue-600 font-medium">Geo-Fencing</span> & <span className="text-purple-600 font-medium">Face AI</span>.
          </p>
        </div>

        {/* Portals Grid */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">

          {/* Admin Portal Card */}
          <div className="group relative p-8 rounded-2xl bg-white border border-gray-200 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="p-4 rounded-full bg-blue-50 border border-blue-100 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-10 h-10 text-blue-600" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Admin Portal</h2>
                <p className="text-sm text-gray-600">Manage workforce, configure geofences, and review attendance requests.</p>
              </div>

              <div className="flex gap-4 w-full pt-4">
                <Link
                  href="/auth/admin/signin"
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  Sign In <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/auth/admin/signup"
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-medium transition-all text-sm"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>

          {/* Employee Portal Card */}
          <div className="group relative p-8 rounded-2xl bg-white border border-gray-200 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="p-4 rounded-full bg-purple-50 border border-purple-100 group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-10 h-10 text-purple-600" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Employee Portal</h2>
                <p className="text-sm text-gray-600">Mark attendance with Face ID, view history, and submit corrections.</p>
              </div>

              <div className="w-full pt-4">
                <Link
                  href="/auth/employee/signin"
                  className="w-full px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  Employee Login <ScanFace className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Features */}
        <div className="mt-20 grid grid-cols-3 gap-8 text-center opacity-60 max-w-2xl w-full text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <MapPin className="w-5 h-5 mb-1" />
            <span className="text-xs uppercase tracking-wider font-semibold">Geo-Fencing</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ScanFace className="w-5 h-5 mb-1" />
            <span className="text-xs uppercase tracking-wider font-semibold">Face Match</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="w-5 h-5 mb-1" />
            <span className="text-xs uppercase tracking-wider font-semibold">Secure Access</span>
          </div>
        </div>

      </main>
    </div>
  );
}

import { Link, useNavigate } from 'react-router';
import { ShieldX, ArrowLeft } from 'lucide-react';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mx-auto mb-6">
          <ShieldX size={36} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">403 — Unauthorized</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          You don&apos;t have permission to view this page. Please contact your administrator
          or return to your dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          <Link
            to="/"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

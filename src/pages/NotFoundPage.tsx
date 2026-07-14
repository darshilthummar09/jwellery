import { Link } from 'react-router';
import { SearchX } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <SearchX size={36} className="text-slate-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">404 — Not Found</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}

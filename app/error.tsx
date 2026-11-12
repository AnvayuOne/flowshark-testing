'use client';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16">
      <div className="card space-y-3 p-6">
        <h1 className="text-xl font-bold">Something went wrong loading this page</h1>
        <p className="text-sm text-slate-600">
          The most common cause is the database: not connected, or not reachable from the server.
          Open <a href="/api/health" className="font-semibold text-brand-600 underline">/api/health</a> to see what is missing.
        </p>
        {error.digest && <p className="font-mono text-xs text-slate-400">Error reference: {error.digest}</p>}
        <button onClick={reset} className="btn-primary">Try again</button>
      </div>
    </div>
  );
}

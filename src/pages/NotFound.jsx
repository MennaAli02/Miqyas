import { AlertCircle } from '../components/Icons';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div className="w-full max-w-md mx-4 rounded-xl border border-card-border bg-card p-6 shadow-xs">
        <div className="flex mb-4 gap-3 items-center">
          <AlertCircle className="h-8 w-8 text-destructive shrink-0" />
          <h1 className="text-xl font-bold text-foreground">404 Page Not Found</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested page could not be found.
        </p>
        <div className="mt-4">
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            Return to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}

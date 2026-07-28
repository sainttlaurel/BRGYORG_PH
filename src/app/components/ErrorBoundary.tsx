import React from "react";
import { Link } from "react-router";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import * as Sentry from "@sentry/react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId?: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo.componentStack);
    const id = Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
    this.setState({ errorId: id });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-1 max-w-md text-sm">
            An unexpected error occurred while loading this page.
          </p>
          {this.state.errorId && (
            <p className="text-muted-foreground/50 text-xs mb-6 font-mono flex items-center gap-1.5">
              <Bug size={12} /> Error ID: {this.state.errorId.slice(0, 8)}
            </p>
          )}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-sm"
            >
              <RefreshCw size={14} /> Reload page
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-all"
            >
              <Home size={14} /> Go home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

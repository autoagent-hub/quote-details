import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { QuoteFlowLogo } from "./QuoteFlowLogo";
import { RefreshCw, Home } from "lucide-react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  boundaryName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function isChunkLoadError(error?: Error | null): boolean {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("importing a module script failed") ||
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("loading chunk") ||
    msg.includes("loading css chunk") ||
    msg.includes("dynamically imported module")
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[ErrorBoundary:${this.props.boundaryName || "general"}] Uncaught error:`,
      error,
      errorInfo,
    );

    // If dynamic chunk loading failed due to a new deployment, auto-reload once to fetch fresh assets
    if (isChunkLoadError(error) && typeof window !== "undefined") {
      const lastReload = sessionStorage.getItem("detailr_chunk_auto_reload");
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 15000) {
        sessionStorage.setItem("detailr_chunk_auto_reload", String(now));
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "CLEAR_ALL_CACHES" });
        }
        window.location.reload();
        return;
      }
    }

    try {
      reportLovableError(error, {
        boundary: this.props.boundaryName || "react_error_boundary",
        componentStack: errorInfo.componentStack,
      });
    } catch {
      // ignore
    }
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = () => {
    if (isChunkLoadError(this.state.error) && typeof window !== "undefined") {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_ALL_CACHES" });
      }
      window.location.href = window.location.pathname + "?_v=" + Date.now();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return this.props.fallback(this.state.error!, this.handleReset);
        }
        return this.props.fallback;
      }

      const isChunkError = isChunkLoadError(this.state.error);

      return (
        <div className="flex min-h-[50vh] w-full items-center justify-center bg-background px-4 py-12">
          <div className="max-w-md text-center rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5">
            <div className="mb-6 flex justify-center">
              <QuoteFlowLogo size="lg" linkToHome />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {isChunkError ? "Dashboard Update Available" : "Something went wrong in this section"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {isChunkError
                ? "A new version of the Detailr application was deployed. Please reload the dashboard to load the latest components."
                : "An unexpected state error occurred. You can try refreshing this view or reloading the page."}
            </p>
            {this.state.error?.message && !isChunkError && (
              <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-left">
                <p className="font-mono text-xs text-destructive break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-105 transition-all"
              >
                <RefreshCw className="size-4" /> {isChunkError ? "Reload Dashboard" : "Try Again"}
              </button>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all"
              >
                <Home className="size-4" /> Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

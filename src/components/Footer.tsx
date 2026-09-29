import { Link } from "@tanstack/react-router";
import { QuoteFlowLogo } from "./QuoteFlowLogo";

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-surface/50 py-16 text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <QuoteFlowLogo size="md" linkToHome />
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              The modern, instant quote software built specifically for mobile auto detailers.
              Founded by Nerochaze.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Uptime: 99.98% (All Systems Operational)</span>
            </div>
          </div>

          {/* Product & Trust Pages */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Product & Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/changelog"
                  className="hover:text-primary transition-colors text-left block"
                >
                  Changelog
                </Link>
              </li>
              <li>
                <Link
                  to="/testimonials"
                  className="hover:text-primary transition-colors text-left block"
                >
                  Testimonials
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="hover:text-primary transition-colors text-left block"
                >
                  Help & Support
                </Link>
              </li>
              <li>
                <Link to="/docs" className="hover:text-primary transition-colors text-left block">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/status" className="hover:text-primary transition-colors text-left block">
                  System Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Policy Pages */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Policies & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors text-left block">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-primary transition-colors text-left block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-primary transition-colors text-left block">
                  Refund & Cancellation
                </Link>
              </li>
              <li>
                <Link
                  to="/security"
                  className="hover:text-primary transition-colors text-left block"
                >
                  Security & Data
                </Link>
              </li>
              <li>
                <Link to="/cookie" className="hover:text-primary transition-colors text-left block">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Informational Pages */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/blog"
                  className="hover:text-primary transition-colors text-left font-semibold text-foreground block"
                >
                  Blog & Articles (NEW)
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors block">
                  Login to Portal
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-primary transition-colors block">
                  Get Started (Free Trial)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-border/60 pt-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-4">
          <p>
            © {new Date().getFullYear()}{" "}
            <Link
              to="/founder"
              className="font-semibold text-foreground hover:underline hover:text-primary transition-colors"
            >
              Nerochaze
            </Link>{" "}
            · Detailr · Built for professional mobile auto detailers.
          </p>
        </div>
      </div>
    </footer>
  );
}

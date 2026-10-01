import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HelpCircle, ArrowLeft, Mail, Smartphone, User, CheckCircle2 } from "lucide-react";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SeoHead } from "@/components/seo/SeoHead";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/support")({
  ssr: false,
  component: SupportPage,
});

function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSubmitSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SeoHead
        title="Help & Support — Detailr"
        description="Need support with your automated quote calculator or Telegram connections? Contact founder Nerochaze directly."
      />

      {/* Header */}
      <header className="sticky top-3 z-50 px-4">
        <div className="mx-auto flex h-15 max-w-6xl items-center justify-between rounded-2xl border border-border/80 bg-background/85 px-4 shadow-lg shadow-black/5 backdrop-blur-md sm:px-6">
          <QuoteFlowLogo size="md" linkToHome />
          <Button asChild variant="outline" size="sm" className="gap-2 text-xs font-bold">
            <Link to="/">
              <ArrowLeft className="size-3.5" /> Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-16 px-5 max-w-3xl mx-auto w-full">
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HelpCircle className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold text-foreground">
                Help & Support
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Get in touch directly with developer Nerochaze
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 pt-4">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground">Direct Technical Channels</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you are running into issues with your automated Telegram integration or
                configuring your custom pricing matrix, Nerochaze is active online to troubleshoot.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 rounded-xl bg-surface p-3 border border-border/80">
                  <Mail className="size-4 text-primary shrink-0" />
                  <div>
                    <p className="font-bold text-foreground">Developer Support Email</p>
                    <p className="text-muted-foreground">support@detailr.online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-surface p-3 border border-border/80">
                  <Mail className="size-4 text-primary shrink-0" />
                  <div>
                    <p className="font-bold text-foreground">Backup Support</p>
                    <p className="text-muted-foreground">teamnerochaze@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="p-6 border-border bg-card shadow-lg rounded-2xl">
              {success ? (
                <div className="text-center py-6 space-y-3">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Support Ticket Opened</h4>
                  <p className="text-xs text-muted-foreground">
                    Thanks for reaching out! Founder Nerochaze or our team will reply directly to
                    your email address within 4 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Open Support Case
                  </h4>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Message
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Explain your problem or questions clearly..."
                      className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    variant="hero"
                    className="w-full text-xs font-bold h-9"
                  >
                    {submitting ? "Sending..." : "Submit Support Request"}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

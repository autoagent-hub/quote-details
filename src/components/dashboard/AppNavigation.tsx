import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sliders,
  Store,
  HelpCircle,
  CreditCard,
  LogOut,
  Shield,
  Copy,
  Check,
  Globe,
  FlaskConical,
  Menu,
  X,
  Send,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BookOpen,
  ReceiptText,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@/components/dashboard/types";
import { isAdminEmail } from "@/lib/admin-auth";

interface AppNavigationProps {
  profile: Profile | null;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  userEmail?: string | null;
}

export function AppNavigation({
  profile,
  activeTab = "quotes",
  onSelectTab,
  userEmail,
}: AppNavigationProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const isUserAdmin = isAdminEmail(userEmail);

  const copyQuoteLink = () => {
    if (!profile?.slug) return;
    const url = `${window.location.origin}/${profile.slug}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Public quote link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/auth" });
  };

  const handleNavClick = (tabKey: string) => {
    if (onSelectTab) {
      onSelectTab(tabKey);
    } else {
      navigate({ to: "/dashboard" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-8">
          {/* Brand Logo & Status */}
          <div className="flex items-center gap-3 shrink-0">
            <QuoteFlowLogo size="sm" linkToHome />
            {profile && (
              <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Shop Online
              </span>
            )}
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 rounded-2xl border border-border/40 bg-muted/30 p-1">
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "quotes" || activeTab === "dashboard"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <LayoutDashboard className="size-3.5 opacity-80 text-primary" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/quotes"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "all-quotes"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <ReceiptText className="size-3.5 opacity-80 text-emerald-500" />
              <span>Quotes</span>
            </Link>

            <Link
              to="/pricing"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "pricing"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Sliders className="size-3.5 opacity-80 text-amber-500" />
              <span>Services</span>
            </Link>

            <Link
              to="/notifications"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "notifications"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Send className="size-3.5 opacity-80 text-blue-500" />
              <span>Alerts</span>
              {profile?.telegram_chat_id ? (
                <span className="size-1.5 rounded-full bg-emerald-500" />
              ) : (
                <span className="size-1.5 rounded-full bg-amber-500" />
              )}
            </Link>

            <Link
              to="/profile"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "profile"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Store className="size-3.5 opacity-80 text-purple-500" />
              <span>Profile</span>
            </Link>

            <Link
              to="/settings"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "settings"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Settings className="size-3.5 opacity-80 text-slate-500" />
              <span>Settings</span>
            </Link>

            <Link
              to="/help"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "help"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <HelpCircle className="size-3.5 opacity-80 text-cyan-500" />
              <span>Help</span>
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {profile && (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl px-3 border-border/60 font-bold text-[11px] gap-1.5 transition-all hover:bg-surface"
                  onClick={copyQuoteLink}
                  title="Copy your public quote form link"
                >
                  {copied ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5 opacity-70" />
                  )}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl px-2.5 text-muted-foreground hover:text-foreground text-[11px] font-bold gap-1.5 hidden lg:flex"
                  title="Preview quote calculator in test sandbox"
                >
                  <a href={`/${profile.slug}?test=true`} target="_blank" rel="noreferrer">
                    <FlaskConical className="size-3.5 text-amber-500" />
                    <span>Sandbox</span>
                  </a>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl px-2.5 text-muted-foreground hover:text-foreground text-[11px] font-bold gap-1.5 hidden xl:flex"
                  title="View live quote calculator"
                >
                  <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
                    <Globe className="size-3.5 opacity-60" />
                    <span>Live Page</span>
                  </a>
                </Button>
              </div>
            )}

            <div className="h-4 w-px bg-border/60 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-1.5">
              {isUserAdmin && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl px-2.5 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-bold text-[10px] uppercase tracking-wider"
                >
                  <Link to="/master-hq">
                    <Shield className="size-3.5 mr-1" />
                    <span>Admin</span>
                  </Link>
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 rounded-xl px-3 border-border/60 font-bold text-[10px] uppercase tracking-wider transition-all hover:bg-surface"
              >
                <Link to="/upgrade">
                  <CreditCard className="size-3.5 mr-1 opacity-60" /> Upgrade
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl px-2.5 text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase tracking-wider transition-all"
                onClick={signOut}
              >
                <LogOut className="size-3.5 mr-1 opacity-60" /> Exit
              </Button>
            </div>

            {/* Mobile Hamburger Button */}
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-xl md:hidden border-border/60"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Slide-Down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border/60 bg-background px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold text-left border ${
                  activeTab === "quotes" || activeTab === "dashboard"
                    ? "border-primary/30 bg-primary/5 text-foreground"
                    : "border-border/40 bg-muted/20 text-muted-foreground"
                }`}
              >
                <LayoutDashboard className="size-4 text-primary shrink-0" />
                <div>
                  <div className="font-bold">Dashboard</div>
                  <div className="text-[10px] font-normal text-muted-foreground">Overview</div>
                </div>
              </Link>

              <Link
                to="/quotes"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold text-left border ${
                  activeTab === "all-quotes"
                    ? "border-primary/30 bg-primary/5 text-foreground"
                    : "border-border/40 bg-muted/20 text-muted-foreground"
                }`}
              >
                <ReceiptText className="size-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold">Quotes & Leads</div>
                  <div className="text-[10px] font-normal text-muted-foreground">Submissions</div>
                </div>
              </Link>

              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold text-left border ${
                  activeTab === "pricing"
                    ? "border-primary/30 bg-primary/5 text-foreground"
                    : "border-border/40 bg-muted/20 text-muted-foreground"
                }`}
              >
                <Sliders className="size-4 text-amber-500 shrink-0" />
                <div>
                  <div className="font-bold">Services & Prices</div>
                  <div className="text-[10px] font-normal text-muted-foreground">
                    Packages & Rates
                  </div>
                </div>
              </Link>

              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold text-left border ${
                  activeTab === "notifications"
                    ? "border-primary/30 bg-primary/5 text-foreground"
                    : "border-border/40 bg-muted/20 text-muted-foreground"
                }`}
              >
                <Send className="size-4 text-blue-500 shrink-0" />
                <div>
                  <div className="font-bold">Telegram Alerts</div>
                  <div className="text-[10px] font-normal text-muted-foreground">
                    Phone Notifications
                  </div>
                </div>
              </Link>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold text-left border ${
                  activeTab === "profile"
                    ? "border-primary/30 bg-primary/5 text-foreground"
                    : "border-border/40 bg-muted/20 text-muted-foreground"
                }`}
              >
                <Store className="size-4 text-purple-500 shrink-0" />
                <div>
                  <div className="font-bold">Shop Profile</div>
                  <div className="text-[10px] font-normal text-muted-foreground">
                    Slug & Branding
                  </div>
                </div>
              </Link>

              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold text-left border ${
                  activeTab === "settings"
                    ? "border-primary/30 bg-primary/5 text-foreground"
                    : "border-border/40 bg-muted/20 text-muted-foreground"
                }`}
              >
                <Settings className="size-4 text-slate-500 shrink-0" />
                <div>
                  <div className="font-bold">Settings</div>
                  <div className="text-[10px] font-normal text-muted-foreground">
                    Account & Access
                  </div>
                </div>
              </Link>

              <Link
                to="/help"
                onClick={() => setMobileMenuOpen(false)}
                className={`col-span-2 flex items-center gap-2 p-3 rounded-2xl text-xs font-bold text-left border ${
                  activeTab === "help"
                    ? "border-primary/30 bg-primary/5 text-foreground"
                    : "border-border/40 bg-muted/20 text-muted-foreground"
                }`}
              >
                <HelpCircle className="size-4 text-cyan-500 shrink-0" />
                <div>
                  <div className="font-bold">Help Center & FAQ</div>
                  <div className="text-[10px] font-normal text-muted-foreground">
                    Guides, Setup & Support
                  </div>
                </div>
              </Link>
            </div>

            {profile && (
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl h-10 font-bold text-xs gap-2 justify-center"
                  onClick={copyQuoteLink}
                >
                  {copied ? (
                    <Check className="size-4 text-emerald-600" />
                  ) : (
                    <Copy className="size-4 opacity-70" />
                  )}
                  <span>{copied ? "Link Copied!" : "Copy Public Quote Link"}</span>
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`/${profile.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 h-9 rounded-xl border border-border/60 bg-muted/10 text-xs font-bold text-foreground"
                  >
                    <Globe className="size-3.5 opacity-60" /> Live Page
                  </a>
                  <a
                    href={`/${profile.slug}?test=true`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 h-9 rounded-xl border border-border/60 bg-muted/10 text-xs font-bold text-foreground"
                  >
                    <FlaskConical className="size-3.5 text-amber-500" /> Sandbox
                  </a>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl px-3 font-bold text-xs gap-1.5"
              >
                <Link to="/upgrade">
                  <CreditCard className="size-4 opacity-60" /> Upgrade Plan
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl px-3 text-destructive font-bold text-xs gap-1.5"
                onClick={signOut}
              >
                <LogOut className="size-4" /> Sign Out
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Unified Help & Support Interactive Modal */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-6">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HelpCircle className="size-5" />
            </div>
            <DialogTitle className="text-xl font-bold">Help & Detailr Support Center</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Everything you need to configure your instant quote form, set up phone alerts, and
              close more leads.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick Action Cards */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://t.me/detailronline"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 transition-all hover:bg-primary/10 group"
              >
                <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Send className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1">
                    Telegram Bot{" "}
                    <ExternalLink className="size-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">Connect phone alerts</p>
                </div>
              </a>

              <button
                onClick={() => {
                  setHelpOpen(false);
                  if (onSelectTab) onSelectTab("notifications");
                }}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-left transition-all hover:bg-muted/40 group"
              >
                <div className="size-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Sliders className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">Edit Prices</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Services & multipliers
                  </p>
                </div>
              </button>
            </div>

            {/* Accordion FAQ */}
            <div className="rounded-2xl border border-border/60 bg-card p-2">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b-border/40">
                  <AccordionTrigger className="text-xs font-bold py-3 hover:no-underline">
                    📱 How do I get instant Telegram lead notifications?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    1. Open Telegram on your phone or desktop and search for{" "}
                    <strong>@detailr_bot</strong> (or click the Telegram button above).
                    <br />
                    2. Tap <strong>Start</strong> in the Telegram chat to retrieve your numeric Chat
                    ID.
                    <br />
                    3. Paste your Chat ID into the <strong>Telegram Alerts</strong> settings tab on
                    your dashboard and hit Save.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-b-border/40">
                  <AccordionTrigger className="text-xs font-bold py-3 hover:no-underline">
                    🔗 Where should I put my Detailr quote link?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Copy your unique link (e.g. <code>detailr.online/your-shop</code>) and add it to
                    your:
                    <ul className="list-disc pl-4 mt-1.5 space-y-1">
                      <li>Instagram & TikTok bio</li>
                      <li>Google Business Profile website button</li>
                      <li>Facebook page CTA & auto-responder message</li>
                      <li>SMS text messages to prospective clients</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-b-border/40">
                  <AccordionTrigger className="text-xs font-bold py-3 hover:no-underline">
                    🚘 How do vehicle size pricing multipliers work?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    In <strong>Settings & Prices</strong>, you set base rates for your core
                    detailing packages (e.g. $150 for Full Detail). Vehicle categories (Sedan, SUV,
                    Truck, Van) multiply this base price according to size effort, giving customers
                    accurate estimates instantly.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-none">
                  <AccordionTrigger className="text-xs font-bold py-3 hover:no-underline">
                    💬 Need priority support or custom integration help?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Our team is available 24/7 on Telegram. Reach out to us at{" "}
                    <strong>@detailronline</strong> or email <strong>support@detailr.online</strong>{" "}
                    for assistance.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

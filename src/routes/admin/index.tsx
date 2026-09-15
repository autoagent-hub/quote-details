import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  Crown,
  Sparkles,
  RefreshCw,
  LogOut,
  ExternalLink,
  MoreVertical,
  Mail,
  Phone,
  Send,
  Trash2,
  Car,
  ChevronRight,
  X,
  Play,
  Activity,
  Layers,
  Bell,
  Radio,
  Lock,
  AlertOctagon,
  MessageSquare,
  ShieldAlert,
  Check,
  Settings,
  Link as LinkIcon,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { isAdminEmail } from "@/lib/admin-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAdminOverviewMetrics,
  getAdminUsersList,
  adminPerformUserAction,
  adminGetDetailerQuotes,
  adminTriggerSummaryEmail,
  adminGetRecentQuotesStream,
  getAdminAuditLogs,
  getAdminCheckoutUrl,
  updateAdminCheckoutUrl,
  type AdminDetailerSummary,
} from "@/lib/admin-dashboard.functions";
import { adminSendWelcomeEmailToAllActiveUsers } from "@/lib/weekly-summary.functions";
import { getCapturedErrors } from "@/lib/error-tracker";
import {
  getAdminTelegramStatus,
  updateAdminTelegramSettings,
  sendAdminTelegramTestAlert,
  adminFlagUserSuspicious,
  type AdminAlertSeverity,
} from "@/lib/admin-telegram.functions";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Console — Detailr (Master HQ)" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"users" | "quotes" | "security" | "tools">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedDetailerForQuotes, setSelectedDetailerForQuotes] =
    useState<AdminDetailerSummary | null>(null);
  const [telegramSettingsOpen, setTelegramSettingsOpen] = useState(false);
  const [manualChatIdInput, setManualChatIdInput] = useState("");
  const [notifySignupsToggle, setNotifySignupsToggle] = useState(true);
  const [notifySuspiciousToggle, setNotifySuspiciousToggle] = useState(true);

  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: "ban" | "extend_trial" | "delete" | "grant_pro" | "flag_suspicious";
    user: AdminDetailerSummary | null;
    reason?: string;
    customDays?: number;
    severity?: AdminAlertSeverity;
  }>({ open: false, type: "ban", user: null, reason: "", customDays: 7, severity: "HIGH" });

  // 1. Verify admin session
  const [adminUser, setAdminUser] = useState<{ email: string; id: string } | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email?.toLowerCase();
      if (isAdminEmail(email)) {
        setAdminUser({ email: email!, id: data.session!.user.id });
        setAuthChecking(false);
      } else {
        setAuthChecking(false);
      }
    });
  }, []);

  // 2. Fetch metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: () => getAdminOverviewMetrics(),
    enabled: !!adminUser,
    refetchInterval: 30000,
  });

  // 3. Fetch users list
  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["admin", "users", searchQuery, statusFilter],
    queryFn: () => getAdminUsersList({ data: { search: searchQuery, statusFilter } }),
    enabled: !!adminUser,
    refetchInterval: 15000,
  });

  // 4. Fetch platform quotes stream
  const {
    data: quotesStream = [],
    isLoading: quotesLoading,
    refetch: refetchQuotes,
  } = useQuery({
    queryKey: ["admin", "quotes-stream"],
    queryFn: () => adminGetRecentQuotesStream(),
    enabled: !!adminUser && activeTab === "quotes",
  });

  // 5. Fetch quotes for selected detailer drawer
  const { data: detailerQuotes = [], isLoading: detailerQuotesLoading } = useQuery({
    queryKey: ["admin", "detailer-quotes", selectedDetailerForQuotes?.id],
    queryFn: () =>
      selectedDetailerForQuotes
        ? adminGetDetailerQuotes({ data: { detailerId: selectedDetailerForQuotes.id } })
        : [],
    enabled: !!selectedDetailerForQuotes,
  });

  // 6. Fetch admin Telegram connection status
  const {
    data: telegramStatus,
    isLoading: telegramStatusLoading,
    refetch: refetchTelegramStatus,
  } = useQuery({
    queryKey: ["admin", "telegram-status"],
    queryFn: () => getAdminTelegramStatus(),
    enabled: !!adminUser,
    refetchInterval: 15000,
  });

  // 7. Fetch audit logs
  const { data: auditLogs = [], refetch: refetchAuditLogs } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => getAdminAuditLogs(),
    enabled: !!adminUser && activeTab === "security",
    refetchInterval: 10000,
  });

  // 8. Fetch & manage global checkout URL
  const [checkoutUrlInput, setCheckoutUrlInput] = useState("");

  const { data: checkoutUrlData, refetch: refetchCheckoutUrl } = useQuery({
    queryKey: ["admin", "checkout-url"],
    queryFn: () => getAdminCheckoutUrl(),
    enabled: !!adminUser,
  });

  useEffect(() => {
    if (checkoutUrlData?.checkoutUrl) {
      setCheckoutUrlInput(checkoutUrlData.checkoutUrl);
    }
  }, [checkoutUrlData]);

  const updateCheckoutUrlMutation = useMutation({
    mutationFn: (payload: { checkoutUrl: string }) => updateAdminCheckoutUrl({ data: payload }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message);
        void refetchCheckoutUrl();
      } else {
        toast.error(res.error || "Failed to update checkout URL");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update checkout URL");
    },
  });

  const capturedErrors = getCapturedErrors();

  // Action mutation
  const userActionMutation = useMutation({
    mutationFn: (payload: {
      userId: string;
      action:
        | "ban"
        | "unban"
        | "flag_suspicious"
        | "unflag_suspicious"
        | "extend_trial"
        | "reset_trial_pending"
        | "grant_pro"
        | "revoke_pro"
        | "delete_user";
      reason?: string;
      customDays?: number;
    }) => adminPerformUserAction({ data: payload }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || "Action executed successfully");
        queryClient.invalidateQueries({ queryKey: ["admin"] });
        setActionModal((prev) => ({ ...prev, open: false }));
      } else {
        toast.error(res.error || "Action failed");
      }
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Action execution error";
      toast.error(message);
    },
  });

  // Send Telegram test alert mutation
  const sendTestAlertMutation = useMutation({
    mutationFn: () => sendAdminTelegramTestAlert(),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.error);
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to dispatch test alert");
    },
  });

  // Update Telegram settings mutation
  const updateTelegramSettingsMutation = useMutation({
    mutationFn: (payload: {
      chatId?: string;
      notifySignups?: boolean;
      notifySuspicious?: boolean;
    }) => updateAdminTelegramSettings({ data: payload }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message);
        queryClient.invalidateQueries({ queryKey: ["admin", "telegram-status"] });
        setTelegramSettingsOpen(false);
      } else {
        toast.error(res.error || "Failed to update Telegram settings");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update Telegram settings");
    },
  });

  // Flag suspicious user mutation
  const flagSuspiciousMutation = useMutation({
    mutationFn: (payload: {
      userId: string;
      reason: string;
      severity?: AdminAlertSeverity;
      details?: string;
    }) => adminFlagUserSuspicious({ data: payload }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message);
        queryClient.invalidateQueries({ queryKey: ["admin"] });
        setActionModal((prev) => ({ ...prev, open: false }));
      } else {
        toast.error(res.error || "Failed to flag user");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to flag user");
    },
  });

  // Trigger weekly email mutation
  const triggerEmailMutation = useMutation({
    mutationFn: (detailerId: string) => adminTriggerSummaryEmail({ data: { detailerId } }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.error);
      }
    },
  });

  // Manual cron trigger
  const [cronRunning, setCronRunning] = useState(false);
  const handleRunEmailCron = async () => {
    setCronRunning(true);
    try {
      const res = await fetch("/api/public/cron-weekly-summary", {
        method: "POST",
        headers: {
          Authorization: "Bearer detailr-cron-weekly-secret",
        },
      });
      const data = (await res.json()) as {
        dispatchedCount?: number;
        message?: string;
        error?: string;
      };
      if (res.ok) {
        toast.success(`Weekly summary cron completed! Dispatched ${data.dispatchedCount} emails.`);
      } else {
        toast.error(`Cron failed: ${data.message || data.error}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Cron execution failed";
      toast.error(message);
    } finally {
      setCronRunning(false);
    }
  };

  const sendWelcomeEmailMutation = useMutation({
    mutationFn: () => adminSendWelcomeEmailToAllActiveUsers(),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error("Failed to send welcome emails");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to send welcome emails");
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.info("Signed out of admin session");
    navigate({ to: "/admin/login" });
  };

  // Auth gate check
  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-2">
          <RefreshCw className="size-5 animate-spin text-primary" /> Loading master console...
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-100">
        <div className="max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <Shield className="mx-auto size-12 text-primary" />
          <h1 className="text-xl font-bold">Admin Portal Gated</h1>
          <p className="text-xs text-slate-400">
            You must be signed in as <strong>me@detailr.online</strong> to access this master
            dashboard.
          </p>
          <Link
            to="/admin/login"
            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90"
          >
            Sign In with Master Credentials
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary selection:text-primary-foreground">
      {/* Top Admin Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <QuoteFlowLogo size="sm" linkToHome />
            <div className="hidden h-5 w-px bg-slate-800 sm:block" />
            <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <Shield className="size-3" /> Master Admin HQ
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Telegram Status Pill */}
            <button
              onClick={() => setTelegramSettingsOpen(true)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                telegramStatus?.isConnected
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              }`}
            >
              <Radio className="size-3 animate-pulse" />
              <span className="hidden sm:inline">
                {telegramStatus?.isConnected ? "Telegram Alerts Active" : "Connect Telegram Alerts"}
              </span>
              <span className="sm:hidden">
                {telegramStatus?.isConnected ? "Telegram: Active" : "Telegram: Inactive"}
              </span>
            </button>

            {/* Test Telegram Alert Button */}
            <Button
              variant="outline"
              size="sm"
              disabled={sendTestAlertMutation.isPending}
              onClick={() => sendTestAlertMutation.mutate()}
              className="h-8 gap-1 border-sky-500/30 bg-sky-500/10 text-xs text-sky-300 hover:bg-sky-500/20 hover:text-white"
              title="Dispatches an instant test notification to the Administrator's Telegram"
            >
              <Bell className="size-3" />
              <span className="hidden md:inline">
                {sendTestAlertMutation.isPending ? "Sending..." : "Test Alert"}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchMetrics();
                refetchUsers();
                refetchTelegramStatus();
                if (activeTab === "quotes") refetchQuotes();
                toast.success("Dashboard metrics refreshed");
              }}
              className="h-8 gap-1.5 border-slate-800 bg-slate-900 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <RefreshCw className="size-3" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={cronRunning}
              onClick={handleRunEmailCron}
              className="hidden lg:flex h-8 gap-1.5 border-primary/30 bg-primary/10 text-xs font-medium text-primary hover:bg-primary/20"
            >
              <Send className="size-3" /> {cronRunning ? "Sending..." : "Weekly Cron"}
            </Button>

            <div className="hidden text-right text-[11px] xl:block">
              <div className="font-semibold text-slate-200">me@detailr.online</div>
              <div className="text-slate-500">Super Administrator</div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-8 gap-1 text-xs text-slate-400 hover:bg-slate-900 hover:text-rose-400"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* KPI Metric Overview */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* Total Detailers */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Detailers</span>
              <Users className="size-4 text-blue-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {metrics?.totalDetailers ?? "—"}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">
                {metrics?.subscribedCount || 0} Pro
              </span>{" "}
              · <span className="text-amber-400">{metrics?.activeTrialCount || 0} Trial</span> ·{" "}
              <span className="text-sky-400">
                {metrics?.pendingVisitCount || 0} Pending 1st Visit
              </span>
            </div>
          </div>

          {/* Active Pro MRR */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Estimated MRR</span>
              <DollarSign className="size-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-400">
              ${metrics?.estimatedMRR?.toLocaleString() ?? "0"}/mo
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {metrics?.subscribedCount || 0} paying shops ($39/mo)
            </div>
          </div>

          {/* Total Quotes Platform-Wide */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Customer Quotes</span>
              <FileText className="size-4 text-purple-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{metrics?.totalQuotes ?? "—"}</div>
            <div className="mt-1 text-[11px] text-slate-400">
              {metrics?.last30DaysQuotes || 0} in last 30 days
            </div>
          </div>

          {/* Pipeline Value Quoted */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Quoted Value ($)</span>
              <TrendingUp className="size-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-400">
              ${metrics?.totalPipelineValue?.toLocaleString() ?? "0"}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Avg Ticket: ${metrics?.averageTicketSize || 0}
            </div>
          </div>

          {/* Total Link Views */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Link Views</span>
              <Eye className="size-4 text-teal-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-teal-300">
              {metrics?.totalLinkViews?.toLocaleString() ?? "0"}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Across all detailer links</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 text-sm font-medium text-slate-400 overflow-x-auto">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-colors whitespace-nowrap ${
              activeTab === "users"
                ? "border-primary text-white"
                : "border-transparent hover:text-slate-200"
            }`}
          >
            <Users className="size-4" /> Detailer Accounts ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("quotes")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-colors whitespace-nowrap ${
              activeTab === "quotes"
                ? "border-primary text-white"
                : "border-transparent hover:text-slate-200"
            }`}
          >
            <Activity className="size-4" /> Live Quotes Stream
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-colors whitespace-nowrap ${
              activeTab === "security"
                ? "border-primary text-white"
                : "border-transparent hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="size-4 text-rose-400" /> Telegram & Security Alerts
            {users.some((u) => u.isFlaggedSuspicious) && (
              <span className="rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-bold text-rose-300">
                {users.filter((u) => u.isFlaggedSuspicious).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-colors whitespace-nowrap ${
              activeTab === "tools"
                ? "border-primary text-white"
                : "border-transparent hover:text-slate-200"
            }`}
          >
            <Layers className="size-4" /> System Health & Cron
          </button>
        </div>

        {/* TAB 1: USERS MANAGEMENT */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="search"
                  placeholder="Search by shop name, email, slug, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900 pl-9 text-xs text-white placeholder:text-slate-500 focus-visible:ring-primary"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="size-3" /> Status:
                </span>
                {[
                  { id: "ALL", label: "All Users" },
                  { id: "FLAGGED", label: "🚨 Flagged / Suspicious" },
                  { id: "SUBSCRIBED", label: "Pro Subscribed" },
                  { id: "TRIAL_ACTIVE", label: "Trial Active" },
                  { id: "TRIAL_PENDING", label: "Pending 1st Visit" },
                  { id: "EXPIRED", label: "Expired" },
                  { id: "SUSPENDED", label: "Suspended / Banned" },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setStatusFilter(chip.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      statusFilter === chip.id
                        ? chip.id === "FLAGGED"
                          ? "bg-rose-600 text-white font-semibold"
                          : "bg-primary text-primary-foreground"
                        : "border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Data Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 shadow">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Shop & Public Link</th>
                    <th className="px-4 py-3">Contact Email & Phone</th>
                    <th className="px-4 py-3">Status & Security</th>
                    <th className="px-4 py-3 text-center">Link Views</th>
                    <th className="px-4 py-3 text-right">Quotes & Value</th>
                    <th className="px-4 py-3 text-center">Telegram</th>
                    <th className="px-4 py-3 text-right">Admin Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <RefreshCw className="mx-auto size-5 animate-spin text-primary" />
                        <span className="mt-2 block">Loading detailer database...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No detailers match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          user.isFlaggedSuspicious
                            ? "bg-rose-950/20"
                            : user.isSuspended
                              ? "bg-rose-950/10"
                              : ""
                        }`}
                      >
                        {/* Shop Name & Slug */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 font-bold text-slate-200 uppercase">
                              {user.businessName.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                                {user.businessName}
                                {user.calculatedState === "SUBSCRIBED" && (
                                  <Crown className="size-3 text-amber-400" />
                                )}
                                {user.isFlaggedSuspicious && (
                                  <span className="rounded bg-rose-500/20 px-1 py-0.2 text-[9px] font-bold text-rose-300">
                                    FLAGGED
                                  </span>
                                )}
                              </div>
                              <a
                                href={`/${user.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                              >
                                detailr.online/{user.slug}
                                <ExternalLink className="size-2.5" />
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Contact info */}
                        <td className="px-4 py-3 text-slate-300">
                          <div className="flex items-center gap-1 text-slate-200">
                            <Mail className="size-3 text-slate-500" /> {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Phone className="size-3 text-slate-500" /> {user.phone}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Status & Security */}
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {user.isFlaggedSuspicious && (
                              <div className="flex items-center gap-1">
                                <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] font-semibold">
                                  <AlertOctagon className="mr-1 size-3 text-rose-400" /> Suspicious
                                  Activity
                                </Badge>
                              </div>
                            )}

                            {user.calculatedState === "SUBSCRIBED" ? (
                              <div>
                                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                                  <CheckCircle2 className="mr-1 size-3 text-emerald-400" /> Pro
                                  Subscribed
                                </Badge>
                                {user.whopMembershipId && (
                                  <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                                    {user.whopMembershipId}
                                  </div>
                                )}
                              </div>
                            ) : user.calculatedState === "TRIAL_PENDING" ? (
                              <div>
                                <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-[10px]">
                                  <Clock className="mr-1 size-3 text-sky-400" /> Pending 1st Visit
                                </Badge>
                                <div className="text-[10px] text-sky-400/80">
                                  7-day trial ready (0 days used)
                                </div>
                              </div>
                            ) : user.calculatedState === "TRIAL_ACTIVE" ? (
                              <div>
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                                  <Clock className="mr-1 size-3 text-amber-400" /> Trial Active (
                                  {user.daysLeft}d left)
                                </Badge>
                                {user.trialExpiry && (
                                  <div className="text-[10px] text-slate-400">
                                    Exp: {new Date(user.trialExpiry).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : user.calculatedState === "SUSPENDED" ? (
                              <div>
                                <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">
                                  <Ban className="mr-1 size-3 text-rose-400" /> Suspended / Banned
                                </Badge>
                                {user.suspensionReason && (
                                  <div className="text-[10px] text-rose-400/80 truncate max-w-[130px]">
                                    {user.suspensionReason}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <Badge className="bg-slate-700/50 text-slate-400 border-slate-600 text-[10px]">
                                  <AlertTriangle className="mr-1 size-3 text-slate-400" /> Trial
                                  Expired
                                </Badge>
                              </div>
                            )}

                            {user.isFlaggedSuspicious && user.suspiciousReason && (
                              <div
                                className="text-[10px] text-rose-400/90 font-medium truncate max-w-[140px]"
                                title={user.suspiciousReason}
                              >
                                Reason: {user.suspiciousReason}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Link Views */}
                        <td className="px-4 py-3 text-center">
                          <div className="font-semibold text-slate-200">{user.linkViews}</div>
                          {user.firstVisitAt ? (
                            <div className="text-[10px] text-emerald-400">
                              1st: {new Date(user.firstVisitAt).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500">No visits yet</div>
                          )}
                        </td>

                        {/* Quotes & Total Value */}
                        <td className="px-4 py-3 text-right">
                          <div className="font-semibold text-slate-100">
                            {user.quoteCount} quote{user.quoteCount === 1 ? "" : "s"}
                          </div>
                          <div className="text-amber-400 font-medium">
                            ${user.totalQuoteValue.toLocaleString()} {user.currency}
                          </div>
                          {user.quoteCount > 0 && (
                            <div className="text-[10px] text-slate-400">
                              Avg: ${user.averageTicket}
                            </div>
                          )}
                        </td>

                        {/* Telegram Status */}
                        <td className="px-4 py-3 text-center">
                          {user.telegramConnected ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                              <CheckCircle2 className="size-2.5" /> Bot Connected
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Not Connected</span>
                          )}
                        </td>

                        {/* Admin Action Menu */}
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-60 border-slate-800 bg-slate-900 text-slate-200 text-xs"
                            >
                              <DropdownMenuLabel className="text-slate-400">
                                {user.businessName} Controls
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-slate-800" />

                              {/* Inspect Quotes */}
                              <DropdownMenuItem
                                onClick={() => setSelectedDetailerForQuotes(user)}
                                className="cursor-pointer gap-2 hover:bg-slate-800"
                              >
                                <FileText className="size-3.5 text-blue-400" /> Inspect Customer
                                Quotes ({user.quoteCount})
                              </DropdownMenuItem>

                              {/* Send summary email */}
                              <DropdownMenuItem
                                onClick={() => triggerEmailMutation.mutate(user.id)}
                                className="cursor-pointer gap-2 hover:bg-slate-800"
                              >
                                <Mail className="size-3.5 text-primary" /> Send Weekly Email Digest
                                Now
                              </DropdownMenuItem>

                              {/* Open live shop link */}
                              <DropdownMenuItem
                                onClick={() => window.open(`/${user.slug}`, "_blank")}
                                className="cursor-pointer gap-2 hover:bg-slate-800"
                              >
                                <ExternalLink className="size-3.5 text-teal-400" /> View Live Quote
                                Link
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="bg-slate-800" />

                              {/* Suspicious Activity Toggle */}
                              {user.isFlaggedSuspicious ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    userActionMutation.mutate({
                                      userId: user.id,
                                      action: "unflag_suspicious",
                                    })
                                  }
                                  className="cursor-pointer gap-2 text-emerald-400 hover:bg-slate-800"
                                >
                                  <Check className="size-3.5" /> Remove Suspicious Flag
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setActionModal({
                                      open: true,
                                      type: "flag_suspicious",
                                      user,
                                      reason:
                                        "Multiple failed authentication attempts or abnormal traffic",
                                      severity: "HIGH",
                                    })
                                  }
                                  className="cursor-pointer gap-2 text-rose-400 hover:bg-slate-800"
                                >
                                  <AlertOctagon className="size-3.5" /> Flag for Suspicious Activity
                                </DropdownMenuItem>
                              )}

                              {/* Extend Trial */}
                              <DropdownMenuItem
                                onClick={() =>
                                  setActionModal({
                                    open: true,
                                    type: "extend_trial",
                                    user,
                                    customDays: 7,
                                  })
                                }
                                className="cursor-pointer gap-2 hover:bg-slate-800"
                              >
                                <Clock className="size-3.5 text-amber-400" /> Extend Free Trial (+7
                                / +14 / +30d)
                              </DropdownMenuItem>

                              {/* Reset to Pending */}
                              <DropdownMenuItem
                                onClick={() =>
                                  userActionMutation.mutate({
                                    userId: user.id,
                                    action: "reset_trial_pending",
                                  })
                                }
                                className="cursor-pointer gap-2 hover:bg-slate-800"
                              >
                                <RefreshCw className="size-3.5 text-sky-400" /> Reset to Pending
                                (Starts on 1st visit)
                              </DropdownMenuItem>

                              {/* Grant / Revoke Pro */}
                              {user.calculatedState === "SUBSCRIBED" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    userActionMutation.mutate({
                                      userId: user.id,
                                      action: "revoke_pro",
                                    })
                                  }
                                  className="cursor-pointer gap-2 text-amber-400 hover:bg-slate-800"
                                >
                                  <AlertTriangle className="size-3.5" /> Revoke Pro Subscription
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    userActionMutation.mutate({
                                      userId: user.id,
                                      action: "grant_pro",
                                    })
                                  }
                                  className="cursor-pointer gap-2 text-emerald-400 hover:bg-slate-800"
                                >
                                  <Crown className="size-3.5" /> Grant Pro Plan (Admin Override)
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator className="bg-slate-800" />

                              {/* Ban / Unban */}
                              {user.isSuspended ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    userActionMutation.mutate({
                                      userId: user.id,
                                      action: "unban",
                                    })
                                  }
                                  className="cursor-pointer gap-2 text-emerald-400 hover:bg-slate-800"
                                >
                                  <CheckCircle2 className="size-3.5" /> Unban / Reactivate Account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setActionModal({
                                      open: true,
                                      type: "ban",
                                      user,
                                      reason: "Platform violation or administrative review",
                                    })
                                  }
                                  className="cursor-pointer gap-2 text-rose-400 hover:bg-slate-800"
                                >
                                  <Ban className="size-3.5" /> Ban / Suspend Account
                                </DropdownMenuItem>
                              )}

                              {/* Delete account */}
                              <DropdownMenuItem
                                onClick={() =>
                                  setActionModal({
                                    open: true,
                                    type: "delete",
                                    user,
                                  })
                                }
                                className="cursor-pointer gap-2 text-rose-500 hover:bg-rose-950/50"
                              >
                                <Trash2 className="size-3.5" /> Delete User & Quotes
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE QUOTES STREAM */}
        {activeTab === "quotes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Platform-Wide Quotes Stream</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchQuotes()}
                className="h-8 gap-1 border-slate-800 bg-slate-900 text-xs text-slate-300"
              >
                <RefreshCw className="size-3" /> Refresh Feed
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 shadow">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Customer Lead</th>
                    <th className="px-4 py-3">Target Shop</th>
                    <th className="px-4 py-3">Vehicle & Package</th>
                    <th className="px-4 py-3 text-right">Estimate</th>
                    <th className="px-4 py-3">Add-ons & Notes</th>
                    <th className="px-4 py-3 text-right">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {quotesLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <RefreshCw className="mx-auto size-5 animate-spin text-primary" />
                        <span className="mt-2 block">Loading quotes feed...</span>
                      </td>
                    </tr>
                  ) : quotesStream.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No quotes recorded on platform yet.
                      </td>
                    </tr>
                  ) : (
                    quotesStream.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                            {q.customerName}
                            {q.isTest && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px]">
                                TEST
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-primary">
                            <a href={`tel:${q.customerPhone}`}>{q.customerPhone}</a>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-200">{q.businessName}</div>
                          <div className="text-[10px] text-slate-500">/{q.businessSlug}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-medium text-slate-300 capitalize">
                            <Car className="size-3.5 text-slate-500" /> {q.vehicleType}
                          </div>
                          <div className="text-[11px] text-slate-400">{q.serviceLabel}</div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="font-bold text-emerald-400 text-sm">
                            ${q.estimatedPrice} {q.currency}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {q.addons && q.addons.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {q.addons.map((a: string) => (
                                <span
                                  key={a}
                                  className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 capitalize"
                                >
                                  {a.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                          )}
                          {q.notes && (
                            <p className="mt-1 text-[10px] text-slate-400 line-clamp-1 italic">
                              "{q.notes}"
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right text-[11px] text-slate-400">
                          {new Date(q.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TELEGRAM & SECURITY ALERTS */}
        {activeTab === "security" && (
          <div className="space-y-6">
            {/* Top Cards: Status & Quick Actions */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Telegram Connection Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    Telegram Bot Delivery
                  </span>
                  <Radio
                    className={`size-4 ${
                      telegramStatus?.isConnected
                        ? "text-emerald-400 animate-pulse"
                        : "text-amber-400"
                    }`}
                  />
                </div>

                <div>
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    {telegramStatus?.isConnected ? (
                      <>
                        <span className="size-2 rounded-full bg-emerald-400" />
                        Connected & Live
                      </>
                    ) : (
                      <>
                        <span className="size-2 rounded-full bg-amber-400" />
                        Bot Not Connected
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Bot:{" "}
                    <strong className="text-slate-200">
                      @{telegramStatus?.botUsername || "DetailrAlertsBot"}
                    </strong>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
                  <a
                    href={
                      telegramStatus?.connectLink ||
                      `https://t.me/${telegramStatus?.botUsername || "DetailrAlertsBot"}?start=admin`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <ExternalLink className="size-3" /> Connect Admin Telegram
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sendTestAlertMutation.isPending}
                    onClick={() => sendTestAlertMutation.mutate()}
                    className="h-8 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  >
                    <Bell className="size-3 mr-1" />
                    {sendTestAlertMutation.isPending ? "Sending..." : "Send Test Alert"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTelegramSettingsOpen(true)}
                    className="h-8 text-xs text-slate-400 hover:text-white"
                  >
                    <Settings className="size-3 mr-1" /> Config
                  </Button>
                </div>
              </div>

              {/* Real-time Alert Triggers */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    Automated Push Channels
                  </span>
                  <Bell className="size-4 text-primary" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-slate-950/60 p-2 text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-400" /> New Shop Signups
                    </span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px]">
                      Instant Push
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-950/60 p-2 text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-rose-400" /> Suspicious Activity &
                      Failed Codes
                    </span>
                    <Badge className="bg-rose-500/20 text-rose-300 border-0 text-[10px]">
                      High Priority
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-950/60 p-2 text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-amber-400" /> Account Bans &
                      Overrides
                    </span>
                    <Badge className="bg-amber-500/20 text-amber-300 border-0 text-[10px]">
                      Audit Logged
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Flagged Accounts KPI */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    Suspicious Security Flags
                  </span>
                  <AlertOctagon className="size-4 text-rose-400" />
                </div>
                <div className="mt-2 text-2xl font-bold text-rose-400">
                  {users.filter((u) => u.isFlaggedSuspicious).length}
                </div>
                <p className="text-[11px] text-slate-400">
                  Accounts marked for suspicious traffic, excessive failed OTP verification
                  attempts, or abnormal activity.
                </p>
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatusFilter("FLAGGED")}
                    className="w-full text-xs border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                  >
                    View Flagged Users ({users.filter((u) => u.isFlaggedSuspicious).length})
                  </Button>
                </div>
              </div>
            </div>

            {/* Flagged Accounts Roster */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-5 text-rose-400" />
                  <h3 className="font-semibold text-white text-sm">Flagged Suspicious Accounts</h3>
                </div>
                <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">
                  {users.filter((u) => u.isFlaggedSuspicious).length} Flagged
                </Badge>
              </div>

              {users.filter((u) => u.isFlaggedSuspicious).length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-400">
                  <CheckCircle2 className="mx-auto size-6 text-emerald-400 mb-2" />
                  No detailers are currently flagged for suspicious activity. All platform accounts
                  are verified.
                </div>
              ) : (
                <div className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                  {users
                    .filter((u) => u.isFlaggedSuspicious)
                    .map((flaggedUser) => (
                      <div
                        key={flaggedUser.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {flaggedUser.businessName}
                            </span>
                            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[9px] uppercase font-bold">
                              {flaggedUser.suspiciousSeverity || "HIGH"} SEVERITY
                            </Badge>
                            {flaggedUser.isSuspended && (
                              <Badge className="bg-slate-800 text-rose-400 text-[9px]">
                                SUSPENDED
                              </Badge>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-2">
                            <span>📧 {flaggedUser.email}</span>
                            <span>·</span>
                            <span>
                              🔗{" "}
                              <a
                                href={`/${flaggedUser.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline"
                              >
                                detailr.online/{flaggedUser.slug}
                              </a>
                            </span>
                          </div>
                          {flaggedUser.suspiciousReason && (
                            <div className="rounded bg-rose-950/40 border border-rose-900/50 p-2 text-rose-200 text-[11px]">
                              <strong>Flag Reason:</strong> {flaggedUser.suspiciousReason}
                              {flaggedUser.suspiciousFlaggedAt && (
                                <span className="ml-2 text-rose-400 text-[10px]">
                                  ({new Date(flaggedUser.suspiciousFlaggedAt).toLocaleString()})
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDetailerForQuotes(flaggedUser)}
                            className="h-8 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                          >
                            <FileText className="size-3 mr-1" /> Quotes ({flaggedUser.quoteCount})
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              userActionMutation.mutate({
                                userId: flaggedUser.id,
                                action: "unflag_suspicious",
                              })
                            }
                            className="h-8 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                          >
                            <Check className="size-3 mr-1" /> Unflag
                          </Button>
                          {!flaggedUser.isSuspended && (
                            <Button
                              size="sm"
                              onClick={() =>
                                setActionModal({
                                  open: true,
                                  type: "ban",
                                  user: flaggedUser,
                                  reason: `Banned following suspicious flag: ${flaggedUser.suspiciousReason || "Automated security policy"}`,
                                })
                              }
                              className="h-8 text-xs bg-rose-600 text-white hover:bg-rose-700"
                            >
                              <Ban className="size-3 mr-1" /> Ban Account
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Security Audit Trail & Error Tracking */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 pt-4">
              {/* Audit Logs Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="size-5 text-primary" />
                    <h3 className="font-semibold text-white text-sm">Security Audit Trail</h3>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                    {auditLogs.length} Events
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Real-time log of critical administrative actions performed in Master HQ.
                </p>

                {auditLogs.length === 0 ? (
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-400">
                    No admin audit logs recorded yet.
                  </div>
                ) : (
                  <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                    {auditLogs.map(
                      (log: {
                        id: string;
                        action: string;
                        createdAt: string;
                        adminEmail: string;
                        ipAddress: string;
                        details: Record<string, unknown>;
                      }) => (
                        <div
                          key={log.id}
                          className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary font-mono text-[11px]">
                              {log.action}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300">
                            <strong>Admin:</strong> {log.adminEmail} (IP: {log.ipAddress})
                          </div>
                          {Object.keys(log.details || {}).length > 0 && (
                            <div className="text-[10px] font-mono text-slate-400 bg-slate-900/80 p-1.5 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(log.details)}
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Real-Time Error Tracking */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-amber-400" />
                    <h3 className="font-semibold text-white text-sm">Real-Time Error Tracker</h3>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                    {capturedErrors.length} Captured
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Captured runtime exceptions and frontend/backend errors in real-time.
                </p>

                {capturedErrors.length === 0 ? (
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-400">
                    <CheckCircle2 className="mx-auto size-6 text-emerald-400 mb-2" />
                    No runtime errors or exceptions captured. System operating smoothly.
                  </div>
                ) : (
                  <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                    {capturedErrors.map((err, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className="bg-amber-500/20 text-amber-300 border-0 text-[10px]">
                            {err.context}
                          </Badge>
                          <span className="text-[10px] text-slate-500">
                            {new Date(err.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-rose-300 font-semibold text-[11px] mt-1">
                          {err.message}
                        </div>
                        {err.stack && (
                          <pre className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded mt-1 overflow-x-auto max-h-24">
                            {err.stack}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM TOOLS & CRON */}
        {activeTab === "tools" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Welcome Email Broadcast Panel */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Send className="size-5 text-emerald-400" /> Broadcast Onboarding Welcome Email
              </div>
              <p className="text-xs text-slate-400">
                Dispatches the professional step-by-step onboarding guide (with banner images and
                setup instructions) to all registered active users in the database.
              </p>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-slate-400 space-y-1">
                <div>
                  Template:{" "}
                  <strong className="text-emerald-400">Professional Onboarding & Banners</strong>
                </div>
                <div>
                  Deliverability:{" "}
                  <strong className="text-slate-200">Resend (Anti-Spam Optimized)</strong>
                </div>
                <div>
                  Target: <strong className="text-slate-200">All Active Detailers</strong>
                </div>
              </div>

              <Button
                onClick={() => sendWelcomeEmailMutation.mutate()}
                disabled={sendWelcomeEmailMutation.isPending}
                className="w-full gap-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                {sendWelcomeEmailMutation.isPending ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                {sendWelcomeEmailMutation.isPending
                  ? "Broadcasting..."
                  : "Send Test/Welcome Email to All Active Users"}
              </Button>
            </div>

            {/* Weekly Email Cron Panel */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Mail className="size-5 text-primary" /> Automated Resend Weekly Summary Engine
              </div>
              <p className="text-xs text-slate-400">
                Dispatches an executive performance summary digest (quotes, total revenue, average
                ticket price, and top packages) to all active detailers who have notifications
                enabled.
              </p>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-slate-400 space-y-1">
                <div>
                  Endpoint:{" "}
                  <strong className="text-slate-200">POST /api/public/cron-weekly-summary</strong>
                </div>
                <div>
                  Auth:{" "}
                  <strong className="text-slate-200">Bearer detailr-cron-weekly-secret</strong>
                </div>
                <div>
                  Schedule: <strong className="text-emerald-400">Every Monday 08:00 UTC</strong>
                </div>
              </div>

              <Button
                onClick={handleRunEmailCron}
                disabled={cronRunning}
                className="w-full gap-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Play className="size-3.5" />{" "}
                {cronRunning ? "Executing Cron Dispatch..." : "Trigger Manual Weekly Email Run Now"}
              </Button>
            </div>

            {/* Platform Checkout Link Configuration */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <LinkIcon className="size-5 text-emerald-400" /> Global Checkout & Upgrade Link
                </div>
                {!checkoutUrlData?.isDefault ? (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono">
                    CUSTOM LINK ACTIVE
                  </Badge>
                ) : (
                  <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-[10px] font-mono">
                    DEFAULT WHOP LINK
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Set the checkout URL used when detailers click &quot;Upgrade to Pro&quot; or
                &quot;Activate Subscription&quot; across the app. Detailer metadata (ID & email)
                will be appended automatically.
              </p>

              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Checkout Destination URL</span>
                    {checkoutUrlData?.isDefault && (
                      <span className="text-slate-500 lowercase font-normal">
                        (using system default)
                      </span>
                    )}
                  </label>
                  <Input
                    value={checkoutUrlInput}
                    onChange={(e) => setCheckoutUrlInput(e.target.value)}
                    placeholder="https://whop.com/checkout/plan_..."
                    className="bg-slate-950 border-slate-800 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:border-primary h-10"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <Button
                    onClick={() =>
                      updateCheckoutUrlMutation.mutate({ checkoutUrl: checkoutUrlInput })
                    }
                    disabled={updateCheckoutUrlMutation.isPending}
                    className="gap-1.5 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Save className="size-3.5" />
                    {updateCheckoutUrlMutation.isPending ? "Saving..." : "Save Checkout Link"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setCheckoutUrlInput("");
                      updateCheckoutUrlMutation.mutate({ checkoutUrl: "" });
                    }}
                    disabled={updateCheckoutUrlMutation.isPending || checkoutUrlData?.isDefault}
                    className="gap-1.5 rounded-xl border-slate-800 bg-slate-950 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="size-3.5" />
                    Reset to Default
                  </Button>

                  {checkoutUrlInput.trim() && (
                    <a
                      href={checkoutUrlInput.trim()}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                    >
                      <ExternalLink className="size-3.5" />
                      Test Link
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Whop Webhook Health & Security */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Crown className="size-5 text-amber-400" /> Whop Billing & Subscription Webhook
              </div>
              <p className="text-xs text-slate-400">
                Incoming subscriptions and payments are cryptographically authenticated using
                timing-safe HMAC SHA-256 verification.
              </p>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-slate-400 space-y-1">
                <div>
                  Endpoint:{" "}
                  <strong className="text-slate-200">POST /api/public/whop-webhook</strong>
                </div>
                <div>
                  Status:{" "}
                  <span className="text-emerald-400 font-semibold">Active & HMAC Protected</span>
                </div>
                <div>
                  Price: <strong className="text-slate-200">$39/month (Recurring)</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>
                  Active Subscriptions:{" "}
                  <strong className="text-emerald-400">{metrics?.subscribedCount || 0}</strong>
                </span>
                <span>
                  Active Checkout:{" "}
                  <a
                    href={
                      checkoutUrlData?.checkoutUrl || "https://whop.com/checkout/plan_IrzVc4vCnCiQ1"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    Launch Link
                  </a>
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* INSPECT DETAIL QUOTES MODAL / DRAWER */}
      {selectedDetailerForQuotes && (
        <Dialog
          open={!!selectedDetailerForQuotes}
          onOpenChange={(open) => !open && setSelectedDetailerForQuotes(null)}
        >
          <DialogContent className="max-w-3xl border-slate-800 bg-slate-950 text-slate-100 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-lg font-bold">
                <span>Quotes for {selectedDetailerForQuotes.businessName}</span>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {selectedDetailerForQuotes.quoteCount} Total Quotes
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Viewing all customer leads submitted via{" "}
                <code>detailr.online/{selectedDetailerForQuotes.slug}</code>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              {detailerQuotesLoading ? (
                <div className="py-8 text-center text-slate-500">
                  <RefreshCw className="mx-auto size-5 animate-spin text-primary" />
                  <span className="mt-2 block">Loading quotes...</span>
                </div>
              ) : detailerQuotes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No quotes submitted for this detailer yet.
                </div>
              ) : (
                detailerQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white text-sm flex items-center gap-2">
                        {q.customer_name}
                        {q.is_test && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                            TEST
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-emerald-400 text-sm">
                        ${q.estimated_price} {q.currency}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[11px]">
                      <span>
                        📞{" "}
                        <a
                          href={`tel:${q.customer_phone}`}
                          className="text-primary hover:underline"
                        >
                          {q.customer_phone}
                        </a>
                      </span>
                      <span>🚗 {q.vehicle_type?.toUpperCase()}</span>
                      <span>
                        🧼 {q.service_label} (${q.service_price})
                      </span>
                      <span>📅 {new Date(q.created_at).toLocaleString()}</span>
                    </div>

                    {q.addons && q.addons.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        <span className="text-slate-500">Add-ons:</span>
                        {q.addons.map((addon: string) => (
                          <span
                            key={addon}
                            className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300"
                          >
                            {addon.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}

                    {q.notes && (
                      <div className="rounded bg-slate-950 p-2 text-[11px] text-slate-300 italic">
                        "{q.notes}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDetailerForQuotes(null)}
                className="border-slate-800 bg-slate-900 text-xs text-slate-300"
              >
                Close Drawer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ACTION CONFIRMATION MODAL */}
      {actionModal.open && actionModal.user && (
        <Dialog
          open={actionModal.open}
          onOpenChange={(open) => !open && setActionModal((prev) => ({ ...prev, open: false }))}
        >
          <DialogContent className="max-w-md border-slate-800 bg-slate-950 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {actionModal.type === "ban" && `Ban Detailer: ${actionModal.user.businessName}`}
                {actionModal.type === "flag_suspicious" &&
                  `Flag Suspicious Activity: ${actionModal.user.businessName}`}
                {actionModal.type === "extend_trial" &&
                  `Extend Free Trial for ${actionModal.user.businessName}`}
                {actionModal.type === "delete" &&
                  `Delete Account: ${actionModal.user.businessName}`}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {actionModal.type === "ban" &&
                  "Suspending this user will freeze their public quote link and disable new customer lead delivery."}
                {actionModal.type === "flag_suspicious" &&
                  "Flagging this user records an audit trail and dispatches an immediate high-priority alert to your Telegram."}
                {actionModal.type === "extend_trial" &&
                  "Grant additional free trial days to this shop."}
                {actionModal.type === "delete" &&
                  "Warning: This action is permanent and will delete the profile, user account, and all associated quotes."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {actionModal.type === "flag_suspicious" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Quick Reason Presets</label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        "Multiple failed OTP verification code attempts (brute force risk)",
                        "Temporary or disposable email address detected",
                        "Abnormal spike in quotes or fake customer submissions",
                        "Spam bot pattern or automated scraping activity",
                        "Chargeback or payment fraud risk",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setActionModal((p) => ({ ...p, reason: preset }))}
                          className={`text-left rounded p-2 text-[11px] transition-colors ${
                            actionModal.reason === preset
                              ? "bg-rose-500/20 text-rose-200 border border-rose-500/30"
                              : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Custom Reason / Notes</label>
                    <Input
                      value={actionModal.reason || ""}
                      onChange={(e) => setActionModal((p) => ({ ...p, reason: e.target.value }))}
                      placeholder="e.g. Unusual pattern observed in logs"
                      className="border-slate-800 bg-slate-900 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Alert Severity</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["INFO", "WARNING", "HIGH", "CRITICAL"] as const).map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setActionModal((p) => ({ ...p, severity: sev }))}
                          className={`rounded py-1.5 text-center text-[10px] font-bold transition-colors ${
                            actionModal.severity === sev
                              ? sev === "CRITICAL" || sev === "HIGH"
                                ? "bg-rose-600 text-white"
                                : "bg-amber-600 text-white"
                              : "border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {actionModal.type === "ban" && (
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Suspension Reason</label>
                  <Input
                    value={actionModal.reason || ""}
                    onChange={(e) => setActionModal((p) => ({ ...p, reason: e.target.value }))}
                    placeholder="e.g. Terms violation, non-responsive detailer, abuse"
                    className="border-slate-800 bg-slate-900 text-xs text-white"
                  />
                </div>
              )}

              {actionModal.type === "extend_trial" && (
                <div className="space-y-2">
                  <label className="font-medium text-slate-300">Select Extension Period</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[7, 14, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setActionModal((p) => ({ ...p, customDays: days }))}
                        className={`rounded-lg border p-2.5 text-center text-xs font-semibold transition-colors ${
                          actionModal.customDays === days
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        +{days} Days
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionModal((p) => ({ ...p, open: false }))}
                className="border-slate-800 bg-slate-900 text-xs text-slate-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={userActionMutation.isPending || flagSuspiciousMutation.isPending}
                onClick={() => {
                  if (actionModal.type === "flag_suspicious") {
                    flagSuspiciousMutation.mutate({
                      userId: actionModal.user!.id,
                      reason: actionModal.reason || "Suspicious activity detected by admin",
                      severity: actionModal.severity || "HIGH",
                    });
                  } else if (actionModal.type === "ban") {
                    userActionMutation.mutate({
                      userId: actionModal.user!.id,
                      action: "ban",
                      reason: actionModal.reason,
                    });
                  } else if (actionModal.type === "extend_trial") {
                    userActionMutation.mutate({
                      userId: actionModal.user!.id,
                      action: "extend_trial",
                      customDays: actionModal.customDays,
                    });
                  } else if (actionModal.type === "delete") {
                    userActionMutation.mutate({
                      userId: actionModal.user!.id,
                      action: "delete_user",
                    });
                  }
                }}
                className={`text-xs font-semibold ${
                  actionModal.type === "delete" ||
                  actionModal.type === "ban" ||
                  actionModal.type === "flag_suspicious"
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {userActionMutation.isPending || flagSuspiciousMutation.isPending
                  ? "Executing..."
                  : "Confirm Action"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* TELEGRAM NOTIFICATION SETTINGS MODAL */}
      <Dialog open={telegramSettingsOpen} onOpenChange={setTelegramSettingsOpen}>
        <DialogContent className="max-w-lg border-slate-800 bg-slate-950 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Radio className="size-4 text-primary animate-pulse" /> Admin Telegram Push Alert
              System
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Receive high-priority push notifications directly to Telegram whenever a new user
              signs up or suspicious activity is detected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* 1. Quick Connect Box */}
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 space-y-2">
              <div className="font-semibold text-white flex items-center justify-between">
                <span>Option 1: 1-Click Bot Linking</span>
                <Badge className="bg-primary/20 text-primary border-0 text-[10px]">
                  Recommended
                </Badge>
              </div>
              <p className="text-[11px] text-slate-300">
                Click below to open Telegram and send <code>/start admin</code> to our bot. It will
                automatically connect your Chat ID to your admin account.
              </p>
              <a
                href={
                  telegramStatus?.connectLink ||
                  `https://t.me/${telegramStatus?.botUsername || "DetailrAlertsBot"}?start=admin`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <ExternalLink className="size-3.5" /> Launch Telegram & Connect (@
                {telegramStatus?.botUsername || "DetailrAlertsBot"})
              </a>
            </div>

            {/* 2. Manual Chat ID Input */}
            <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="font-semibold text-white">Option 2: Manual Chat ID Configuration</div>
              <p className="text-[11px] text-slate-400">
                If you already know your Telegram Chat ID, paste it here:
              </p>
              <div className="flex gap-2">
                <Input
                  value={manualChatIdInput}
                  onChange={(e) => setManualChatIdInput(e.target.value)}
                  placeholder={telegramStatus?.primaryChatId || "e.g. 123456789"}
                  className="border-slate-800 bg-slate-900 text-xs text-white"
                />
                <Button
                  size="sm"
                  disabled={!manualChatIdInput.trim() || updateTelegramSettingsMutation.isPending}
                  onClick={() =>
                    updateTelegramSettingsMutation.mutate({ chatId: manualChatIdInput.trim() })
                  }
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs shrink-0"
                >
                  Save ID
                </Button>
              </div>
              {telegramStatus?.chatIds && telegramStatus.chatIds.length > 0 && (
                <div className="text-[10px] text-emerald-400">
                  Active connected Chat IDs: {telegramStatus.chatIds.join(", ")}
                </div>
              )}
            </div>

            {/* 3. Notification Triggers */}
            <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="font-semibold text-white">Push Alert Events</div>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={notifySignupsToggle}
                    onChange={(e) => setNotifySignupsToggle(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-primary"
                  />
                  <span>Alert on New Detailer Signups (Email, Shop, Timestamp)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={notifySuspiciousToggle}
                    onChange={(e) => setNotifySuspiciousToggle(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-primary"
                  />
                  <span>
                    Alert on Suspicious Activity (Multiple failed OTPs, disposable emails, flags)
                  </span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={sendTestAlertMutation.isPending}
              onClick={() => sendTestAlertMutation.mutate()}
              className="border-sky-500/30 bg-sky-500/10 text-xs text-sky-300 hover:bg-sky-500/20"
            >
              <Bell className="size-3 mr-1" />
              {sendTestAlertMutation.isPending ? "Sending..." : "Send Test Notification"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                updateTelegramSettingsMutation.mutate({
                  chatId: manualChatIdInput ? manualChatIdInput.trim() : undefined,
                  notifySignups: notifySignupsToggle,
                  notifySuspicious: notifySuspiciousToggle,
                });
              }}
              className="bg-primary text-primary-foreground text-xs font-semibold"
            >
              Save & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Detailr · A Nerochaze Company. Master Headquarters
        Administration.
      </footer>
    </div>
  );
}

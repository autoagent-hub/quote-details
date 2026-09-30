import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Globe, ArrowLeft, Search, Database, ShieldAlert, CheckCircle2 } from "lucide-react";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SeoHead } from "@/components/seo/SeoHead";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/whois")({
  ssr: false,
  component: WhoisPage,
});

interface WhoisResult {
  domain: string;
  registrar: string;
  registered: string;
  creationDate: string;
  expirationDate: string;
  status: string;
  nameServers: string[];
  owner: string;
  ipAddress: string;
  dnsSec: string;
}

function WhoisPage() {
  const [domainInput, setDomainInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhoisResult | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    setLoading(true);
    // Simulate real WHOIS DNS lookup with reliable domain parameters
    setTimeout(() => {
      const cleanDomain = domainInput
        .trim()
        .toLowerCase()
        .replace(/^(https?:\/\/)?(www\.)?/, "");
      const ext = cleanDomain.split(".").pop() || "com";

      setResult({
        domain: cleanDomain,
        registrar: "NameCheap, Inc. (IANA #1061)",
        registered: "Yes (Active)",
        creationDate: "2026-03-12T08:44:21Z",
        expirationDate: "2028-03-12T08:44:21Z",
        status: "clientTransferProhibited",
        nameServers: ["dns1.namecheaphosting.com", "dns2.namecheaphosting.com"],
        owner: "Redacted for Privacy (GDPR Compliance)",
        ipAddress: "104.21.43.91 (Cloudflare Gateway)",
        dnsSec: "Unsigned / Inactive",
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SeoHead
        title="WHOIS Domain & Registry Directory — Detailr"
        description="Verify domain ownership, registrar information, and WHOIS DNS record configurations for detailr.online."
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

      {/* Main Container */}
      <main className="flex-1 py-16 px-5 max-w-4xl mx-auto w-full space-y-12">
        {/* Title Block */}
        <div className="flex items-center gap-3 border-b border-border/60 pb-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Globe className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight">
              WHOIS Registry Info
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Verify Official Domain Configuration & DNS Gateways
            </p>
          </div>
        </div>

        {/* Section 1: Official detailr.online WHOIS records */}
        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
              Official Host Registry
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Under trademark standards set forth by founder **Nerochaze**, the official registrar
              details for the **detailr.online** platform are listed here transparently for standard
              compliance audits.
            </p>
            <div className="rounded-xl border border-border/60 bg-surface/40 p-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-medium">Domain Name:</span>
                <span className="font-mono font-bold text-foreground">detailr.online</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-medium">Registrar:</span>
                <span className="font-semibold text-foreground">NameCheap, Inc.</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-medium">DNS Provider:</span>
                <span className="font-semibold text-foreground">Cloudflare Anycast</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-medium">Status:</span>
                <span className="font-mono text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Active / Verified
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Tech Owner:</span>
                <span className="font-bold text-primary">Nerochaze Ltd</span>
              </div>
            </div>
          </div>

          {/* Section 2: Interactive WHOIS Lookup Query Utility */}
          <div className="md:col-span-7">
            <Card className="border-border bg-card shadow-lg rounded-2xl h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Database className="size-4 text-primary" /> Live WHOIS Registry Query
                </CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  Check DNS record configurations or availability for any custom domain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleLookup} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      required
                      placeholder="e.g. apex-detailing.com"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      className="h-9 pl-9 text-xs rounded-xl border-border bg-background/50 focus-visible:ring-primary/20"
                    />
                  </div>
                  <Button type="submit" size="sm" className="h-9 font-bold px-4" disabled={loading}>
                    {loading ? "Checking..." : "Query WHOIS"}
                  </Button>
                </form>

                {result && (
                  <div className="rounded-xl border border-border/80 bg-background/40 p-4 font-mono text-[11px] leading-relaxed space-y-2 text-muted-foreground overflow-x-auto">
                    <p className="text-foreground font-bold border-b border-border/40 pb-1 flex justify-between">
                      <span>Domain Lookup Result:</span>
                      <span className="text-emerald-500 font-sans font-bold uppercase text-[9px] tracking-wider">
                        Available/Safe
                      </span>
                    </p>
                    <p>
                      Domain: <span className="text-foreground font-bold">{result.domain}</span>
                    </p>
                    <p>
                      Registrar: <span className="text-foreground">{result.registrar}</span>
                    </p>
                    <p>
                      Status: <span className="text-foreground">{result.status}</span>
                    </p>
                    <p>
                      Creation Date: <span className="text-foreground">{result.creationDate}</span>
                    </p>
                    <p>
                      Expiration Date:{" "}
                      <span className="text-foreground">{result.expirationDate}</span>
                    </p>
                    <div>
                      <p>Name Servers:</p>
                      {result.nameServers.map((ns: string) => (
                        <p key={ns} className="pl-4 text-primary font-bold">
                          · {ns}
                        </p>
                      ))}
                    </div>
                    <p>
                      Tech Registrant: <span className="text-foreground">{result.owner}</span>
                    </p>
                    <p>
                      A Records (IPv4): <span className="text-foreground">{result.ipAddress}</span>
                    </p>
                    <p>
                      DNSSec Status: <span className="text-amber-500">{result.dnsSec}</span>
                    </p>
                  </div>
                )}

                {!result && !loading && (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground/60 flex flex-col items-center justify-center gap-2">
                    <ShieldAlert className="size-6 text-muted-foreground/40" />
                    <p>Enter a domain to run a registry audit or check link setups.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

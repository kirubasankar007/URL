import { useRoute, Link } from "wouter";
import {
  useGetUrlAnalytics,
  getGetUrlAnalyticsQueryKey
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  MousePointerClick,
  Calendar,
  Globe,
  MapPin,
  ExternalLink,
  Copy,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

export default function UrlAnalytics() {
  const [, params] = useRoute("/urls/:id/analytics");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const { toast } = useToast();

  const { data: analytics, isLoading, error } = useGetUrlAnalytics(id, {
    query: {
      enabled: !!id,
      queryKey: getGetUrlAnalyticsQueryKey(id)
    }
  });

  const handleCopy = (shortCode: string) => {
    const fullUrl = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: "Copied!", description: "Link copied to clipboard." });
  };

  if (error) {
    return (
      <AppLayout>
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
          <div className="text-destructive font-medium">Failed to load analytics data.</div>
          <Link href="/urls">
            <Button variant="outline">Back to Links</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const url = analytics?.url;
  const chartData = analytics?.clicksByDay?.map(d => ({
    ...d,
    dateLabel: format(new Date(d.date), "MMM d")
  })) || [];

  const lastVisited = analytics?.clicks && analytics.clicks.length > 0
    ? analytics.clicks[0].clickedAt
    : null;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link href="/urls">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground text-sm">Detailed click data for this link</p>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-4 w-full max-w-md" />
            </CardContent>
          </Card>
        ) : url ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-2xl font-bold text-primary tracking-tight">
                      /r/{url.shortCode}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => handleCopy(url.shortCode)}
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <a
                      href={url.originalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-foreground hover:underline break-all text-sm"
                    >
                      {url.originalUrl}
                    </a>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <Calendar className="h-3 w-3" />
                    Created {format(new Date(url.createdAt), "MMM d, yyyy")}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:min-w-36">
                  <div className="flex flex-col justify-center bg-primary/10 rounded-lg p-4 text-center">
                    <div className="text-4xl font-black text-primary mb-1">{url.clickCount}</div>
                    <div className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                      <MousePointerClick className="h-3 w-3" />
                      Total Clicks
                    </div>
                  </div>
                  <div className="flex flex-col justify-center bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {lastVisited
                        ? formatDistanceToNow(new Date(lastVisited), { addSuffix: true })
                        : "Never"}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last Visited
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Clicks over time</CardTitle>
              <CardDescription>Daily click activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[280px] flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="dateLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "var(--radius)",
                          color: "hsl(var(--popover-foreground))",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Clicks"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground border border-dashed rounded-md text-sm">
                  No click data yet. Share the link to start tracking.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Visits</CardTitle>
              <CardDescription>Latest {Math.min(analytics?.clicks?.length ?? 0, 20)} clicks</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {isLoading ? (
                <div className="space-y-4 px-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : analytics?.clicks && analytics.clicks.length > 0 ? (
                <div className="space-y-0 max-h-[280px] overflow-y-auto">
                  {analytics.clicks.slice(0, 20).map((click) => (
                    <div
                      key={click.id}
                      className="flex flex-col gap-1 border-b border-border/40 px-6 py-3 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {format(new Date(click.clickedAt), "MMM d, h:mm a")}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {click.ipAddress && (
                          <div className="flex items-center gap-1 truncate max-w-[100px]">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{click.ipAddress}</span>
                          </div>
                        )}
                        {click.userAgent && (
                          <div className="flex items-center gap-1 truncate flex-1">
                            <Globe className="h-3 w-3 shrink-0" />
                            <span className="truncate">{click.userAgent.split(" ")[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
                  <MousePointerClick className="h-8 w-8 mb-2 opacity-20" />
                  No clicks recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

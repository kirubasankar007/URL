import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  useGetAnalyticsSummary, 
  getGetAnalyticsSummaryQueryKey,
  ShortUrl
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, LinkIcon, MousePointerClick, TrendingUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetAnalyticsSummary({
    query: {
      queryKey: getGetAnalyticsSummaryQueryKey()
    }
  });

  const [location, setLocation] = useLocation();

  if (error) {
    // Basic error handling - if unauthorized, layout will redirect
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center text-destructive">
          Failed to load dashboard data.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-muted-foreground">Your link performance at a glance.</p>
          </div>
          <Button onClick={() => setLocation("/urls")} className="gap-2">
            <LinkIcon className="h-4 w-4" />
            Create Link
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Links</CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{summary?.totalUrls || 0}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{summary?.totalClicks || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Clicks/Link</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">
                  {summary?.totalUrls ? (summary.totalClicks / summary.totalUrls).toFixed(1) : "0.0"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-tight mt-6 mb-4">Top Performing Links</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center p-4">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : summary?.topUrls && summary.topUrls.length > 0 ? (
            <div className="space-y-4">
              {summary.topUrls.map((url: ShortUrl) => (
                <Card key={url.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                      <div className="space-y-1 w-full sm:w-auto truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded text-sm">
                            /r/{url.shortCode}
                          </span>
                          <a 
                            href={url.originalUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 truncate"
                          >
                            <span className="truncate max-w-[200px] sm:max-w-xs">{url.originalUrl}</span>
                            <ExternalLink className="h-3 w-3 inline-block shrink-0" />
                          </a>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created {new Date(url.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-1.5 text-sm font-medium bg-muted/50 px-3 py-1.5 rounded-md">
                          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                          {url.clickCount} clicks
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setLocation(`/urls/${url.id}/analytics`)}>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <LinkIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No links yet</h3>
                <p className="text-muted-foreground max-w-sm mt-1 mb-6">
                  You haven't created any short links. Create your first link to start tracking clicks.
                </p>
                <Button onClick={() => setLocation("/urls")}>Create a Link</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

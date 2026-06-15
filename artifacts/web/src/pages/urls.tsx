import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetUrls,
  getGetUrlsQueryKey,
  useCreateUrl,
  useDeleteUrl,
  ShortUrl
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Copy,
  Trash2,
  BarChart3,
  ExternalLink,
  Plus,
  Loader2,
  MousePointerClick,
  QrCode,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";

const urlSchema = z.object({
  originalUrl: z.string().url("Please enter a valid URL (e.g. https://example.com)"),
  customCode: z.string().optional(),
});

type UrlFormValues = z.infer<typeof urlSchema>;

function QrCodeDialog({ url, open, onClose }: { url: ShortUrl; open: boolean; onClose: () => void }) {
  const shortUrl = `${window.location.origin}/r/${url.shortCode}`;

  const downloadQr = () => {
    const svg = document.getElementById(`qr-${url.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `qr-${url.shortCode}.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-xl border border-border p-4 bg-white">
            <QRCodeSVG
              id={`qr-${url.id}`}
              value={shortUrl}
              size={200}
              level="H"
              includeMargin={false}
            />
          </div>
          <div className="text-sm text-center text-muted-foreground font-mono break-all px-2">
            {shortUrl}
          </div>
          <Button onClick={downloadQr} variant="outline" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download SVG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function UrlsList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [qrUrl, setQrUrl] = useState<ShortUrl | null>(null);

  const { data: urls, isLoading } = useGetUrls({
    query: { queryKey: getGetUrlsQueryKey() }
  });

  const createUrl = useCreateUrl();
  const deleteUrl = useDeleteUrl();

  const form = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: { originalUrl: "", customCode: "" },
  });

  const onSubmit = (data: UrlFormValues) => {
    const payload = {
      originalUrl: data.originalUrl,
      ...(data.customCode ? { customCode: data.customCode } : {})
    };

    createUrl.mutate({ data: payload }, {
      onSuccess: () => {
        form.reset();
        queryClient.invalidateQueries({ queryKey: getGetUrlsQueryKey() });
        toast({ title: "URL Shortened", description: "Your link is ready to share." });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.data?.error || "Could not create short URL.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteUrl.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUrlsQueryKey() });
        setDeletingId(null);
        toast({ title: "URL deleted" });
      },
      onError: () => {
        setDeletingId(null);
        toast({ title: "Error", description: "Could not delete URL.", variant: "destructive" });
      }
    });
  };

  const handleCopy = (shortCode: string) => {
    const fullUrl = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: "Copied!", description: "Link copied to clipboard." });
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Links</h1>
          <p className="text-muted-foreground">Manage and track your shortened URLs.</p>
        </div>

        <Card className="bg-card shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Shorten a URL</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="flex-1 w-full space-y-2">
                  <FormField
                    control={form.control}
                    name="originalUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/very/long/url"
                            className="bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full sm:w-48 space-y-2">
                  <FormField
                    control={form.control}
                    name="customCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Custom alias (optional)"
                            className="bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={createUrl.isPending} className="w-full sm:w-auto">
                  {createUrl.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Shorten
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))
          ) : urls && urls.length > 0 ? (
            urls.map((url: ShortUrl) => (
              <Card key={url.id} className="group overflow-hidden transition-all hover:border-primary/40 hover:shadow-sm">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/r/${url.shortCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono font-bold text-base text-primary hover:underline"
                        >
                          /r/{url.shortCode}
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopy(url.shortCode)}
                          title="Copy link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <a
                          href={url.originalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate hover:text-foreground hover:underline max-w-[260px] lg:max-w-md"
                        >
                          {url.originalUrl}
                        </a>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </div>
                      <div className="text-xs text-muted-foreground/60">
                        Created {format(new Date(url.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                      <div className="flex items-center gap-1.5 text-sm font-medium bg-secondary px-3 py-1.5 rounded-md text-secondary-foreground">
                        <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
                        {url.clickCount}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setQrUrl(url)}
                        title="Show QR Code"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/urls/${url.id}/analytics`)}
                      >
                        <BarChart3 className="h-4 w-4 mr-1.5" />
                        Stats
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            disabled={deletingId === url.id}
                          >
                            {deletingId === url.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this link?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The link /r/{url.shortCode} will no longer work and all analytics data will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(url.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center p-12 bg-muted/20 rounded-lg border border-dashed">
              <p className="text-muted-foreground text-sm">No links yet. Paste a URL above to create your first short link.</p>
            </div>
          )}
        </div>
      </div>

      {qrUrl && (
        <QrCodeDialog
          url={qrUrl}
          open={!!qrUrl}
          onClose={() => setQrUrl(null)}
        />
      )}
    </AppLayout>
  );
}

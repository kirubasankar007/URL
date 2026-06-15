import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import UrlsList from "@/pages/urls";
import UrlAnalytics from "@/pages/url-analytics";

const queryClient = new QueryClient();

// Auth guard component
function ProtectedRoute({ component: Component, ...rest }: { component: any, [key: string]: any }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Root redirect
  if (window.location.pathname === "/") {
    if (isAuthenticated) {
      setLocation("/dashboard");
    } else {
      setLocation("/login");
    }
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/urls">
        <ProtectedRoute component={UrlsList} />
      </Route>
      <Route path="/urls/:id/analytics">
        <ProtectedRoute component={UrlAnalytics} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

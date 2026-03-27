import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DotWaveBackground from "./components/DotWaveBackground";
import { I18nProvider } from "@/i18n/i18n";
import { AuthProvider } from "./contexts/AuthContext";

const Training = lazy(() => import("./pages/Training"));
const Login = lazy(() => import("./pages/Login"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const DesignPricing = lazy(() => import("./pages/DesignPricing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Articles = lazy(() => import("./pages/Articles"));
const ArticleDetailPage = lazy(() => import("./pages/ArticleDetail"));
const About = lazy(() => import("./pages/About"));
const Booking = lazy(() => import("./pages/Booking"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Analytics = lazy(() => import("./components/Analytics"));
const ChatWidget = lazy(() => import("./components/ChatWidget"));

function RouteFallback() {
  return <div className="min-h-[40vh]" />;
}

function DeferredChatWidget() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const enable = () => setEnabled(true);
    const timeoutId = window.setTimeout(enable, 3500);
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart", "scroll"];
    const handler = () => {
      setEnabled(true);
      events.forEach((eventName) => window.removeEventListener(eventName, handler));
    };

    events.forEach((eventName) => window.addEventListener(eventName, handler, { passive: true, once: true }));

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, handler));
    };
  }, []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <ChatWidget />
    </Suspense>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/fr"} component={Home} />
      <Route path={"/ar"} component={Home} />
      {/* Training */}
      <Route path={"/training"} component={Training} />
      <Route path={"/fr/training"} component={Training} />
      <Route path={"/ar/training"} component={Training} />
      <Route path={"/design-pricing"} component={DesignPricing} />
      <Route path={"/fr/design-pricing"} component={DesignPricing} />
      <Route path={"/ar/design-pricing"} component={DesignPricing} />
      <Route path={"/login"} component={Login} />
      <Route path={"/fr/login"} component={Login} />
      <Route path={"/ar/login"} component={Login} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/fr/dashboard"} component={Dashboard} />
      <Route path={"/ar/dashboard"} component={Dashboard} />
      <Route path={"/articles"} component={Articles} />
      <Route path={"/fr/articles"} component={Articles} />
      <Route path={"/ar/articles"} component={Articles} />
      <Route path={"/articles/:slug"} component={ArticleDetailPage} />
      <Route path={"/fr/articles/:slug"} component={ArticleDetailPage} />
      <Route path={"/ar/articles/:slug"} component={ArticleDetailPage} />
      <Route path={"/about"} component={About} />
      <Route path={"/fr/about"} component={About} />
      <Route path={"/ar/about"} component={About} />
      <Route path={"/book"} component={Booking} />
      <Route path={"/fr/book"} component={Booking} />
      <Route path={"/ar/book"} component={Booking} />
      {/* Legal */}
      <Route path={"/privacy"} component={Privacy} />
      <Route path={"/terms"} component={Terms} />
      <Route path={"/fr/privacy"} component={Privacy} />
      <Route path={"/fr/terms"} component={Terms} />
      <Route path={"/ar/privacy"} component={Privacy} />
      <Route path={"/ar/terms"} component={Terms} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
      <ThemeProvider
        defaultTheme="light"
      >
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <DotWaveBackground />
            <Suspense fallback={null}>
              <Analytics />
            </Suspense>
            <DeferredChatWidget />
            <Suspense fallback={<RouteFallback />}>
              <Router />
            </Suspense>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;

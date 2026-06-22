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
import { SEO_KNOWLEDGE_CANONICAL_PATHS, SEO_SERVICE_CANONICAL_PATHS } from "@shared/seoRoutePaths";
import { isDesignerWorkspaceHost } from "@/lib/site";

const Training = lazy(() => import("./pages/Training"));
const TrainingCareer = lazy(() => import("./pages/TrainingCareer"));
const Login = lazy(() => import("./pages/Login"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const DesignPricing = lazy(() => import("./pages/DesignPricing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DesignerDashboard = lazy(() => import("./pages/DesignerDashboard"));
const TrainerDashboard = lazy(() => import("./pages/TrainerDashboard"));
const Articles = lazy(() => import("./pages/Articles"));
const ArticleDetailPage = lazy(() => import("./pages/ArticleDetail"));
const Guides = lazy(() => import("./pages/Guides"));
const About = lazy(() => import("./pages/About"));
const Booking = lazy(() => import("./pages/Booking"));
const BookingCart = lazy(() => import("./pages/BookingCart"));
const BookingCheckout = lazy(() => import("./pages/BookingCheckout"));
const ServiceLanding = lazy(() => import("./pages/ServiceLanding"));
const SeoKnowledgeLanding = lazy(() => import("./pages/SeoKnowledgeLanding"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Analytics = lazy(() => import("./components/Analytics"));
const ChatWidget = lazy(() => import("./components/ChatWidget"));

const serviceRoutes = SEO_SERVICE_CANONICAL_PATHS.flatMap((path) => {
  return [path, `/fr${path}`, `/ar${path}`];
});

const knowledgeRoutes = SEO_KNOWLEDGE_CANONICAL_PATHS.flatMap((path) => {
  return [path, `/fr${path}`, `/ar${path}`];
});

function RouteFallback() {
  return <div className="min-h-[40vh]" />;
}

function DeferredChatWidget() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let idleHandle = 0;
    const fallbackTimer = window.setTimeout(() => setEnabled(true), 7000);
    const requestIdle = window.requestIdleCallback?.bind(window);
    const cancelIdle = window.cancelIdleCallback?.bind(window);

    if (requestIdle) {
      idleHandle = requestIdle(() => setEnabled(true), { timeout: 7000 });
    }

    const events: Array<keyof WindowEventMap> = ["click", "keydown"];
    const handler = () => {
      setEnabled(true);
      events.forEach((eventName) => window.removeEventListener(eventName, handler));
    };

    events.forEach((eventName) => window.addEventListener(eventName, handler, { passive: true, once: true }));

    return () => {
      window.clearTimeout(fallbackTimer);
      if (idleHandle && cancelIdle) {
        cancelIdle(idleHandle);
      }
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

function DeferredAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const events: Array<keyof WindowEventMap> = ["click", "keydown"];
    const handler = () => {
      setEnabled(true);
      events.forEach((eventName) => window.removeEventListener(eventName, handler));
    };

    events.forEach((eventName) => window.addEventListener(eventName, handler, { passive: true, once: true }));

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, handler));
    };
  }, []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <Analytics />
    </Suspense>
  );
}

function Router() {
  const designerWorkspace = isDesignerWorkspaceHost();
  const homeComponent = designerWorkspace ? DesignerDashboard : Home;

  return (
    <Switch>
      <Route path={"/"} component={homeComponent} />
      <Route path={"/fr"} component={homeComponent} />
      <Route path={"/ar"} component={homeComponent} />
      {/* Training */}
      <Route path={"/training/career"} component={TrainingCareer} />
      <Route path={"/fr/training/career"} component={TrainingCareer} />
      <Route path={"/ar/training/career"} component={TrainingCareer} />
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
      <Route path={"/designer"} component={DesignerDashboard} />
      <Route path={"/fr/designer"} component={DesignerDashboard} />
      <Route path={"/ar/designer"} component={DesignerDashboard} />
      <Route path={"/trainer"} component={TrainerDashboard} />
      <Route path={"/fr/trainer"} component={TrainerDashboard} />
      <Route path={"/ar/trainer"} component={TrainerDashboard} />
      <Route path={"/articles"} component={Articles} />
      <Route path={"/fr/articles"} component={Articles} />
      <Route path={"/ar/articles"} component={Articles} />
      <Route path={"/guides"} component={Guides} />
      <Route path={"/fr/guides"} component={Guides} />
      <Route path={"/ar/guides"} component={Guides} />
      <Route path={"/articles/:slug"} component={ArticleDetailPage} />
      <Route path={"/fr/articles/:slug"} component={ArticleDetailPage} />
      <Route path={"/ar/articles/:slug"} component={ArticleDetailPage} />
      <Route path={"/about"} component={About} />
      <Route path={"/fr/about"} component={About} />
      <Route path={"/ar/about"} component={About} />
      <Route path={"/book/cart"} component={BookingCart} />
      <Route path={"/fr/book/cart"} component={BookingCart} />
      <Route path={"/ar/book/cart"} component={BookingCart} />
      <Route path={"/book/checkout"} component={BookingCheckout} />
      <Route path={"/fr/book/checkout"} component={BookingCheckout} />
      <Route path={"/ar/book/checkout"} component={BookingCheckout} />
      <Route path={"/book"} component={Booking} />
      <Route path={"/fr/book"} component={Booking} />
      <Route path={"/ar/book"} component={Booking} />
      {serviceRoutes.map((path) => (
        <Route key={path} path={path} component={ServiceLanding} />
      ))}
      {knowledgeRoutes.map((path) => (
        <Route key={path} path={path} component={SeoKnowledgeLanding} />
      ))}
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
            <DeferredAnalytics />
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

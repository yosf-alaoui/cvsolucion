import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Training from "./pages/Training";
import Login from "./pages/Login";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import DesignPricing from "./pages/DesignPricing";
import Analytics from "./components/Analytics";
import { I18nProvider } from "@/i18n/i18n";
import { AuthProvider } from "./contexts/AuthContext";


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
            <Analytics />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;

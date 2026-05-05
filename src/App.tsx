import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { OrderProvider } from "@/hooks/useOrder";
import { DayWeightsProvider } from "@/hooks/useDayWeights";
import { DismissalsProvider } from "@/hooks/useDismissals";
import { CategorySettingsProvider } from "@/hooks/useCategorySettings";

// Lazy-load every route. The home page (Recommendations) is split out
// alongside the others — its chunk loads on first paint anyway, but
// keeping it lazy means deep links to other routes don't have to ship
// Recommendations. Cuts the initial bundle from ~790kB to a smaller
// shell + the matched route's chunk.
const Index = lazy(() => import("./pages/Index"));
const History = lazy(() => import("./pages/History"));
const StockReport = lazy(() => import("./pages/StockReport"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const IngredientsStudio = lazy(() => import("./pages/IngredientsStudio"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const WeightCalendar = lazy(() => import("./pages/WeightCalendar"));
const Menu = lazy(() => import("./pages/Menu"));
const Inventory = lazy(() => import("./pages/Inventory"));

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Route fallback: a minimal full-screen placeholder during chunk fetch.
// Kept tiny on purpose — anything heavier defeats the point of lazy
// loading by adding work to the suspense boundary.
function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-bold">
      Đang tải...
    </div>
  );
}

const AppRoutes = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<Recommendations />} />
      <Route path="/order" element={<Index />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/weight-calendar" element={<WeightCalendar />} />
      <Route path="/ingredients-studio" element={<IngredientsStudio />} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/stock-report" element={<ProtectedRoute><StockReport /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppSettingsProvider>
            <OrderProvider>
              <DayWeightsProvider>
                <CategorySettingsProvider>
                  <DismissalsProvider>
                    <AppRoutes />
                  </DismissalsProvider>
                </CategorySettingsProvider>
              </DayWeightsProvider>
            </OrderProvider>
          </AppSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

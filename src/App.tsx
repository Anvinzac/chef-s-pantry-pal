import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import History from "./pages/History";
import StockReport from "./pages/StockReport";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { OrderProvider } from "@/hooks/useOrder";
import { DayWeightsProvider } from "@/hooks/useDayWeights";
import { DismissalsProvider } from "@/hooks/useDismissals";
import { CategorySettingsProvider } from "@/hooks/useCategorySettings";
import IngredientsStudio from "./pages/IngredientsStudio";
import Recommendations from "./pages/Recommendations";
import WeightCalendar from "./pages/WeightCalendar";
import Menu from "./pages/Menu";
import Inventory from "./pages/Inventory";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const AppRoutes = () => (
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

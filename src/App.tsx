import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Packages from "./pages/Packages";
import Booking from "./pages/Booking";
import Index from "./pages/Index";
import Verify from "./pages/Verify";

type PageState = "auth" | "verify" | "register" | "booking" | "dashboard";

const queryClient = new QueryClient();

function AppContent() {
  const { currentUser, isLoading } = useAuth();
  const [page, setPage] = useState<PageState>("auth");

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        setPage("auth");
      } else if (!currentUser.emailVerified && currentUser.providerId === "password") {
        setPage("verify");
      } else {
        setPage("dashboard");
      }
    }
  }, [currentUser, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "auth":
        return <Auth onPageChange={setPage} />;
      case "verify":
        return <Verify onPageChange={setPage} />;
      case "register":
        return <div>Registration page - Coming soon</div>;
      case "booking":
        return <Booking onPageChange={setPage} />;
      case "dashboard":
        return <Dashboard onPageChange={setPage} />;
      default:
        return <Auth onPageChange={setPage} />;
    }
  };

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {renderPage()}
    </TooltipProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

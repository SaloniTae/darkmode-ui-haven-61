
import React, { Suspense, lazy, memo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { AccessControlProvider } from "@/context/AccessControlContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import PersistLogin from "@/components/auth/PersistLogin";

// Lazy load pages to improve initial loading performance
const CrunchyrollAdmin = lazy(() => import("./pages/CrunchyrollAdmin"));
const NetflixAdmin = lazy(() => import("./pages/NetflixAdmin"));
const PrimeAdmin = lazy(() => import("./pages/PrimeAdmin"));
const NSWFAdmin = lazy(() => import("./pages/NSWFAdmin"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const PasswordResetPage = lazy(() => import("./pages/PasswordResetPage"));
const ConfigPage = lazy(() => import("./pages/ConfigPage"));

// Create a new QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent unnecessary refetching
      retry: 1, // Limit retries to reduce network requests
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Cache for 10 minutes (formerly cacheTime in v4)
    },
  },
});

// Memoize the App component to reduce unnecessary re-renders
const App = memo(() => (
  <ThemeProvider defaultTheme="dark">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <AccessControlProvider>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            }>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/password-reset" element={<PasswordResetPage />} />
                
                {/* Config route - protected by password, not auth status */}
                <Route path="/config" element={<ConfigPage />} />
                
                {/* Protected routes wrapped with PersistLogin */}
                <Route element={<PersistLogin />}>
                  <Route path="/crunchyroll" element={
                    <ProtectedRoute requiredService="crunchyroll">
                      <CrunchyrollAdmin />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/netflix" element={
                    <ProtectedRoute requiredService="netflix">
                      <NetflixAdmin />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/prime" element={
                    <ProtectedRoute requiredService="prime">
                      <PrimeAdmin />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/NSFW" element={
                    <ProtectedRoute requiredService="NSFW">
                      <NSWFAdmin />
                    </ProtectedRoute>
                  } />
                </Route>
                
                {/* Redirect root to login page */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* Fallback for unknown routes */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </AccessControlProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
));

export default App;

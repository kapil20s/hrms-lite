import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";

// Lazy-load pages for code splitting
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const EmployeesPage = lazy(() => import("@/pages/EmployeesPage"));
const AttendancePage = lazy(() => import("@/pages/AttendancePage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={
                <Suspense fallback={<PageLoader />}>
                  <DashboardPage />
                </Suspense>
              }
            />
            <Route
              path="/employees"
              element={
                <Suspense fallback={<PageLoader />}>
                  <EmployeesPage />
                </Suspense>
              }
            />
            <Route
              path="/attendance"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AttendancePage />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

import { lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/features/auth/AuthContext";
import { Toaster } from "@/components/ui/toast";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AppShellLayout } from "@/layouts/AppShellLayout";
import { RequireAuth, RequireGuest, RequireRole } from "@/routes/guards";

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const ProblemsListPage = lazy(() => import("@/pages/ProblemsListPage"));
const ProblemDetailPage = lazy(() => import("@/pages/ProblemDetailPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ForbiddenPage = lazy(() => import("@/pages/ForbiddenPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const CompanyDashboardPage = lazy(() => import("@/pages/company/CompanyDashboardPage"));
const CompanyProblemsPage = lazy(() => import("@/pages/company/CompanyProblemsPage"));
const CompanyProblemFormPage = lazy(() => import("@/pages/company/CompanyProblemFormPage"));
const CompanyProblemProposalsPage = lazy(() => import("@/pages/company/CompanyProblemProposalsPage"));
const CompanyProposalsPage = lazy(() => import("@/pages/company/CompanyProposalsPage"));

const ScientistDashboardPage = lazy(() => import("@/pages/scientist/ScientistDashboardPage"));
const ScientistProposalsPage = lazy(() => import("@/pages/scientist/ScientistProposalsPage"));

const ConnectionsPage = lazy(() => import("@/pages/ConnectionsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminProblemsPage = lazy(() => import("@/pages/admin/AdminProblemsPage"));
const AdminProposalsPage = lazy(() => import("@/pages/admin/AdminProposalsPage"));

const ExpertDashboardPage = lazy(() => import("@/pages/expert/ExpertDashboardPage"));
const ExpertProposalReviewPage = lazy(() => import("@/pages/expert/ExpertProposalReviewPage"));

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-center" />
            <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/problems" element={<ProblemsListPage />} />
                  <Route path="/problems/:problemId" element={<ProblemDetailPage />} />
                  <Route path="/forbidden" element={<ForbiddenPage />} />
                  <Route path="*" element={<NotFoundPage />} />

                  <Route element={<RequireGuest />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                  </Route>
                </Route>

                <Route element={<RequireAuth />}>
                  <Route element={<AppShellLayout />}>
                    <Route path="/app/profile" element={<ProfilePage />} />
                    <Route path="/app/connections" element={<ConnectionsPage />} />

                    <Route element={<RequireRole roles={["COMPANY"]} />}>
                      <Route path="/app/company" element={<CompanyDashboardPage />} />
                      <Route path="/app/company/problems" element={<CompanyProblemsPage />} />
                      <Route path="/app/company/proposals" element={<CompanyProposalsPage />} />
                      <Route path="/app/company/problems/new" element={<CompanyProblemFormPage />} />
                      <Route path="/app/company/problems/:problemId/edit" element={<CompanyProblemFormPage />} />
                      <Route path="/app/company/problems/:problemId/proposals" element={<CompanyProblemProposalsPage />} />
                    </Route>

                    <Route element={<RequireRole roles={["SCIENTIST"]} />}>
                      <Route path="/app/scientist" element={<ScientistDashboardPage />} />
                      <Route path="/app/problems" element={<ProblemsListPage />} />
                      <Route path="/app/problems/:problemId" element={<ProblemDetailPage />} />
                      <Route path="/app/scientist/proposals" element={<ScientistProposalsPage />} />
                    </Route>

                    <Route element={<RequireRole roles={["EXPERT"]} />}>
                      <Route path="/app/expert" element={<ExpertDashboardPage />} />
                      <Route path="/app/expert/proposals/:proposalId" element={<ExpertProposalReviewPage />} />
                    </Route>

                    <Route element={<RequireRole roles={["ADMIN"]} />}>
                      <Route path="/admin" element={<AdminDashboardPage />} />
                      <Route path="/admin/users" element={<AdminUsersPage />} />
                      <Route path="/admin/problems" element={<AdminProblemsPage />} />
                      <Route path="/admin/proposals" element={<AdminProposalsPage />} />
                    </Route>
                  </Route>
                </Route>
              </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}

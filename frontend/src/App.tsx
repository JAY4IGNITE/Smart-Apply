import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './components/AdminLayout';
import AnnouncementBanner from './components/AnnouncementBanner';
import { InlineLoader } from './components/LoadingSpinner';
import { useAuth } from './context/AuthContext';
import { apiFetch } from './api/client';
import { AlertTriangle } from 'lucide-react';

// Route-level code splitting: each page (and its dependencies) loads only when
// the person actually navigates there, keeping the initial bundle small.
const SplashScreen = lazy(() => import('./pages/SplashScreen'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const OtpVerify = lazy(() => import('./pages/OtpVerify'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Docs = lazy(() => import('./pages/Docs'));
const NotFound = lazy(() => import('./pages/NotFound'));

const Home = lazy(() => import('./pages/dashboard/Home'));
const Resumes = lazy(() => import('./pages/dashboard/Resumes'));
const CoverLetterGenerator = lazy(() => import('./pages/dashboard/CoverLetterGenerator'));
const JobMatching = lazy(() => import('./pages/dashboard/JobMatching'));
const ResumeTailor = lazy(() => import('./pages/dashboard/ResumeTailor'));
const AtsChecker = lazy(() => import('./pages/dashboard/AtsChecker'));
const AiChatbot = lazy(() => import('./pages/dashboard/AiChatbot'));
const ProjectRecommender = lazy(() => import('./pages/dashboard/ProjectRecommender'));
const IdeaPromptGenerator = lazy(() => import('./pages/dashboard/IdeaPromptGenerator'));
const LiveInterview = lazy(() => import('./pages/dashboard/LiveInterview'));
const InterviewReport = lazy(() => import('./pages/dashboard/InterviewReport'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const LinkedInOptimizer = lazy(() => import('./pages/dashboard/LinkedInOptimizer'));
const AdminPanel = lazy(() => import('./pages/dashboard/AdminPanel'));
const AdminUsers = lazy(() => import('./pages/dashboard/AdminUsers'));
const AdminSettings = lazy(() => import('./pages/dashboard/AdminSettings'));
const ResumeMaker = lazy(() => import('./pages/dashboard/ResumeMaker'));
const AdminResumeTemplates = lazy(() => import('./pages/dashboard/AdminResumeTemplates'));

function PageFallback() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
        zIndex: 99999,
      }}
    >
      <InlineLoader title="Loading SmartApply" showDots={false} />
    </div>
  );
}

/**
 * Fades and lifts each dashboard page in on navigation, keyed by pathname.
 * This lives *inside* DashboardLayout (below the Suspense boundary) so only
 * the page content transitions — the sidebar never re-animates or flickers
 * when moving between dashboard routes. Kept to a single quick enter
 * animation (no exit) so it never fights with Suspense while a lazy chunk
 * is still loading.
 */
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense fallback={<PageFallback />}>
          <PageTransition>{children}</PageTransition>
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function AdminProtected({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <AdminLayout>
        {!user?.is_admin ? (
          <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh', gap: 16 }}>
            <AlertTriangle size={64} color="var(--danger)" />
            <h2>403 Forbidden</h2>
            <p>You do not have permission to view the Admin Console.</p>
          </div>
        ) : (
          <Suspense fallback={<PageFallback />}>
            <PageTransition>{children}</PageTransition>
          </Suspense>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Fetch public settings in the background without blocking initial paint
    apiFetch<{ maintenance_mode: boolean }>('/auth/public-settings')
      .then(res => {
        if (mounted && res.ok && res.data?.maintenance_mode) {
          setMaintenance(true);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  if (maintenance && !user?.is_admin) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--surface)' }}>
        <AlertTriangle size={64} color="var(--danger)" />
        <h1 style={{ margin: 0, color: 'var(--ink)' }}>System Under Maintenance</h1>
        <p style={{ margin: 0, color: 'var(--ink-faint)' }}>We're currently performing some upgrades. Please check back later!</p>
      </div>
    );
  }

  return (
    <>
      <AnnouncementBanner />
      <Suspense fallback={<PageFallback />}>
        <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<OtpVerify />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Onboarding sits outside the dashboard shell, but still requires auth */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Protected><Home /></Protected>} />
        <Route path="/dashboard/resumes" element={<Protected><Resumes /></Protected>} />
        <Route path="/dashboard/cover-letter" element={<Protected><CoverLetterGenerator /></Protected>} />
        <Route path="/dashboard/jobs" element={<Protected><JobMatching /></Protected>} />
        <Route path="/dashboard/tailor-resume/:id" element={<Protected><ResumeTailor /></Protected>} />
        <Route path="/dashboard/ats-checker" element={<Protected><AtsChecker /></Protected>} />
        <Route path="/dashboard/ai-chatbot" element={<Protected><AiChatbot /></Protected>} />
        <Route path="/dashboard/project-recommender" element={<Protected><ProjectRecommender /></Protected>} />
        <Route path="/dashboard/idea-prompt-generator" element={<Protected><IdeaPromptGenerator /></Protected>} />
        <Route
          path="/dashboard/live-interview"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageFallback />}>
                <LiveInterview />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard/live-interview/report/:roomName" element={<Protected><InterviewReport /></Protected>} />
        <Route path="/dashboard/interview-report/:roomName" element={<Protected><InterviewReport /></Protected>} />
        <Route path="/dashboard/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/dashboard/settings" element={<Protected><Settings /></Protected>} />
        <Route path="/dashboard/linkedin" element={<Protected><LinkedInOptimizer /></Protected>} />
        <Route path="/dashboard/resume-maker" element={<Protected><ResumeMaker /></Protected>} />
        
        {/* Admin Routes with Aliases */}
        <Route path="/admin" element={<Navigate to="/dashboard/sysadmin" replace />} />
        <Route path="/admin/users" element={<Navigate to="/dashboard/sysadmin/users" replace />} />
        <Route path="/admin/settings" element={<Navigate to="/dashboard/sysadmin/settings" replace />} />
        <Route path="/admin/resume-templates" element={<Navigate to="/dashboard/sysadmin/resume-templates" replace />} />
        <Route path="/dashboard/admin" element={<Navigate to="/dashboard/sysadmin" replace />} />
        <Route path="/dashboard/admin/*" element={<Navigate to="/dashboard/sysadmin" replace />} />
        <Route path="/sysadmin" element={<Navigate to="/dashboard/sysadmin" replace />} />
        <Route path="/sysadmin/*" element={<Navigate to="/dashboard/sysadmin" replace />} />

        <Route path="/dashboard/sysadmin" element={<AdminProtected><AdminPanel /></AdminProtected>} />
        <Route path="/dashboard/sysadmin/users" element={<AdminProtected><AdminUsers /></AdminProtected>} />
        <Route path="/dashboard/sysadmin/settings" element={<AdminProtected><AdminSettings /></AdminProtected>} />
        <Route path="/dashboard/sysadmin/resume-templates" element={<AdminProtected><AdminResumeTemplates /></AdminProtected>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
    </>
  );
}

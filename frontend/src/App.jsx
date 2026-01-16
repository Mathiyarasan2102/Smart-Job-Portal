import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import JobList from './pages/JobList';
import JobDetail from './pages/JobDetail';
import PostJob from './pages/PostJob';
import RecruiterDashboard from './pages/RecruiterDashboard';
import ApplicationList from './pages/ApplicationList';
import CandidateApplications from './pages/CandidateApplications';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/jobs" element={<JobList />} />
                <Route path="/jobs/:id" element={<JobDetail />} />

                {/* Protected: Recruiter Only */}
                <Route
                  path="/post-job"
                  element={
                    <ProtectedRoute allowedRoles={['recruiter']}>
                      <PostJob />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['recruiter']}>
                      <RecruiterDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applications/:jobId"
                  element={
                    <ProtectedRoute allowedRoles={['recruiter']}>
                      <ApplicationList />
                    </ProtectedRoute>
                  }
                />

                {/* Protected: Candidate Only */}
                <Route
                  path="/my-applications"
                  element={
                    <ProtectedRoute allowedRoles={['candidate']}>
                      <CandidateApplications />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

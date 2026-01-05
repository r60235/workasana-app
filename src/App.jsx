import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/Dashboard';
import ProjectView from './components/projects/ProjectView';
import TeamView from './components/teams/TeamView';
import TaskList from './components/tasks/TaskList';
import TaskDetails from './components/tasks/TaskDetails';
import Reports from './components/reports/Reports';

// layout component for authenticated pages
const AppLayout = ({ children }) => {
  return (
    <div className="d-flex">
      <Navbar />
      <div className="main-content flex-grow-1 main-content-desktop">
        {children}
      </div>
    </div>
  );
};

// main app routes
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">loading...</span>
          </div>
          <p className="mt-3 text-muted">loading workasana...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* public routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/signup" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} 
      />

      {/* protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/projects" element={
        <ProtectedRoute>
          <AppLayout>
            <ProjectView />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/tasks" element={
        <ProtectedRoute>
          <AppLayout>
            <TaskList />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/tasks/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <TaskDetails />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/teams" element={
        <ProtectedRoute>
          <AppLayout>
            <TeamView />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute>
          <AppLayout>
            <Reports />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
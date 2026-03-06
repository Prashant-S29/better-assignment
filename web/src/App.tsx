import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ShareView from './pages/ShareView';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/reset-password' element={<ResetPassword />} />

        {/* Protected */}
        <Route
          path='/dashboard/*'
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/share/:hex'
          element={
            <ProtectedRoute>
              <ShareView />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SubjectProvider } from "./context/SubjectContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Subjects from "./pages/Subjects";
import TopicTracker from "./pages/TopicTracker";
import PomodoroTimer from "./pages/PomodoroTimer";
import SessionHistory from "./pages/SessionHistory";
import ProblemTracker from "./pages/ProblemTracker";
import Notes from "./pages/Notes";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Today from "./pages/Today";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <AuthProvider>
        <SubjectProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/today" replace />} />
                <Route path="/today" element={<Today />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/subjects" element={<Subjects />} />
                <Route path="/subjects/:id" element={<TopicTracker />} />
                <Route path="/timer" element={<PomodoroTimer />} />
                <Route path="/history" element={<SessionHistory />} />
                <Route path="/problems" element={<ProblemTracker />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </SubjectProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

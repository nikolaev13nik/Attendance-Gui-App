import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth.jsx";
import Landing from "./pages/Landing.jsx";
import SignUpOrg from "./pages/SignUpOrg.jsx";
import SignUpAdmin from "./pages/SignUpAdmin.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Users from "./pages/Users.jsx";
import Session from "./pages/Session.jsx";
import Sessions from "./pages/Sessions.jsx";
import LeaveDays from "./pages/LeaveDays.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup/organization" element={<SignUpOrg />} />
      <Route path="/signup/administrator" element={<SignUpAdmin />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
      <Route
        path="/session"
        element={
          <RequireAuth>
            <Session />
          </RequireAuth>
        }
      />
      <Route
        path="/users"
        element={
          <RequireAuth adminOnly>
            <Users />
          </RequireAuth>
        }
      />
      <Route
        path="/sessions"
        element={
          <RequireAuth>
            <Sessions />
          </RequireAuth>
        }
      />
      <Route
        path="/leave-days"
        element={
          <RequireAuth>
            <LeaveDays />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

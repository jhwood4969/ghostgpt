import { Navigate, Route, Routes } from "react-router-dom";
import { Nav } from "./components/Nav";
import { ApiDocs } from "./pages/ApiDocs";
import { Chat } from "./pages/Chat";
import { Code } from "./pages/Code";
import { Landing } from "./pages/Landing";

export default function App() {
  return (
    <div className="app-shell">
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/code" element={<Code />} />
          <Route path="/api" element={<ApiDocs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import ExplorePools from "./pages/ExplorePools";
import PoolDetail from "./pages/PoolDetail";
import CreatePool from "./pages/CreatePool";
import MyPools from "./pages/MyPools";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/pools" element={<ExplorePools />} />
          <Route path="/pool/:address" element={<PoolDetail />} />
          <Route path="/create" element={<CreatePool />} />
          <Route path="/my-pools" element={<MyPools />} />
        </Routes>
      </main>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #2a2a2a",
          },
          success: {
            iconTheme: { primary: "#9b59b6", secondary: "#0a0a0a" },
          },
        }}
      />
    </div>
  );
}

export default App;

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Demo: auto-login so the app opens ready to use
const DEMO_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc4MTQ5ODAyMCwiZXhwIjoxNzgyMTAyODIwfQ.Yer0hyvEoSCLDlal0WlKyTWERYpBvzGGxDIqGiI_Kv8";
localStorage.setItem("token", DEMO_TOKEN);
localStorage.setItem("user", JSON.stringify({ id: 2, email: "demo@shorturl.com" }));

createRoot(document.getElementById("root")!).render(<App />);

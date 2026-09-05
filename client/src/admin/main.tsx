import { createRoot } from "react-dom/client";
import "../lib/preloadRecovery";
import AdminApp from "./AdminApp";
import "@/index.css";
import { scrubInitialSensitiveUrl } from "@/lib/sensitiveUrl";

scrubInitialSensitiveUrl();

createRoot(document.getElementById("admin-root")!).render(<AdminApp />);

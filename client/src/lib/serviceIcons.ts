import {
  Braces,
  createLucideIcon,
  DatabaseBackup,
  Gauge,
  Headset,
  SearchCheck,
  type LucideIcon,
} from "lucide-react";
import type { SeoServicePageKey } from "@shared/seoServicePages";

export const CabinetLibraryIcon = createLucideIcon("CabinetLibrary", [
  ["rect", { x: "3", y: "2", width: "18", height: "20", rx: "2", key: "cabinet" }],
  ["path", { d: "M3 9h18", key: "shelf" }],
  ["path", { d: "M12 9v13", key: "divider" }],
  ["path", { d: "M9 15h.01", key: "left-handle" }],
  ["path", { d: "M15 15h.01", key: "right-handle" }],
]);

export const CncRouterIcon = createLucideIcon("CncRouter", [
  ["path", { d: "M3 21h18", key: "base" }],
  ["path", { d: "M5 21V5h14v16", key: "frame" }],
  ["path", { d: "M7 8h10", key: "gantry" }],
  ["path", { d: "M12 8v5", key: "axis" }],
  ["path", { d: "M10 13h4l-1 4h-2l-1-4Z", key: "spindle" }],
  ["path", { d: "M8 18h8", key: "workpiece" }],
]);

/**
 * One semantic icon per service. Keeping this mapping keyed by the service name
 * prevents icons from drifting when navigation items are reordered.
 */
export const SERVICE_ICON_BY_KEY: Record<SeoServicePageKey, LucideIcon> = {
  support: Headset,
  troubleshooting: SearchCheck,
  "library-setup": CabinetLibraryIcon,
  "cnc-integration": CncRouterIcon,
  "performance-optimization": Gauge,
  "install-backup-restore": DatabaseBackup,
  "custom-programming": Braces,
};

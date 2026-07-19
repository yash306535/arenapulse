/** F3 route — Crowd Intelligence & Heatmap (crowd management, real-time decision support). */
import { CrowdDashboard } from "@/components/features/crowd-dashboard";
import { listZones, stadiumViewBox } from "@/lib/stadium";

export default function CrowdPage(): React.JSX.Element {
  return <CrowdDashboard zones={listZones()} viewBox={stadiumViewBox()} />;
}

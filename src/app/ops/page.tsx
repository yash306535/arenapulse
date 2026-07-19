/** F7 route — Ops Command Center (operational intelligence, real-time decision support). */
import { OpsCenter } from "@/components/features/ops-center";
import { listZones } from "@/lib/stadium";

export default function OpsPage(): React.JSX.Element {
  return <OpsCenter zones={listZones().map((zone) => ({ id: zone.id, label: zone.label }))} />;
}

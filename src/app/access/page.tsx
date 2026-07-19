/** F4 route — Accessibility Companion (accessibility). */
import { AccessCompanion } from "@/components/features/access-companion";
import { getStadiumGraph } from "@/lib/stadium";

const ACCESS_AMENITIES = new Set([
  "accessible-seating",
  "sensory-room",
  "assistive-listening",
  "first-aid",
  "prayer-room",
]);

export default function AccessPage(): React.JSX.Element {
  const services = getStadiumGraph()
    .geo.nodes.filter((node) => node.amenity !== undefined && ACCESS_AMENITIES.has(node.amenity))
    .map((node) => ({ id: node.id, label: node.label }));
  return <AccessCompanion services={services} />;
}

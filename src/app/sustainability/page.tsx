/** F6 route — Sustainability Hub (sustainability). */
import { SustainabilityHub } from "@/components/features/sustainability-hub";
import { listCarbonModes } from "@/lib/sustainability/carbon";

export default function SustainabilityPage(): React.JSX.Element {
  return <SustainabilityHub modes={listCarbonModes()} />;
}

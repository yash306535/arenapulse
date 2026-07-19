/** F5 route — Transit & Parking Planner (transportation). */
import { TransitPlanner } from "@/components/features/transit-planner";
import { listMatches } from "@/lib/schedule";

export default function TransitPage(): React.JSX.Element {
  const matches = listMatches().map((match) => ({
    id: match.id,
    label: `${match.home} v ${match.away} — ${match.stage}`,
  }));
  return <TransitPlanner matches={matches} />;
}

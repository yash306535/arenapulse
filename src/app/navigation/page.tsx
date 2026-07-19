/** F2 route — Smart Stadium Navigation (navigation). Feeds graph data to the client planner. */
import { NavigationPlanner } from "@/components/features/navigation-planner";
import { getStadiumGraph } from "@/lib/stadium";

export default function NavigationPage(): React.JSX.Element {
  const { geo } = getStadiumGraph();
  return (
    <NavigationPlanner
      nodeOptions={geo.nodes.map((node) => ({ id: node.id, label: node.label }))}
      mapNodes={geo.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        x: node.x,
        y: node.y,
        type: node.type,
      }))}
      mapEdges={geo.edges.map((edge) => ({ from: edge.from, to: edge.to }))}
      viewBox={geo.venue.viewBox}
    />
  );
}

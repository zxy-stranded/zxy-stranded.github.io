import manual from "../../../data/relationships.json" with { type: "json" };
import related from "../../../data/related-figures.json" with { type: "json" };
import { figures, groups } from "../../shared/history.js";
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  forceCollide,
} from "d3-force";
export { manual, related };
export const allPeople = [
  ...figures,
  ...related.map((r) => ({ ...r, group: "ref", verdict: r.bio })),
];
export function allEdges() {
  const cohort = [];
  for (const g of groups) {
    const same = figures.filter((f) => f.group === g.id);
    for (let i = 0; i < same.length; i++)
      for (let j = i + 1; j < same.length; j++)
        cohort.push({
          id: `cohort-${same[i].id}-${same[j].id}`,
          source: same[i].id,
          target: same[j].id,
          type: "cohort",
          note: "同组创作原型，可能跨时代；不表示历史相识。",
          basis: g.name,
        });
  }
  return [...cohort, ...manual];
}
export function layoutGraph() {
  const nodes = allPeople.map((f) => ({
      id: f.id,
      name: f.name,
      group: f.group,
    })),
    links = allEdges().map((e) => ({ ...e }));
  const simulation = forceSimulation(nodes)
    .force("charge", forceManyBody().strength(-110))
    .force("center", forceCenter(450, 325))
    .force("collision", forceCollide(22))
    .force(
      "link",
      forceLink(links)
        .id((n) => n.id)
        .distance((e) => (e.type === "cohort" ? 70 : 130))
        .strength((e) => (e.type === "cohort" ? 0.12 : 0.35)),
    )
    .stop();
  simulation.tick(220);
  const minX = Math.min(...nodes.map((n) => n.x)),
    maxX = Math.max(...nodes.map((n) => n.x)),
    minY = Math.min(...nodes.map((n) => n.y)),
    maxY = Math.max(...nodes.map((n) => n.y));
  for (const n of nodes) {
    n.x = 45 + ((n.x - minX) / (maxX - minX)) * 810;
    n.y = 45 + ((n.y - minY) / (maxY - minY)) * 560;
  }
  return { nodes, edges: allEdges() };
}

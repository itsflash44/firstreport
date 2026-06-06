import { getLegalCase as getCase, updateCase } from '../lib/legalJourney';
import type { CaseFact } from '../types';
import { memoryEngine } from './case-memory-engine';
import type { ChatTurn } from '../lib/legalJourney';

export interface GraphNode {
  id: string;
  type: 'person' | 'location' | 'date' | 'document' | 'officer' | 'station' | 'event';
  label: string;
  value: string;
  source: 'transcript' | 'upload' | 'ocr';
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string;
}

export interface CaseGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  contradictions: Contradiction[];
  timeline: TimelineEvent[];
}

export interface Contradiction {
  field: string;
  values: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface TimelineEvent {
  timestamp: string;
  description: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export async function buildCaseGraph(
  caseId: string,
  transcript: ChatTurn[]
): Promise<CaseGraph> {
  const facts = await memoryEngine.getFactsForCase(caseId);

  const nodes = extractNodes(facts);
  const edges = linkNodes(nodes);
  const contradictions = detectContradictions(nodes);
  const timeline = buildTimeline(transcript, facts);

  return { nodes, edges, contradictions, timeline };
}

function extractNodes(facts: CaseFact[]): GraphNode[] {
  const nodes: GraphNode[] = [];
  const seen = new Set<string>();

  for (const fact of facts) {
    const key = `${fact.label}:${fact.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    nodes.push({
      id: fact.id,
      type: labelToNodeType(fact.label),
      label: fact.label,
      value: fact.value,
      source: fact.source === 'user_input' ? 'transcript' : fact.source,
    });
  }

  return nodes;
}

function labelToNodeType(label: string): GraphNode['type'] {
  const map: Record<string, GraphNode['type']> = {
    officerName: 'officer',
    officer: 'officer',
    station: 'station',
    stationName: 'station',
    date: 'date',
    time: 'date',
    location: 'location',
    posting: 'location',
    batchNumber: 'officer',
    accused: 'person',
    victim: 'person',
    witness: 'person',
  };
  return map[label] ?? 'event';
}

function linkNodes(nodes: GraphNode[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const officers = nodes.filter((n) => n.type === 'officer');
  const stations = nodes.filter((n) => n.type === 'station');

  for (const officer of officers) {
    for (const station of stations) {
      edges.push({
        from: officer.id,
        to: station.id,
        relation: 'posted_at',
      });
    }
  }

  return edges;
}

function detectContradictions(nodes: GraphNode[]): Contradiction[] {
  const contradictions: Contradiction[] = [];
  const grouped = new Map<string, string[]>();

  for (const node of nodes) {
    const existing = grouped.get(node.label) ?? [];
    existing.push(node.value);
    grouped.set(node.label, existing);
  }

  for (const [field, values] of grouped.entries()) {
    const unique = [...new Set(values.map((v) => v.toLowerCase().trim()))];
    if (unique.length > 1) {
      contradictions.push({
        field,
        values: unique,
        severity: field === 'date' || field === 'time' ? 'high' : 'medium',
      });
    }
  }

  return contradictions;
}

function buildTimeline(
  transcript: ChatTurn[],
  facts: CaseFact[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const dateFacts = facts.filter((f) => f.label === 'date' || f.label === 'time');
  for (const f of dateFacts) {
    events.push({
      timestamp: String(f.timestamp),
      description: `Incident ${f.label}: ${f.value}`,
      source: 'transcript',
      confidence: 'medium',
    });
  }

  if (transcript.length > 0 && transcript[0].ts) {
    events.push({
      timestamp: new Date(transcript[0].ts).toISOString(),
      description: 'Report started',
      source: 'system',
      confidence: 'high',
    });
  }

  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export async function persistContradictions(
  caseId: string,
  contradictions: Contradiction[]
): Promise<void> {
  // Mocked for V3 transition
}

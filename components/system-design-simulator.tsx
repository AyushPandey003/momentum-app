"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent as ReactMouseEvent, type WheelEvent as ReactWheelEvent } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  Cloud,
  Database,
  Eraser,
  Loader2,
  Link,
  Move,
  Network,
  Play,
  Plus,
  RotateCcw,
  Server,
  Shield,
  Square,
  Trash2,
  TrendingDown,
  TrendingUp,
  ZoomIn,
  ZoomOut,
  XCircle,
  Zap,
} from "lucide-react"

type ToolMode = "move" | "connect"

interface NodeTypeDefinition {
  id: string
  label: string
  description: string
  baseLatencyMs: number
  capacityRps: number
  colorClass: string
  icon: typeof Server
}

interface DiagramNode {
  id: string
  typeId: string
  label: string
  x: number
  y: number
  baseLatencyMs: number
  capacityRps: number
}

interface DiagramEdge {
  id: string
  from: string
  to: string
}

interface RewireState {
  edgeId: string
  endpoint: "from" | "to"
}

interface EdgeDraftState {
  fromNodeId: string
}

interface NodeRuntimeStats {
  rps: number
  utilization: number
  latencyMs: number
  health: number
}

interface SimulationMetrics {
  totalRps: number
  avgLatencyMs: number
  successRate: number
  hotspots: string[]
  nodeStats: Record<string, NodeRuntimeStats>
  edgeFlow: Record<string, number>
}

interface MentorResponse {
  response: string
  relevant_tips?: string[]
}

const NODE_WIDTH = 170
const NODE_HEIGHT = 92
const CANVAS_MIN_HEIGHT = 560
const MIN_SCALE = 0.35
const MAX_SCALE = 2.2

const nodePalette: NodeTypeDefinition[] = [
  {
    id: "load-balancer",
    label: "Load Balancer",
    description: "Distribute traffic across services",
    baseLatencyMs: 9,
    capacityRps: 2200,
    colorClass: "from-sky-500/25 to-cyan-500/15",
    icon: Network,
  },
  {
    id: "rate-limiter",
    label: "Rate Limiter",
    description: "Protect downstream from spikes",
    baseLatencyMs: 6,
    capacityRps: 2400,
    colorClass: "from-rose-500/20 to-orange-500/20",
    icon: Shield,
  },
  {
    id: "gateway",
    label: "API Gateway",
    description: "Ingress, auth, and routing",
    baseLatencyMs: 12,
    capacityRps: 850,
    colorClass: "from-cyan-500/30 to-sky-500/20",
    icon: Shield,
  },
  {
    id: "service",
    label: "App Service",
    description: "Business logic compute",
    baseLatencyMs: 28,
    capacityRps: 620,
    colorClass: "from-indigo-500/25 to-blue-500/15",
    icon: Server,
  },
  {
    id: "auth-service",
    label: "Auth Service",
    description: "Identity and token validation",
    baseLatencyMs: 16,
    capacityRps: 980,
    colorClass: "from-blue-500/20 to-indigo-500/20",
    icon: CheckCircle2,
  },
  {
    id: "cache",
    label: "Redis Cache",
    description: "Hot data, low latency",
    baseLatencyMs: 5,
    capacityRps: 1600,
    colorClass: "from-emerald-500/25 to-teal-500/15",
    icon: Zap,
  },
  {
    id: "database",
    label: "Primary DB",
    description: "Durable data store",
    baseLatencyMs: 48,
    capacityRps: 360,
    colorClass: "from-amber-500/25 to-orange-500/15",
    icon: Database,
  },
  {
    id: "queue",
    label: "Event Queue",
    description: "Async buffering",
    baseLatencyMs: 22,
    capacityRps: 980,
    colorClass: "from-fuchsia-500/25 to-pink-500/15",
    icon: Network,
  },
  {
    id: "worker",
    label: "Worker Pool",
    description: "Async consumers for jobs/events",
    baseLatencyMs: 20,
    capacityRps: 760,
    colorClass: "from-cyan-500/20 to-teal-500/20",
    icon: Activity,
  },
  {
    id: "cdn",
    label: "CDN Edge",
    description: "Static edge delivery",
    baseLatencyMs: 8,
    capacityRps: 1800,
    colorClass: "from-violet-500/20 to-blue-500/20",
    icon: Cloud,
  },
  {
    id: "read-replica",
    label: "Read Replica",
    description: "Scale read-heavy database access",
    baseLatencyMs: 26,
    capacityRps: 640,
    colorClass: "from-yellow-500/25 to-amber-500/15",
    icon: Database,
  },
  {
    id: "object-store",
    label: "Object Storage",
    description: "Files, media, and blobs",
    baseLatencyMs: 24,
    capacityRps: 1200,
    colorClass: "from-blue-500/20 to-slate-500/20",
    icon: Cloud,
  },
  {
    id: "search-index",
    label: "Search Index",
    description: "Fast search and filtering",
    baseLatencyMs: 18,
    capacityRps: 900,
    colorClass: "from-emerald-500/20 to-lime-500/20",
    icon: Brain,
  },
]

const starterNodes: DiagramNode[] = [
  {
    id: "n-gateway",
    typeId: "gateway",
    label: "API Gateway",
    x: 80,
    y: 220,
    baseLatencyMs: 12,
    capacityRps: 850,
  },
  {
    id: "n-service",
    typeId: "service",
    label: "App Service",
    x: 340,
    y: 220,
    baseLatencyMs: 28,
    capacityRps: 620,
  },
  {
    id: "n-cache",
    typeId: "cache",
    label: "Redis Cache",
    x: 600,
    y: 120,
    baseLatencyMs: 5,
    capacityRps: 1600,
  },
  {
    id: "n-db",
    typeId: "database",
    label: "Primary DB",
    x: 600,
    y: 320,
    baseLatencyMs: 48,
    capacityRps: 360,
  },
]

const starterEdges: DiagramEdge[] = [
  { id: "e-gw-svc", from: "n-gateway", to: "n-service" },
  { id: "e-svc-cache", from: "n-service", to: "n-cache" },
  { id: "e-svc-db", from: "n-service", to: "n-db" },
]

const defaultMetrics: SimulationMetrics = {
  totalRps: 0,
  avgLatencyMs: 0,
  successRate: 100,
  hotspots: [],
  nodeStats: {},
  edgeFlow: {},
}

function edgeRuntimeKey(from: string, to: string) {
  return `${from}->${to}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getNodeDef(typeId: string) {
  return nodePalette.find((item) => item.id === typeId)
}

function buildArchitectureCritique(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  trafficRps: number,
  chaosPercent: number,
): string {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const incoming = new Map<string, number>()
  const outgoing = new Map<string, number>()
  const adjacency = new Map<string, string[]>()

  for (const node of nodes) {
    incoming.set(node.id, 0)
    outgoing.set(node.id, 0)
    adjacency.set(node.id, [])
  }

  const invalidWires: string[] = []
  for (const edge of edges) {
    const fromNode = nodeById.get(edge.from)
    const toNode = nodeById.get(edge.to)
    if (!fromNode || !toNode) {
      invalidWires.push(`${edge.from} -> ${edge.to}`)
      continue
    }
    outgoing.set(edge.from, (outgoing.get(edge.from) || 0) + 1)
    incoming.set(edge.to, (incoming.get(edge.to) || 0) + 1)
    adjacency.get(edge.from)?.push(edge.to)
  }

  const gateways = nodes.filter((node) => node.typeId === "gateway")
  const services = nodes.filter((node) => node.typeId === "service")
  const caches = nodes.filter((node) => node.typeId === "cache")
  const databases = nodes.filter((node) => node.typeId === "database")
  const queues = nodes.filter((node) => node.typeId === "queue")
  const workers = nodes.filter((node) => node.typeId === "worker")
  const loadBalancers = nodes.filter((node) => node.typeId === "load-balancer")
  const rateLimiters = nodes.filter((node) => node.typeId === "rate-limiter")
  const authServices = nodes.filter((node) => node.typeId === "auth-service")
  const readReplicas = nodes.filter((node) => node.typeId === "read-replica")
  const objectStores = nodes.filter((node) => node.typeId === "object-store")
  const searchIndexes = nodes.filter((node) => node.typeId === "search-index")

  const reachable = new Set<string>()
  const queueForTraversal = gateways.map((node) => node.id)
  while (queueForTraversal.length > 0) {
    const current = queueForTraversal.shift()
    if (!current || reachable.has(current)) continue
    reachable.add(current)
    for (const next of adjacency.get(current) || []) {
      if (!reachable.has(next)) {
        queueForTraversal.push(next)
      }
    }
  }

  const suspiciousAdditions: string[] = []
  const missingPieces: string[] = []
  const wiringIssues: string[] = []
  const priorityFixes: string[] = []

  if (invalidWires.length > 0) {
    wiringIssues.push(`Wires reference missing nodes: ${invalidWires.join(", ")}. Remove or reconnect these wires.`)
  }

  if (gateways.length === 0) {
    missingPieces.push("No API gateway/ingress node found. Add one entry point before app services.")
  }

  const gatewaysWithIncoming = gateways.filter((node) => (incoming.get(node.id) || 0) > 0)
  if (gatewaysWithIncoming.length > 0) {
    suspiciousAdditions.push(
      `Gateway node should usually be ingress only, but has upstream dependencies: ${gatewaysWithIncoming.map((node) => node.label).join(", ")}.`,
    )
  }

  const isolatedNodes = nodes.filter((node) => (incoming.get(node.id) || 0) + (outgoing.get(node.id) || 0) === 0)
  if (isolatedNodes.length > 0) {
    suspiciousAdditions.push(
      `Isolated nodes with no traffic path: ${isolatedNodes.map((node) => node.label).join(", ")}. Remove or connect them.`,
    )
  }

  const unreachableNodes = nodes.filter((node) => node.typeId !== "gateway" && !reachable.has(node.id))
  if (gateways.length > 0 && unreachableNodes.length > 0) {
    wiringIssues.push(
      `These nodes are not reachable from ingress: ${unreachableNodes.map((node) => node.label).join(", ")}. They currently do not serve user traffic.`,
    )
  }

  if (services.length > 0 && caches.length === 0 && databases.length === 0 && queues.length === 0) {
    missingPieces.push("Services have no data tier (cache/database/queue). Add persistence or async buffering.")
  }

  if (trafficRps >= 1000 && loadBalancers.length === 0) {
    missingPieces.push("High traffic without a load balancer. Add one between gateway and stateless services.")
  }

  if (trafficRps >= 700 && rateLimiters.length === 0) {
    missingPieces.push("Traffic is burst-prone but no rate limiter is present. Add one before gateway/services.")
  }

  if (trafficRps >= 900 && caches.length === 0) {
    missingPieces.push("Read-heavy scale likely needs a cache tier. Add cache in front of primary DB reads.")
  }

  if (services.length > 0 && authServices.length === 0) {
    missingPieces.push("No dedicated auth service found. Add auth/token verification for secure service boundaries.")
  }

  const dbWithoutConsumers = databases.filter((node) => (incoming.get(node.id) || 0) === 0)
  if (dbWithoutConsumers.length > 0) {
    suspiciousAdditions.push(
      `Database nodes are present but no service writes/reads them: ${dbWithoutConsumers.map((node) => node.label).join(", ")}.`,
    )
  }

  const queueWithOpenEnds = queues.filter((node) => (incoming.get(node.id) || 0) === 0 || (outgoing.get(node.id) || 0) === 0)
  if (queueWithOpenEnds.length > 0) {
    wiringIssues.push(
      `Queue nodes have one-sided flow (missing producer or consumer): ${queueWithOpenEnds.map((node) => node.label).join(", ")}.`,
    )
  }

  if (queues.length > 0 && workers.length === 0) {
    missingPieces.push("Queue exists without worker consumers. Add worker pool to process async jobs.")
  }

  const workerWithoutQueueInput = workers.filter((node) => {
    const hasQueueInput = edges.some((edge) => edge.to === node.id && nodeById.get(edge.from)?.typeId === "queue")
    return !hasQueueInput
  })
  if (workerWithoutQueueInput.length > 0) {
    suspiciousAdditions.push(
      `Workers without queue/event input: ${workerWithoutQueueInput.map((node) => node.label).join(", ")}. Connect queue -> worker for async flow.`,
    )
  }

  const replicaWithoutPrimary = readReplicas.filter((node) => {
    const hasPrimaryInput = edges.some((edge) => edge.to === node.id && nodeById.get(edge.from)?.typeId === "database")
    return !hasPrimaryInput
  })
  if (replicaWithoutPrimary.length > 0) {
    wiringIssues.push(
      `Read replicas should be fed from primary DB: ${replicaWithoutPrimary.map((node) => node.label).join(", ")}. Add primary DB -> read replica replication path.`,
    )
  }

  const gatewayToStateStoreEdges = edges.filter((edge) => {
    const fromType = nodeById.get(edge.from)?.typeId
    const toType = nodeById.get(edge.to)?.typeId
    return fromType === "gateway" && (toType === "database" || toType === "read-replica" || toType === "object-store")
  })
  if (gatewayToStateStoreEdges.length > 0) {
    suspiciousAdditions.push(
      `Gateway directly wired to data stores (${gatewayToStateStoreEdges.length} edge${gatewayToStateStoreEdges.length > 1 ? "s" : ""}). Route gateway traffic through services first.`,
    )
  }

  const searchWithoutIndexer = searchIndexes.filter((node) => {
    const hasServiceOrWorkerInput = edges.some((edge) => {
      if (edge.to !== node.id) return false
      const fromType = nodeById.get(edge.from)?.typeId
      return fromType === "service" || fromType === "worker"
    })
    return !hasServiceOrWorkerInput
  })
  if (searchWithoutIndexer.length > 0) {
    wiringIssues.push(
      `Search index has no indexing pipeline: ${searchWithoutIndexer.map((node) => node.label).join(", ")}. Connect service/worker -> search index updates.`,
    )
  }

  const objectStoreWithoutProducer = objectStores.filter((node) => (incoming.get(node.id) || 0) === 0)
  if (objectStoreWithoutProducer.length > 0) {
    suspiciousAdditions.push(
      `Object storage has no producers: ${objectStoreWithoutProducer.map((node) => node.label).join(", ")}. Add upload/write flow from service or worker.`,
    )
  }

  const totalServiceCapacity = services.reduce((sum, node) => sum + node.capacityRps, 0)
  if (services.length > 0 && trafficRps > totalServiceCapacity) {
    priorityFixes.push(
      `Incoming load (${trafficRps} rps) exceeds service capacity (${totalServiceCapacity} rps). Scale services horizontally or reduce per-request work.`,
    )
  }

  if (chaosPercent >= 40 && queues.length === 0) {
    priorityFixes.push("Chaos is high but there is no queue for backpressure. Add async buffering for non-critical writes/jobs.")
  }

  if (chaosPercent >= 30 && rateLimiters.length === 0) {
    priorityFixes.push("Chaos is elevated with no rate limiting. Add limiter to protect core services during spikes and retries.")
  }

  if (priorityFixes.length === 0) {
    priorityFixes.push("Run one chaos scenario and optimize the hottest node by reducing dependency fan-out.")
  }

  const asList = (title: string, items: string[]) => [title, ...(items.length > 0 ? items.map((item) => `- ${item}`) : ["- None detected from structural checks."])].join("\n")

  return [
    "Rule-Based Design Critique (treat as factual signals)",
    asList("Suspicious Additions", suspiciousAdditions),
    asList("Missing Pieces", missingPieces),
    asList("Wiring Problems", wiringIssues),
    asList("Priority Fixes", priorityFixes),
  ].join("\n")
}

function normalizeFeedbackMarkdown(raw: string): string {
  const text = raw.replace(/\r\n/g, "\n").trim()
  if (!text) return ""

  const hasMarkdownSyntax = /(^\s*#{1,6}\s)|(^\s*[-*+]\s)|(^\s*\d+\.\s)|(^\s*```)|\*\*.+\*\*/m.test(text)
  if (hasMarkdownSyntax) return text

  const lines = text.split("\n").map((line) => line.trim())
  const output: string[] = []

  for (const line of lines) {
    if (!line) {
      if (output[output.length - 1] !== "") {
        output.push("")
      }
      continue
    }

    const numberedHeader = line.match(/^\d+\)\s*(.+?)\s*:?$/)
    if (numberedHeader?.[1]) {
      output.push(`### ${numberedHeader[1]}`)
      continue
    }

    const plainHeader = line.match(
      /^(Architecture Grade|What Works|Wrong or Risky Additions|Missing Components|Wiring and Flow Problems|Improvements to Try Next|Prioritized Action Plan|One Small Experiment|Learner focus)\s*:?\s*(.*)$/i,
    )
    if (plainHeader?.[1]) {
      const title = plainHeader[1]
      const tail = (plainHeader[2] || "").trim()
      output.push(`### ${title}`)
      if (tail) {
        output.push(tail)
      }
      continue
    }

    const tipLine = line.match(/^Quick Tips\s*:?$/i)
    if (tipLine) {
      output.push("### Quick Tips")
      continue
    }

    const looksLikeList =
      /^(add|define|set|route|introduce|increase|watch|eliminate|prefer|clear|service|primary|no\s|topology|current\s)/i.test(line) ||
      /\(impact:/i.test(line)

    if (looksLikeList) {
      output.push(`- ${line.replace(/^[-*]\s*/, "")}`)
      continue
    }

    output.push(line)
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

export function SystemDesignSimulator() {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [nodes, setNodes] = useState<DiagramNode[]>(starterNodes)
  const [edges, setEdges] = useState<DiagramEdge[]>(starterEdges)
  const [viewport, setViewport] = useState({ x: 80, y: 20, scale: 1 })
  const [mode, setMode] = useState<ToolMode>("move")
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null)
  const [rewiring, setRewiring] = useState<RewireState | null>(null)
  const [rewirePreview, setRewirePreview] = useState<{ x: number; y: number } | null>(null)
  const [edgeDraft, setEdgeDraft] = useState<EdgeDraftState | null>(null)
  const [edgeDraftPreview, setEdgeDraftPreview] = useState<{ x: number; y: number } | null>(null)
  const [panning, setPanning] = useState<{ startClientX: number; startClientY: number; startX: number; startY: number } | null>(
    null,
  )
  const [trafficRps, setTrafficRps] = useState<number[]>([420])
  const [chaosLevel, setChaosLevel] = useState<number[]>([12])
  const [running, setRunning] = useState(false)
  const [tickCount, setTickCount] = useState(0)
  const [metrics, setMetrics] = useState<SimulationMetrics>(defaultMetrics)
  const [latencyHistory, setLatencyHistory] = useState<number[]>([])
  const [feedbackFocus, setFeedbackFocus] = useState("")
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState<string | null>(null)
  const [feedbackTips, setFeedbackTips] = useState<string[]>([])
  const [feedbackRequestedAt, setFeedbackRequestedAt] = useState<number | null>(null)

  const canvasHeight = CANVAS_MIN_HEIGHT

  const latencySeries = useMemo(() => latencyHistory.slice(-28), [latencyHistory])
  const targetedCritiqueContext = useMemo(
    () => buildArchitectureCritique(nodes, edges, trafficRps[0], chaosLevel[0]),
    [chaosLevel, edges, nodes, trafficRps],
  )

  const feedbackContext = useMemo(() => {
    const nodeLines = nodes.map((node) => {
      const runtime = metrics.nodeStats[node.id]
      return `- ${node.label} (${node.typeId}): cap ${node.capacityRps} rps, base ${node.baseLatencyMs} ms, now ${Math.round(runtime?.rps || 0)} rps @ ${Math.round(runtime?.latencyMs || 0)} ms, util ${Math.round((runtime?.utilization || 0) * 100)}%`
    })

    const edgeLines = edges.map((edge) => {
      const fromNode = nodes.find((node) => node.id === edge.from)
      const toNode = nodes.find((node) => node.id === edge.to)
      const flow = metrics.edgeFlow[edgeRuntimeKey(edge.from, edge.to)] || 0
      return `- ${fromNode?.label || edge.from} -> ${toNode?.label || edge.to}: ${Math.round(flow)} r/s`
    })

    const hotspotText = metrics.hotspots.length > 0 ? metrics.hotspots.join(", ") : "None"

    return [
      "Architecture Snapshot",
      `Nodes (${nodes.length}):`,
      ...nodeLines,
      `Wires (${edges.length}):`,
      ...edgeLines,
      `Telemetry: throughput ${Math.round(metrics.totalRps)} req/s, avg latency ${Math.round(metrics.avgLatencyMs)} ms, success ${metrics.successRate.toFixed(1)}%, hotspots: ${hotspotText}`,
      `Simulation settings: load ${trafficRps[0]} req/s, chaos ${chaosLevel[0]}%, running ${running ? "yes" : "no"}`,
      "",
      targetedCritiqueContext,
    ].join("\n")
  }, [chaosLevel, edges, metrics, nodes, running, targetedCritiqueContext, trafficRps])

  const latencyChart = useMemo(() => {
    if (latencySeries.length === 0) {
      return {
        min: 0,
        max: 0,
        latest: 0,
        previous: 0,
        delta: 0,
        linePath: "",
        areaPath: "",
      }
    }

    const latest = latencySeries[latencySeries.length - 1]
    const previous = latencySeries[Math.max(0, latencySeries.length - 2)]
    const delta = latest - previous
    const min = Math.min(...latencySeries)
    const max = Math.max(...latencySeries)
    const range = Math.max(8, max - min)

    const chartWidth = 320
    const chartHeight = 120
    const leftPad = 10
    const topPad = 10
    const rightPad = 10
    const bottomPad = 14
    const usableWidth = chartWidth - leftPad - rightPad
    const usableHeight = chartHeight - topPad - bottomPad

    const points = latencySeries.map((value, index) => {
      const x = latencySeries.length === 1 ? leftPad + usableWidth : leftPad + (index / (latencySeries.length - 1)) * usableWidth
      const y = topPad + (1 - (value - min) / range) * usableHeight
      return { x, y }
    })

    const linePath = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(" ")

    const first = points[0]
    const last = points[points.length - 1]
    const areaPath = `${linePath} L ${last.x.toFixed(1)} ${(chartHeight - bottomPad).toFixed(1)} L ${first.x.toFixed(1)} ${(chartHeight - bottomPad).toFixed(1)} Z`

    return {
      min,
      max,
      latest,
      previous,
      delta,
      linePath,
      areaPath,
    }
  }, [latencySeries])

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return null
      const worldX = (clientX - rect.left - viewport.x) / viewport.scale
      const worldY = (clientY - rect.top - viewport.y) / viewport.scale
      return { x: worldX, y: worldY }
    },
    [viewport],
  )

  const removeNode = useCallback(() => {
    if (!selectedNodeId) return
    setNodes((current) => current.filter((node) => node.id !== selectedNodeId))
    setEdges((current) => current.filter((edge) => edge.from !== selectedNodeId && edge.to !== selectedNodeId))
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setSourceNodeId(null)
  }, [selectedNodeId])

  const removeSelectedEdge = useCallback(() => {
    if (!selectedEdgeId) return
    setEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId))
    setSelectedEdgeId(null)
  }, [selectedEdgeId])

  const requestAIFeedback = useCallback(async () => {
    if (feedbackLoading) return

    const focus = feedbackFocus.trim()
    const learnerFocus = focus || "overall reliability and scalability"
    const userQuestion = `Please review my current system design and give practical feedback for ${learnerFocus}.`
    const mentorContext = [
      "You are coaching a learner through system design by-doing.",
      "Keep feedback practical and specific to this architecture.",
      "Use the rule-based critique section as factual grounding and directly call out wrong additions and missing components.",
      "Output sections in this exact order:",
      "1) Architecture Grade (A-F with one sentence)",
      "2) What Works (max 3 bullets)",
      "3) Wrong or Risky Additions (max 5 bullets: include exact node/wire name + why it is wrong + fix)",
      "4) Missing Components (max 4 bullets: what is missing + where to place it + expected impact)",
      "5) Wiring and Flow Problems (max 4 bullets: path-level issue + corrected path)",
      "6) Prioritized Action Plan (top 3 steps in order; each step starts with P1/P2/P3)",
      "7) One Small Experiment (a 5-minute change the learner can do now, with expected metric change)",
      "",
      feedbackContext,
    ].join("\n")

    setFeedbackLoading(true)
    setFeedbackError(null)

    try {
      const response = await fetch("/api/mentor/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_question: userQuestion,
          context: mentorContext,
        }),
      })

      if (!response.ok) {
        throw new Error(`AI feedback failed with status ${response.status}`)
      }

      const data = (await response.json()) as MentorResponse
      setFeedbackText(normalizeFeedbackMarkdown(data.response || "No feedback returned."))
      setFeedbackTips(Array.isArray(data.relevant_tips) ? data.relevant_tips : [])
      setFeedbackRequestedAt(Date.now())
    } catch (error) {
      console.error("Failed to fetch AI system design feedback", error)
      setFeedbackError("Unable to get AI feedback right now. Ensure the backend mentor service is running.")
    } finally {
      setFeedbackLoading(false)
    }
  }, [feedbackContext, feedbackFocus, feedbackLoading])

  const findNodeAtWorld = useCallback(
    (worldX: number, worldY: number) => {
      for (let index = nodes.length - 1; index >= 0; index -= 1) {
        const node = nodes[index]
        const insideX = worldX >= node.x && worldX <= node.x + NODE_WIDTH
        const insideY = worldY >= node.y && worldY <= node.y + NODE_HEIGHT
        if (insideX && insideY) return node
      }
      return null
    },
    [nodes],
  )

  const handleCanvasDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const nodeType = event.dataTransfer.getData("application/momentum-node-type")
      const definition = getNodeDef(nodeType)
      const worldPoint = screenToWorld(event.clientX, event.clientY)
      if (!definition || !worldPoint) return

      const x = worldPoint.x - NODE_WIDTH / 2
      const y = worldPoint.y - NODE_HEIGHT / 2
      const id = `n-${definition.id}-${Date.now()}`

      setNodes((current) => [
        ...current,
        {
          id,
          typeId: definition.id,
          label: definition.label,
          x,
          y,
          baseLatencyMs: definition.baseLatencyMs,
          capacityRps: definition.capacityRps,
        },
      ])
      setSelectedNodeId(id)
      setSelectedEdgeId(null)
      setSourceNodeId(id)
      setMode("connect")
    },
    [screenToWorld],
  )

  const handleNodeInteract = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>, nodeId: string) => {
      event.stopPropagation()

      if (mode === "connect") {
        event.preventDefault()
        if (!sourceNodeId) {
          setSourceNodeId(nodeId)
          return
        }

        if (sourceNodeId !== nodeId) {
          const newEdgeId = `e-${sourceNodeId}-${nodeId}`
          setEdges((current) => {
            if (current.some((edge) => edge.from === sourceNodeId && edge.to === nodeId)) {
              return current
            }
            return [...current, { id: newEdgeId, from: sourceNodeId, to: nodeId }]
          })
        }

        setSourceNodeId(null)
        return
      }

      const node = nodes.find((item) => item.id === nodeId)
      const worldPoint = screenToWorld(event.clientX, event.clientY)
      if (!node || !worldPoint) return

      setSelectedNodeId(nodeId)
      setSelectedEdgeId(null)
      setDragging({
        nodeId,
        offsetX: worldPoint.x - node.x,
        offsetY: worldPoint.y - node.y,
      })
    },
    [mode, nodes, screenToWorld, sourceNodeId],
  )

  const handleCanvasMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.button !== 0 || mode !== "move") return
      if (event.target !== event.currentTarget) return

      setSelectedNodeId(null)
      setSelectedEdgeId(null)
      setPanning({
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: viewport.x,
        startY: viewport.y,
      })
    },
    [mode, viewport.x, viewport.y],
  )

  const zoomAtPoint = useCallback((clientX: number, clientY: number, nextScale: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    setViewport((current) => {
      const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE)
      const worldX = (clientX - rect.left - current.x) / current.scale
      const worldY = (clientY - rect.top - current.y) / current.scale

      return {
        x: clientX - rect.left - worldX * clampedScale,
        y: clientY - rect.top - worldY * clampedScale,
        scale: clampedScale,
      }
    })
  }, [])

  const handleCanvasWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault()
      const factor = event.deltaY < 0 ? 1.08 : 0.92
      zoomAtPoint(event.clientX, event.clientY, viewport.scale * factor)
    },
    [viewport.scale, zoomAtPoint],
  )

  const fitToView = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    if (nodes.length === 0) {
      setViewport({ x: rect.width / 2, y: rect.height / 2, scale: 1 })
      return
    }

    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    nodes.forEach((node) => {
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x + NODE_WIDTH)
      maxY = Math.max(maxY, node.y + NODE_HEIGHT)
    })

    const width = Math.max(220, maxX - minX)
    const height = Math.max(180, maxY - minY)
    const padding = 120
    const scaleX = (rect.width - padding) / width
    const scaleY = (rect.height - padding) / height
    const nextScale = clamp(Math.min(scaleX, scaleY), MIN_SCALE, 1.4)

    const centerX = minX + width / 2
    const centerY = minY + height / 2

    setViewport({
      x: rect.width / 2 - centerX * nextScale,
      y: rect.height / 2 - centerY * nextScale,
      scale: nextScale,
    })
  }, [nodes])

  useEffect(() => {
    if (!dragging && !panning && !rewiring && !edgeDraft) return

    const onMouseMove = (event: MouseEvent) => {
      if (dragging) {
        const worldPoint = screenToWorld(event.clientX, event.clientY)
        if (!worldPoint) return
        const nextX = worldPoint.x - dragging.offsetX
        const nextY = worldPoint.y - dragging.offsetY

        setNodes((current) =>
          current.map((node) => (node.id === dragging.nodeId ? { ...node, x: nextX, y: nextY } : node)),
        )
      }

      if (panning) {
        setViewport((current) => ({
          ...current,
          x: panning.startX + (event.clientX - panning.startClientX),
          y: panning.startY + (event.clientY - panning.startClientY),
        }))
      }

      if (rewiring) {
        const worldPoint = screenToWorld(event.clientX, event.clientY)
        if (!worldPoint) return
        setRewirePreview(worldPoint)
      }

      if (edgeDraft) {
        const worldPoint = screenToWorld(event.clientX, event.clientY)
        if (!worldPoint) return
        setEdgeDraftPreview(worldPoint)
      }
    }

    const onMouseUp = (event: MouseEvent) => {
      if (rewiring) {
        const worldPoint = screenToWorld(event.clientX, event.clientY)
        const targetNode = worldPoint ? findNodeAtWorld(worldPoint.x, worldPoint.y) : null
        const currentEdge = edges.find((edge) => edge.id === rewiring.edgeId)

        if (targetNode && currentEdge) {
          const otherEndpointId = rewiring.endpoint === "from" ? currentEdge.to : currentEdge.from
          const isSameEndpoint = targetNode.id === otherEndpointId

          if (!isSameEndpoint) {
            setEdges((current) =>
              current.map((edge) => {
                if (edge.id !== rewiring.edgeId) return edge
                const nextEdge =
                  rewiring.endpoint === "from" ? { ...edge, from: targetNode.id } : { ...edge, to: targetNode.id }
                return nextEdge
              }),
            )
          }
        }

        setRewiring(null)
        setRewirePreview(null)
      }

      if (edgeDraft) {
        const worldPoint = screenToWorld(event.clientX, event.clientY)
        const targetNode = worldPoint ? findNodeAtWorld(worldPoint.x, worldPoint.y) : null

        if (targetNode && targetNode.id !== edgeDraft.fromNodeId) {
          const fromNodeId = edgeDraft.fromNodeId
          const toNodeId = targetNode.id
          const newEdgeId = `e-${fromNodeId}-${toNodeId}`

          setEdges((current) => {
            if (current.some((edge) => edge.from === fromNodeId && edge.to === toNodeId)) {
              return current
            }
            return [...current, { id: newEdgeId, from: fromNodeId, to: toNodeId }]
          })
          setSelectedEdgeId(newEdgeId)
          setSelectedNodeId(null)
          setSourceNodeId(null)
          setMode("move")
        }

        setEdgeDraft(null)
        setEdgeDraftPreview(null)
      }

      setDragging(null)
      setPanning(null)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [dragging, edgeDraft, edges, findNodeAtWorld, panning, rewiring, screenToWorld])

  const runTick = useCallback(() => {
    if (nodes.length === 0) {
      setMetrics(defaultMetrics)
      setLatencyHistory([])
      return
    }

    const incoming: Record<string, number> = {}
    const outgoing: Record<string, string[]> = {}
    edges.forEach((edge) => {
      incoming[edge.to] = (incoming[edge.to] || 0) + 1
      outgoing[edge.from] = [...(outgoing[edge.from] || []), edge.to]
    })

    const roots = nodes.filter((node) => !incoming[node.id]).map((node) => node.id)
    const entryNodes = roots.length > 0 ? roots : [nodes[0].id]
    const baseTraffic = trafficRps[0] * (0.9 + Math.random() * 0.2)
    const chaosPenalty = chaosLevel[0] / 100

    const nodeLoad: Record<string, number> = {}
    const edgeFlow: Record<string, number> = {}
    entryNodes.forEach((nodeId) => {
      nodeLoad[nodeId] = (nodeLoad[nodeId] || 0) + baseTraffic / entryNodes.length
    })

    const queue = [...entryNodes]
    const visitBudget: Record<string, number> = {}

    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) continue

      visitBudget[current] = (visitBudget[current] || 0) + 1
      if (visitBudget[current] > nodes.length + 1) continue

      const fanOut = outgoing[current] || []
      if (fanOut.length === 0) continue

      const currentLoad = nodeLoad[current] || 0
      const distributed = currentLoad * (0.93 + Math.random() * 0.08)
      const share = distributed / fanOut.length

      fanOut.forEach((target) => {
        nodeLoad[target] = (nodeLoad[target] || 0) + share
        const edgeId = edgeRuntimeKey(current, target)
        edgeFlow[edgeId] = (edgeFlow[edgeId] || 0) + share
        queue.push(target)
      })
    }

    const nodeStats: Record<string, NodeRuntimeStats> = {}
    let weightedLatency = 0
    let weightedDrop = 0
    let seenTraffic = 0

    nodes.forEach((node) => {
      const rps = nodeLoad[node.id] || 0
      const utilization = rps / node.capacityRps
      const overload = Math.max(0, utilization - 1)
      const jitter = 0.94 + Math.random() * 0.18
      const chaosBump = chaosPenalty * 18 * Math.random()
      const latencyMs = node.baseLatencyMs * (1 + utilization * utilization * 1.45) * jitter + chaosBump
      const dropProbability = Math.min(0.52, overload * 0.48 + chaosPenalty * 0.08)
      const health = clamp(100 - overload * 92 - chaosPenalty * 28 + Math.random() * 6, 6, 100)

      weightedLatency += latencyMs * Math.max(rps, 1)
      weightedDrop += dropProbability * Math.max(rps, 1)
      seenTraffic += Math.max(rps, 1)

      nodeStats[node.id] = {
        rps,
        utilization,
        latencyMs,
        health,
      }
    })

    const avgLatencyMs = seenTraffic > 0 ? weightedLatency / seenTraffic : 0
    const successRate = seenTraffic > 0 ? clamp(100 - (weightedDrop / seenTraffic) * 100, 52, 100) : 100
    const hotspots = nodes
      .filter((node) => {
        const utilization = nodeStats[node.id]?.utilization ?? 0
        return utilization >= 0.9
      })
      .sort((a, b) => (nodeStats[b.id]?.utilization ?? 0) - (nodeStats[a.id]?.utilization ?? 0))
      .map((node) => node.label)

    setMetrics({
      totalRps: baseTraffic,
      avgLatencyMs,
      successRate,
      hotspots,
      nodeStats,
      edgeFlow,
    })

    setLatencyHistory((history) => [...history.slice(-23), avgLatencyMs])
    setTickCount((count) => count + 1)
  }, [chaosLevel, edges, nodes, trafficRps])

  useEffect(() => {
    if (!running) return
    runTick()
    const id = window.setInterval(runTick, 1050)
    return () => window.clearInterval(id)
  }, [runTick, running])

  const resetBlueprint = () => {
    setNodes(starterNodes)
    setEdges(starterEdges)
    setViewport({ x: 80, y: 20, scale: 1 })
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setSourceNodeId(null)
    setMetrics(defaultMetrics)
    setLatencyHistory([])
    setTickCount(0)
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/40">
        <CardHeader className="border-b border-border/40 bg-gradient-to-r from-primary/15 via-secondary/10 to-transparent py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-wide">
                Interactive Lab
              </Badge>
              <CardTitle className="text-2xl md:text-3xl">System Design Simulator</CardTitle>
              <CardDescription className="max-w-3xl text-sm md:text-base">
                Drag infrastructure blocks, wire service dependencies, and stress test your architecture with live traffic.
                Learn where bottlenecks appear and how topology changes reliability.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={mode === "move" ? "default" : "outline"}
                onClick={() => {
                  setMode("move")
                  setSourceNodeId(null)
                }}
                className="gap-2"
              >
                <Move className="h-4 w-4" /> Move
              </Button>
              <Button
                variant={mode === "connect" ? "default" : "outline"}
                onClick={() => setMode("connect")}
                className="gap-2"
              >
                <Link className="h-4 w-4" /> Connect
              </Button>
              <Button
                variant={running ? "secondary" : "default"}
                onClick={() => setRunning((value) => !value)}
                className="gap-2"
              >
                <Play className="h-4 w-4" /> {running ? "Pause" : "Run Simulation"}
              </Button>
              <Button variant="outline" onClick={fitToView} className="gap-2">
                <Network className="h-4 w-4" /> Fit View
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[290px_1fr]">
            <section className="space-y-4">
              <div className="rounded-2xl border border-border/45 bg-card/55 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Architecture Blocks</p>
                <div className="mt-3 space-y-2">
                  {nodePalette.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("application/momentum-node-type", item.id)
                        }}
                        className={`w-full rounded-xl border border-border/50 bg-gradient-to-br ${item.colorClass} p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg`}
                        type="button"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-background/70 p-2">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border/45 bg-card/55 p-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Load Profile</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>Traffic</span>
                    <span className="font-semibold">{trafficRps[0]} req/s</span>
                  </div>
                  <Slider value={trafficRps} min={60} max={1800} step={20} onValueChange={setTrafficRps} className="mt-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Chaos</span>
                    <span className="font-semibold">{chaosLevel[0]}%</span>
                  </div>
                  <Slider value={chaosLevel} min={0} max={45} step={1} onValueChange={setChaosLevel} className="mt-2" />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={resetBlueprint} className="gap-2">
                    <RotateCcw className="h-4 w-4" /> Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNodes([])
                      setEdges([])
                      setSelectedNodeId(null)
                      setSelectedEdgeId(null)
                      setSourceNodeId(null)
                    }}
                    className="gap-2"
                  >
                    <Eraser className="h-4 w-4" /> Clear
                  </Button>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={feedbackLoading || nodes.length === 0}
                  onClick={requestAIFeedback}
                  className="w-full gap-2"
                >
                  {feedbackLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  {feedbackLoading ? "Reviewing Design..." : "Get AI Design Feedback"}
                </Button>
              </div>

              <div className="rounded-2xl border border-border/45 bg-card/55 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="h-4 w-4 text-primary" /> Simulation Telemetry
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-border/40 bg-background/70 p-2">
                    <p className="text-muted-foreground">Throughput</p>
                    <p className="mt-1 text-sm font-semibold">{Math.round(metrics.totalRps)} req/s</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/70 p-2">
                    <p className="text-muted-foreground">Latency</p>
                    <p className="mt-1 text-sm font-semibold">{Math.round(metrics.avgLatencyMs)} ms</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/70 p-2">
                    <p className="text-muted-foreground">Success</p>
                    <p className="mt-1 text-sm font-semibold">{metrics.successRate.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/70 p-2">
                    <p className="text-muted-foreground">Ticks</p>
                    <p className="mt-1 text-sm font-semibold">{tickCount}</p>
                  </div>
                </div>

                <div className="pt-1">
                  <p className="text-xs text-muted-foreground">Hotspots</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {metrics.hotspots.length === 0 && <Badge variant="outline">Stable</Badge>}
                    {metrics.hotspots.map((hotspot) => (
                      <Badge key={hotspot} variant="destructive" className="rounded-full">
                        {hotspot}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div
                ref={canvasRef}
                className="relative w-full overflow-hidden rounded-[1.4rem] border border-border/40 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.09),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.08),transparent_40%),linear-gradient(140deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]"
                style={{ minHeight: canvasHeight }}
                onMouseDown={handleCanvasMouseDown}
                onWheel={handleCanvasWheel}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleCanvasDrop}
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(148,163,184,0.13) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.13) 1px, transparent 1px)",
                    backgroundSize: `${44 * viewport.scale}px ${44 * viewport.scale}px`,
                    backgroundPosition: `${viewport.x}px ${viewport.y}px`,
                  }}
                />

                <div
                  className="absolute left-0 top-0"
                  style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                    transformOrigin: "0 0",
                    width: "1px",
                    height: "1px",
                  }}
                >
                  <svg className="absolute left-0 top-0 overflow-visible">
                    {edges.map((edge) => {
                      const source = nodes.find((node) => node.id === edge.from)
                      const target = nodes.find((node) => node.id === edge.to)
                      if (!source || !target) return null

                      const x1 = source.x + NODE_WIDTH
                      const y1 = source.y + NODE_HEIGHT / 2
                      const x2 = target.x
                      const y2 = target.y + NODE_HEIGHT / 2
                      const bend = Math.max(60, Math.abs(x2 - x1) / 2)
                      const path = `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`
                      const edgeTraffic = metrics.edgeFlow[edgeRuntimeKey(edge.from, edge.to)] || 0
                      const isSelected = edge.id === selectedEdgeId

                      const startHandle = rewiring?.edgeId === edge.id && rewiring.endpoint === "from" && rewirePreview
                        ? rewirePreview
                        : { x: x1, y: y1 }
                      const endHandle = rewiring?.edgeId === edge.id && rewiring.endpoint === "to" && rewirePreview
                        ? rewirePreview
                        : { x: x2, y: y2 }

                      const handlePath = `M ${startHandle.x} ${startHandle.y} C ${startHandle.x + bend} ${startHandle.y}, ${endHandle.x - bend} ${endHandle.y}, ${endHandle.x} ${endHandle.y}`

                      return (
                        <g key={edge.id}>
                          <path
                            d={handlePath}
                            fill="none"
                            stroke="transparent"
                            strokeWidth={18}
                            onMouseDown={(event) => {
                              event.stopPropagation()
                              setSelectedEdgeId(edge.id)
                              setSelectedNodeId(null)
                              setSourceNodeId(null)
                            }}
                            className="cursor-pointer"
                          />
                          <path
                            d={handlePath}
                            fill="none"
                            stroke={isSelected ? "oklch(0.68 0.19 230 / 0.95)" : "oklch(0.65 0.07 210 / 0.5)"}
                            strokeWidth={isSelected ? 3 : 2}
                            strokeDasharray={running ? "8 6" : "0"}
                            className={running ? "animate-[dash-flow_1.1s_linear_infinite]" : ""}
                          />
                          <text
                            x={(x1 + x2) / 2}
                            y={(y1 + y2) / 2 - 8}
                            className="pointer-events-none fill-muted-foreground text-[10px]"
                            textAnchor="middle"
                          >
                            {Math.round(edgeTraffic)} r/s
                          </text>
                          {isSelected && (
                            <>
                              <circle
                                cx={x1}
                                cy={y1}
                                r={7}
                                fill="oklch(0.66 0.14 225)"
                                stroke="oklch(0.98 0 0 / 0.9)"
                                strokeWidth={1.5}
                                className="cursor-grab"
                                onMouseDown={(event) => {
                                  event.stopPropagation()
                                  setRewiring({ edgeId: edge.id, endpoint: "from" })
                                  setRewirePreview({ x: x1, y: y1 })
                                }}
                              />
                              <circle
                                cx={x2}
                                cy={y2}
                                r={7}
                                fill="oklch(0.66 0.14 225)"
                                stroke="oklch(0.98 0 0 / 0.9)"
                                strokeWidth={1.5}
                                className="cursor-grab"
                                onMouseDown={(event) => {
                                  event.stopPropagation()
                                  setRewiring({ edgeId: edge.id, endpoint: "to" })
                                  setRewirePreview({ x: x2, y: y2 })
                                }}
                              />
                            </>
                          )}
                        </g>
                      )
                    })}

                    {edgeDraft && (() => {
                      const source = nodes.find((node) => node.id === edgeDraft.fromNodeId)
                      if (!source || !edgeDraftPreview) return null

                      const x1 = source.x + NODE_WIDTH
                      const y1 = source.y + NODE_HEIGHT / 2
                      const x2 = edgeDraftPreview.x
                      const y2 = edgeDraftPreview.y
                      const bend = Math.max(60, Math.abs(x2 - x1) / 2)
                      const draftPath = `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`

                      return (
                        <path
                          d={draftPath}
                          fill="none"
                          stroke="oklch(0.75 0.16 210 / 0.92)"
                          strokeWidth={2.2}
                          strokeDasharray="6 6"
                        />
                      )
                    })()}
                  </svg>

                  {nodes.map((node) => {
                    const definition = getNodeDef(node.typeId)
                    if (!definition) return null
                    const Icon = definition.icon
                    const selected = node.id === selectedNodeId
                    const primed = node.id === sourceNodeId
                    const stat = metrics.nodeStats[node.id]
                    const utilization = stat?.utilization ?? 0
                    const health = stat?.health ?? 100

                    return (
                      <button
                        key={node.id}
                        type="button"
                        className={`absolute rounded-2xl border p-3 text-left shadow-md transition active:cursor-grabbing ${
                          selected
                            ? "border-primary/80 bg-primary/10 ring-2 ring-primary/40"
                            : "border-border/50 bg-card/80 hover:border-primary/45"
                        } ${primed ? "ring-2 ring-amber-400" : ""}`}
                        style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
                        onMouseDown={(event) => handleNodeInteract(event, node.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-lg bg-gradient-to-br p-1.5 ${definition.colorClass}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-xs font-semibold">{node.label}</p>
                              <p className="text-[11px] text-muted-foreground">{Math.round(stat?.rps || 0)} r/s</p>
                            </div>
                          </div>
                          {health >= 70 ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-500" />
                          )}
                        </div>

                        <div className="mt-3 space-y-1">
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted/70">
                            <div
                              className={`h-full rounded-full ${utilization < 0.85 ? "bg-emerald-500" : utilization < 1 ? "bg-amber-500" : "bg-rose-500"}`}
                              style={{ width: `${Math.min(100, utilization * 100)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">{Math.round(utilization * 100)}% utilization</p>
                        </div>

                        <span
                          className={`absolute -right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 cursor-crosshair items-center justify-center rounded-full border border-background/70 text-primary-foreground shadow transition ${
                            selected ? "bg-primary" : "bg-primary/80 hover:bg-primary"
                          }`}
                          onMouseDown={(event) => {
                            event.stopPropagation()
                            event.preventDefault()
                            const worldPoint = screenToWorld(event.clientX, event.clientY)
                            if (!worldPoint) return
                            setSelectedNodeId(node.id)
                            setEdgeDraft({ fromNodeId: node.id })
                            setEdgeDraftPreview(worldPoint)
                            setSelectedEdgeId(null)
                            setSourceNodeId(null)
                          }}
                          title="Pull wire"
                        >
                          <Plus className="h-3 w-3" />
                        </span>
                      </button>
                    )
                  })}
                </div>

                {nodes.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                    <Square className="h-8 w-8 text-muted-foreground" />
                    <p className="font-semibold">Drop blocks here to begin</p>
                    <p className="text-sm text-muted-foreground">Design your own architecture and run simulation.</p>
                  </div>
                )}

                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-border/45 bg-background/85 px-2 py-1 text-xs backdrop-blur">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const rect = canvasRef.current?.getBoundingClientRect()
                      if (!rect) return
                      zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, viewport.scale * 1.12)
                    }}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                  <span className="min-w-11 text-center text-[11px] font-semibold">{Math.round(viewport.scale * 100)}%</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const rect = canvasRef.current?.getBoundingClientRect()
                      if (!rect) return
                      zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, viewport.scale * 0.9)
                    }}
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full border border-border/45 bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                  <Plus className="h-3.5 w-3.5" /> Drag blocks in
                  <ArrowRight className="h-3.5 w-3.5" /> {mode === "connect" ? "Click nodes to link or drag node + handle" : "Drag canvas to pan, use node + handle"}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Card className="rounded-2xl border-border/45 py-4">
                  <CardHeader className="px-4 pb-2">
                    <CardTitle className="text-sm">Latency Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4">
                    {latencySeries.length === 0 && (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20">
                        <p className="text-xs text-muted-foreground">Run simulation to populate trend</p>
                      </div>
                    )}

                    {latencySeries.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-semibold tracking-tight">{Math.round(latencyChart.latest)} ms</p>
                          <Badge
                            variant={latencyChart.delta <= 0 ? "secondary" : "destructive"}
                            className="gap-1 rounded-full"
                          >
                            {latencyChart.delta <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                            {latencyChart.delta >= 0 ? "+" : ""}
                            {Math.round(latencyChart.delta)} ms
                          </Badge>
                        </div>

                        <div className="relative h-24 overflow-hidden rounded-xl border border-border/45 bg-gradient-to-b from-primary/5 via-background to-background px-1 py-1">
                          <svg viewBox="0 0 320 120" preserveAspectRatio="none" className="h-full w-full">
                            <defs>
                              <linearGradient id="latencyArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="oklch(0.68 0.18 225 / 0.34)" />
                                <stop offset="100%" stopColor="oklch(0.68 0.18 225 / 0.02)" />
                              </linearGradient>
                            </defs>
                            <line x1="10" y1="14" x2="310" y2="14" stroke="oklch(0.86 0.02 240 / 0.25)" strokeDasharray="3 5" strokeWidth="1" />
                            <line x1="10" y1="106" x2="310" y2="106" stroke="oklch(0.86 0.02 240 / 0.3)" strokeWidth="1" />
                            <path d={latencyChart.areaPath} fill="url(#latencyArea)" />
                            <path
                              d={latencyChart.linePath}
                              fill="none"
                              stroke="oklch(0.66 0.17 223)"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Low: {Math.round(latencyChart.min)} ms</span>
                          <span>High: {Math.round(latencyChart.max)} ms</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/45 py-4">
                  <CardHeader className="px-4 pb-2">
                    <CardTitle className="text-sm">Selected Node</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 text-sm">
                    {!selectedNodeId && <p className="text-muted-foreground">Click a node to inspect and remove it.</p>}
                    {selectedNodeId && (
                      <div className="space-y-2">
                        {(() => {
                          const node = nodes.find((item) => item.id === selectedNodeId)
                          if (!node) return <p className="text-muted-foreground">Node no longer exists.</p>
                          const stat = metrics.nodeStats[node.id]
                          return (
                            <>
                              <p className="font-semibold">{node.label}</p>
                              <p className="text-xs text-muted-foreground">Capacity: {node.capacityRps} req/s</p>
                              <p className="text-xs text-muted-foreground">
                                Runtime: {Math.round(stat?.rps || 0)} req/s, {Math.round(stat?.latencyMs || 0)} ms
                              </p>
                              <Button variant="destructive" size="sm" onClick={removeNode} className="mt-1 gap-2">
                                <Trash2 className="h-4 w-4" /> Remove Node
                              </Button>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/45 py-4">
                  <CardHeader className="px-4 pb-2">
                    <CardTitle className="text-sm">Selected Wire</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 text-sm">
                    {!selectedEdgeId && <p className="text-muted-foreground">Click a wire to retarget endpoints or remove it.</p>}
                    {selectedEdgeId && (
                      <div className="space-y-2">
                        {(() => {
                          const edge = edges.find((item) => item.id === selectedEdgeId)
                          if (!edge) return <p className="text-muted-foreground">Wire no longer exists.</p>
                          const fromNode = nodes.find((item) => item.id === edge.from)
                          const toNode = nodes.find((item) => item.id === edge.to)

                          return (
                            <>
                              <p className="font-semibold">
                                {fromNode?.label || "Unknown"} → {toNode?.label || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">Drag either endpoint handle to another node to shift this wire.</p>
                              <Button variant="destructive" size="sm" onClick={removeSelectedEdge} className="mt-1 gap-2">
                                <Trash2 className="h-4 w-4" /> Remove Wire
                              </Button>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/45 py-4 md:col-span-2">
                  <CardHeader className="px-4 pb-2">
                    <CardTitle className="text-sm">AI Feedback Coach</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-4 text-sm">
                    <label className="space-y-1">
                      <p className="text-xs text-muted-foreground">Optional focus for targeted critique</p>
                      <input
                        value={feedbackFocus}
                        onChange={(event) => setFeedbackFocus(event.target.value)}
                        placeholder="Example: tell me exactly which nodes/wires are wrong for high-write workloads"
                        className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm outline-none ring-primary/40 transition focus:ring-2"
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button onClick={requestAIFeedback} disabled={feedbackLoading || nodes.length === 0} className="gap-2">
                        {feedbackLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                        {feedbackLoading ? "Analyzing Architecture..." : "Request Feedback"}
                      </Button>
                      {feedbackRequestedAt && (
                        <p className="text-xs text-muted-foreground">
                          Last review: {new Date(feedbackRequestedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>

                    {feedbackError && (
                      <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                        {feedbackError}
                      </div>
                    )}

                    {!feedbackText && !feedbackError && (
                      <p className="rounded-lg border border-border/45 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                        Request AI feedback to get exact wrong additions, missing components, wiring fixes, and prioritized next steps.
                      </p>
                    )}

                    {feedbackText && (
                      <div className="space-y-2 rounded-xl border border-border/45 bg-background/70 p-3">
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-headings:my-3 prose-headings:font-semibold prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:font-semibold prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-pre:rounded-lg prose-pre:border prose-pre:border-border/50 prose-pre:bg-muted/40">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: (props) => <h3 className="text-base font-semibold" {...props} />,
                              h2: (props) => <h4 className="text-sm font-semibold" {...props} />,
                              h3: (props) => <h5 className="text-sm font-semibold" {...props} />,
                              p: (props) => <p className="leading-6 text-sm" {...props} />,
                            }}
                          >
                            {feedbackText}
                          </ReactMarkdown>
                        </div>
                        {feedbackTips.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <p className="text-xs font-semibold text-muted-foreground">Quick Tips</p>
                            <div className="flex flex-wrap gap-1.5">
                              {feedbackTips.map((tip, index) => (
                                <Badge key={`${tip}-${index}`} variant="secondary" className="rounded-full">
                                  {tip}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

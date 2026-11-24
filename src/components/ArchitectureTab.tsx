"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type NodeTypes,
} from "@xyflow/react";
import { Button } from "@cloudflare/kumo";
import {
  ArrowSquareOut,
  Play,
  Stop,
  X,
} from "@phosphor-icons/react";
import {
  architectureEdges,
  architectureNodes,
  FLOWS,
  type ArchitectureEdge,
  type ArchitectureFlowNode,
  type ArchitectureNode,
  type FlowId,
} from "@/lib/architecture";
import { ArchitectureLane as ArchitectureLaneComponent } from "./ArchitectureLane";
import { ArchitectureNode as ArchitectureNodeComponent } from "./ArchitectureNode";

const nodeTypes = {
  architecture: ArchitectureNodeComponent,
  lane: ArchitectureLaneComponent,
} as NodeTypes;

type ArchitectureTabProps = {
  isDarkMode: boolean;
};

export function ArchitectureTab({ isDarkMode }: ArchitectureTabProps) {
  const [nodes, , onNodesChange] = useNodesState<ArchitectureNode>(
    architectureNodes,
  );
  const [edges, , onEdgesChange] = useEdgesState<ArchitectureEdge>(
    architectureEdges,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFlow, setActiveFlow] = useState<FlowId | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const activeFlowDef = useMemo(
    () => FLOWS.find((flow) => flow.id === activeFlow) ?? null,
    [activeFlow],
  );

  const activeNodeId = activeFlowDef?.nodeIds[step] ?? null;

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => {
        if (node.type === "lane") return node;
        return {
          ...node,
          data: {
            ...node.data,
            active: node.id === activeNodeId,
            dimmed: Boolean(
              activeFlowDef && !activeFlowDef.nodeIds.includes(node.id),
            ),
          },
        };
      }),
    [nodes, activeNodeId, activeFlowDef],
  );

  const displayEdges = useMemo(
    () =>
      edges.map((edge) => {
        const flows = edge.data?.flows ?? [];
        const inFlow = activeFlowDef ? flows.includes(activeFlowDef.id) : true;
        const isActive = Boolean(
          activeFlowDef &&
            step > 0 &&
            edge.source === activeFlowDef.nodeIds[step - 1] &&
            edge.target === activeFlowDef.nodeIds[step],
        );
        const color = activeFlowDef?.color ?? "#94a3b8";
        return {
          ...edge,
          animated: isActive,
          style: {
            ...edge.style,
            stroke: inFlow ? color : "#94a3b8",
            strokeWidth: isActive ? 2.5 : 1.5,
            opacity: activeFlowDef && !inFlow ? 0.2 : 1,
          },
        };
      }),
    [edges, activeFlowDef, step],
  );

  useEffect(() => {
    if (playing && activeNodeId) {
      setSelectedId(activeNodeId);
    }
  }, [playing, activeNodeId]);

  useEffect(() => {
    if (!playing || !activeFlowDef) return;
    if (step >= activeFlowDef.nodeIds.length - 1) {
      const timer = window.setTimeout(() => setPlaying(false), 900);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setStep((value) => value + 1), 850);
    return () => window.clearTimeout(timer);
  }, [playing, step, activeFlowDef]);

  const startFlow = useCallback((id: FlowId) => {
    const flow = FLOWS.find((item) => item.id === id);
    if (!flow) return;
    setActiveFlow(id);
    setStep(0);
    setPlaying(true);
    setSelectedId(flow.nodeIds[0]);
  }, []);

  const stopFlow = useCallback(() => {
    setPlaying(false);
    setActiveFlow(null);
    setStep(0);
  }, []);

  const selectedNode = useMemo(
    () =>
      nodes.find(
        (node): node is ArchitectureFlowNode =>
          node.type === "architecture" && node.id === selectedId,
      ) ?? null,
    [nodes, selectedId],
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-kumo-line bg-kumo-base lg:flex-row">
      <div className="relative min-h-[420px] flex-1">
        <ReactFlow<ArchitectureNode, ArchitectureEdge>
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => {
            if (node.type === "architecture") setSelectedId(node.id);
          }}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.15}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          className="bg-kumo-canvas"
        >
          <Background
            gap={20}
            size={1}
            color={isDarkMode ? "#334155" : "#cbd5e1"}
          />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) =>
              node.type === "lane" ? "rgba(148, 163, 184, 0.12)" : "#94a3b8"
            }
            maskColor={
              isDarkMode ? "rgba(15, 23, 42, 0.72)" : "rgba(241, 245, 249, 0.72)"
            }
          />
          <Panel
            position="top-left"
            className="flex flex-wrap items-center gap-2 rounded-lg border border-kumo-line bg-kumo-base/90 p-2 backdrop-blur"
          >
            <Button
              variant="secondary"
              size="sm"
              className="gap-1"
              onClick={() => startFlow("standard")}
            >
              <Play weight="fill" className="h-3.5 w-3.5" />
              Standard flow
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1"
              onClick={() => startFlow("agent")}
            >
              <Play weight="fill" className="h-3.5 w-3.5" />
              Agent flow
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => startFlow("observability")}
            >
              <Play weight="fill" className="h-3.5 w-3.5" />
              Logs
            </Button>
            {playing && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={stopFlow}
              >
                <Stop weight="fill" className="h-3.5 w-3.5" />
                Stop
              </Button>
            )}
          </Panel>
          <Panel
            position="top-right"
            className="hidden rounded-lg border border-kumo-line bg-kumo-base/90 px-3 py-2 text-xs backdrop-blur sm:block"
          >
            <p className="mb-1.5 font-medium text-kumo-default">Legend</p>
            <div className="space-y-1 text-kumo-strong">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                Standard chat
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
                Agent chat
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                Logs and insights
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#94a3b8]" />
                Edge controls
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <aside className="flex w-full shrink-0 flex-col border-t border-kumo-line bg-kumo-base lg:w-80 lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between border-b border-kumo-line px-4 py-3">
          <p className="text-sm font-semibold text-kumo-default">
            Component details
          </p>
          {selectedNode && (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-md p-1 text-kumo-subtle transition-colors hover:bg-kumo-recessed hover:text-kumo-default"
              aria-label="Clear selection"
            >
              <X weight="bold" className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {selectedNode ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-kumo-subtle">
                {selectedNode.data.subtitle}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-kumo-default">
                {selectedNode.data.title}
              </h3>
              {selectedNode.data.badges && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedNode.data.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-kumo-recessed px-2 py-0.5 text-[10px] font-medium text-kumo-strong"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-sm leading-relaxed text-kumo-strong">
                {selectedNode.data.details.summary}
              </p>
              <ul className="mt-3 space-y-1.5 pl-4 text-sm leading-relaxed text-kumo-strong">
                {selectedNode.data.details.bullets.map((bullet) => (
                  <li key={bullet} className="list-disc">
                    {bullet}
                  </li>
                ))}
              </ul>
              {selectedNode.data.details.docs && (
                <a
                  href={selectedNode.data.details.docs.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-kumo-link hover:underline"
                >
                  {selectedNode.data.details.docs.label}
                  <ArrowSquareOut weight="bold" className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-kumo-strong">
              <p className="font-medium text-kumo-default">
                Select a component
              </p>
              <p className="mt-1.5">
                Click any node to see what it does and which part of the request
                path it handles.
              </p>
              <div className="mt-4 rounded-lg border border-kumo-line bg-kumo-recessed p-3">
                <p className="text-xs font-medium text-kumo-default">
                  Try a flow
                </p>
                <p className="mt-1 text-xs">
                  Use the buttons above the diagram to animate a standard chat
                  request or an agent chat request.
                </p>
              </div>
              <div className="mt-4 rounded-lg border border-kumo-line p-3">
                <p className="text-xs font-medium text-kumo-default">
                  WAF note
                </p>
                <p className="mt-1 text-xs">
                  The app hostnames use the zone WAF and bot rules. The AI
                  Gateway custom hostname has a scoped skip rule so
                  server-to-server calls are not challenged.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

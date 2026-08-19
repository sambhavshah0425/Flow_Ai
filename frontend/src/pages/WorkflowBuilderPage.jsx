import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '../store/useWorkflowStore';
import { useExecutionStore } from '../store/useExecutionStore';

import { nodeTypes } from '../nodes/nodeTypes';
import { NodeSidebar } from '../components/NodeSidebar';
import { NodeInspector } from '../components/NodeInspector';
import { ExecutionConsole } from '../components/ExecutionConsole';

import { Play, Save, Check, Loader2, ArrowLeft, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function WorkflowBuilderPage() {
  const navigate = useNavigate();
  const {
    nodes: storeNodes,
    edges: storeEdges,
    workflowName,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    setSelectedNodeId,
    saveWorkflow,
    isSaving
  } = useWorkflowStore();

  const { runCurrentWorkflow, isExecuting, subscribeToSocketEvents } = useExecutionStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Sync ReactFlow local nodes/edges with Zustand store
  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges]);

  useEffect(() => {
    subscribeToSocketEvents();
  }, []);

  const onConnect = useCallback((params) => {
    // Color-code branch edges leaving a Condition node's true/false handles
    const branchColor = params.sourceHandle === 'true' ? '#34d399' : params.sourceHandle === 'false' ? '#f43f5e' : undefined;
    const edge = {
      ...params,
      animated: true,
      type: 'smoothstep',
      ...(branchColor && { style: { stroke: branchColor, strokeWidth: 2 } })
    };
    const newEdges = addEdge(edge, edges);
    setEdges(newEdges);
    setStoreEdges(newEdges);
  }, [edges, setEdges, setStoreEdges]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const handleRunWorkflow = async () => {
    // Save state to store first
    setStoreNodes(nodes);
    setStoreEdges(edges);

    const workflowData = {
      name: workflowName,
      nodes,
      edges
    };

    await runCurrentWorkflow(workflowData);
  };

  const handleSaveWorkflow = async () => {
    setStoreNodes(nodes);
    setStoreEdges(edges);
    await saveWorkflow();
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-dark-900 overflow-hidden relative">
      {/* Builder Top Bar */}
      <div className="h-14 bg-dark-800/90 border-b border-dark-700/80 px-4 flex items-center justify-between backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={workflowName}
            onChange={(e) => useWorkflowStore.setState({ workflowName: e.target.value })}
            className="bg-transparent text-sm font-bold text-white focus:outline-none focus:bg-dark-900/60 px-2 py-1 rounded border border-transparent focus:border-dark-700 font-sans"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveWorkflow}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-700 hover:bg-dark-600 text-slate-200 hover:text-white border border-dark-600 flex items-center gap-1.5 transition-all"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'Saving...' : 'Save Workflow'}
          </button>

          <button
            onClick={handleRunWorkflow}
            disabled={isExecuting}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
          >
            {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isExecuting ? 'Executing...' : 'Run Workflow'}
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Node Sidebar */}
        <NodeSidebar />

        {/* Center ReactFlow Canvas */}
        <div className="flex-1 h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-dark-900"
          >
            <Background color="#374151" gap={20} size={1} />
            <Controls className="!bg-dark-800 !border-dark-700 !fill-slate-200" />
            <MiniMap className="!bg-dark-800/80 !border-dark-700" nodeColor="#3b82f6" />
          </ReactFlow>
        </div>

        {/* Right Node Inspector */}
        <NodeInspector />
      </div>

      {/* Bottom Execution Console Drawer */}
      <ExecutionConsole nodes={nodes} />
    </div>
  );
}
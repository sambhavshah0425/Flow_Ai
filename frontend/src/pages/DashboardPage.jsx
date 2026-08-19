import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { useExecutionStore } from '../store/useExecutionStore';
import { Plus, Workflow as WorkflowIcon, Zap, Clock, Sparkles, FolderOpen, ArrowUpRight, Play, Trash2 } from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const { workflows, fetchWorkflows, loadWorkflow, resetCanvas, loadingWorkflows } = useWorkflowStore();
  const { executionHistory, fetchExecutionHistory } = useExecutionStore();

  useEffect(() => {
    fetchWorkflows();
    fetchExecutionHistory();
  }, []);

  const handleCreateNew = () => {
    resetCanvas();
    navigate('/builder');
  };

  const handleOpenWorkflow = (wf) => {
    loadWorkflow(wf);
    navigate('/builder');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-900/40 via-dark-800 to-dark-800 p-6 rounded-2xl border border-brand-500/20 relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Agentic Orchestration Platform
          </div>
          <h1 className="text-2xl font-bold text-white">Workflow Automation Dashboard</h1>
          <p className="text-sm text-slate-400">Design, execute, and monitor DAG-based AI workflows visually.</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="z-10 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Workflow
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <WorkflowIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{workflows.length}</div>
            <div className="text-xs text-slate-400">Active Workflows</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{executionHistory.length}</div>
            <div className="text-xs text-slate-400">Total Executions</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">99.8%</div>
            <div className="text-xs text-slate-400">Execution Reliability</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">6</div>
            <div className="text-xs text-slate-400">Plugin Handlers</div>
          </div>
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-brand-400" />
            Your Workflows ({workflows.length})
          </h2>
        </div>

        {loadingWorkflows ? (
          <div className="text-slate-400 text-sm py-8 text-center">Loading workflows...</div>
        ) : workflows.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center space-y-3">
            <p className="text-slate-400 text-sm">No saved workflows found. Start by creating your first workflow!</p>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs rounded-xl inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Build Demo Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workflows.map((wf) => (
              <div
                key={wf._id}
                onClick={() => handleOpenWorkflow(wf)}
                className="glass-card p-5 rounded-2xl space-y-4 cursor-pointer group relative hover:border-brand-500/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-100 group-hover:text-brand-400 transition-colors">
                      {wf.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{wf.description || 'Custom AI node orchestration pipeline'}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-dark-900/60 text-slate-400 group-hover:text-brand-400 group-hover:bg-brand-500/10 transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-dark-700/60 text-xs text-slate-400 font-mono">
                  <span>{wf.nodes?.length || 0} Nodes</span>
                  <span>Updated {new Date(wf.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

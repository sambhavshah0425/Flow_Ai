import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/**
 * Signature hero visual: the actual FlowForge pipeline concept rendered as an
 * animated SVG node graph — real node types, edges between them, and light
 * pulses traveling along the connections. The whole scene tilts/parallaxes
 * with scroll. With prefers-reduced-motion, it renders as a static diagram
 * (no pulses, no float, no scroll-linked transforms).
 */

// ---- Graph definition (mirrors a real workflow: inputs → Gemini → outputs) ----
const NODES = [
  { id: 'text_1',     x: 40,  y: 120, w: 170, h: 64, color: '#0059ff', label: 'Text Input',  sub: 'prompt · {{text_1.text}}',   status: 'done' },
  { id: 'pdf_1',      x: 40,  y: 330, w: 170, h: 64, color: '#4d8cff', label: 'PDF Reader',  sub: '11 pages extracted',          status: 'done' },
  { id: 'gemini_1',   x: 360, y: 225, w: 200, h: 76, color: '#7aa7ff', label: 'Gemini AI',   sub: 'Summarize {{pdf_1.text}}',    status: 'running' },
  { id: 'api_1',      x: 700, y: 70,  w: 180, h: 64, color: '#0059ff', label: 'REST API',    sub: 'POST /notify · 200 OK',       status: 'queued' },
  { id: 'delay_1',    x: 700, y: 245, w: 180, h: 64, color: '#4d8cff', label: 'Delay Timer', sub: 'wait 1900 ms',                status: 'queued' },
  { id: 'download_1', x: 700, y: 420, w: 180, h: 64, color: '#7aa7ff', label: 'Download',    sub: 'ai_summary.txt',              status: 'queued' }
];

const EDGES = [
  { id: 'edge-text-gemini',   d: 'M210,152 C300,152 270,263 360,263', dur: '2.6s', begin: '0s' },
  { id: 'edge-pdf-gemini',    d: 'M210,362 C300,362 270,263 360,263', dur: '2.6s', begin: '0.9s' },
  { id: 'edge-gemini-api',    d: 'M560,263 C645,263 615,102 700,102', dur: '2.2s', begin: '0.4s' },
  { id: 'edge-gemini-delay',  d: 'M560,263 C645,263 615,277 700,277', dur: '2.2s', begin: '1.3s' },
  { id: 'edge-delay-download',d: 'M790,309 C790,355 790,375 790,420', dur: '1.8s', begin: '0.6s' }
];

const STATUS_STYLE = {
  done:    { fill: '#4d8cff', text: 'Done' },
  running: { fill: '#0059ff', text: 'Running' },
  queued:  { fill: '#4a5a7a', text: 'Queued' }
};

function NodeChip({ node, animate }) {
  const status = STATUS_STYLE[node.status];
  return (
    <g className={animate ? 'ff-float' : undefined} style={animate ? { animationDelay: `${(node.x + node.y) % 5 * 0.35}s` } : undefined}>
      {/* Card */}
      <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="14" fill="rgba(4,26,83,0.92)" stroke={node.color} strokeOpacity="0.55" strokeWidth="1.5" />
      {node.status === 'running' && (
        <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="14" fill="none" stroke={node.color} strokeOpacity="0.35" strokeWidth="5" className={animate ? 'ff-ring' : undefined} />
      )}
      {/* Type dot */}
      <circle cx={node.x + 22} cy={node.y + 24} r="6" fill={node.color} fillOpacity="0.9" />
      <circle cx={node.x + 22} cy={node.y + 24} r="11" fill={node.color} fillOpacity="0.15" />
      {/* Labels */}
      <text x={node.x + 40} y={node.y + 29} fill="#f1f5f9" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">{node.label}</text>
      <text x={node.x + 22 - 6} y={node.y + 50} fill="#94a3b8" fontSize="10.5" fontFamily="'JetBrains Mono', monospace">{node.sub}</text>
      {/* Status badge */}
      <g>
        <circle cx={node.x + node.w - 52} cy={node.y + 22} r="3.5" fill={status.fill} className={animate && node.status === 'running' ? 'ff-blink' : undefined} />
        <text x={node.x + node.w - 44} y={node.y + 26} fill={status.fill} fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">{status.text}</text>
      </g>
      {/* Ports */}
      <circle cx={node.x} cy={node.y + node.h / 2} r="4" fill="#0059ff" stroke="#030923" strokeWidth="2" />
      <circle cx={node.x + node.w} cy={node.y + node.h / 2} r="4" fill="#0059ff" stroke="#030923" strokeWidth="2" />
    </g>
  );
}

export default function NodeNetwork() {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [10, -6]);
  const yShift = useTransform(scrollYProgress, [0, 1], [30, -40]);

  const animate = !reduceMotion;

  return (
    <div ref={containerRef} style={{ perspective: 1200 }} aria-hidden="false">
      <motion.div
        style={animate ? { rotateX, y: yShift, transformStyle: 'preserve-3d' } : undefined}
        className="relative"
      >
        <svg
          viewBox="0 0 920 560"
          role="img"
          aria-label="Diagram of a FlowForge OS pipeline: Text Input and PDF Reader nodes feed a Gemini AI node, whose output flows to REST API, Delay Timer, and Download nodes, with data pulses traveling along the connections."
          className="w-full h-auto select-none"
        >
          <title>FlowForge OS pipeline in mid-execution</title>
          <defs>
            <linearGradient id="ff-edge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0059ff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#7aa7ff" stopOpacity="0.75" />
            </linearGradient>
            <filter id="ff-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {animate && (
            <style>{`
              .ff-float { animation: ffFloat 7s ease-in-out infinite; }
              @keyframes ffFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
              .ff-dash { stroke-dasharray: 6 8; animation: ffDash 1.2s linear infinite; }
              @keyframes ffDash { to { stroke-dashoffset: -14; } }
              .ff-blink { animation: ffBlink 1.4s ease-in-out infinite; }
              @keyframes ffBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
              .ff-ring { animation: ffRing 2s ease-in-out infinite; }
              @keyframes ffRing { 0%,100% { stroke-opacity: 0.1; } 50% { stroke-opacity: 0.45; } }
            `}</style>
          )}

          {/* Edges */}
          {EDGES.map((edge) => (
            <g key={edge.id}>
              <path id={edge.id} d={edge.d} fill="none" stroke="url(#ff-edge)" strokeWidth="2" className={animate ? 'ff-dash' : undefined} opacity="0.85" />
              {/* Traveling data pulse */}
              {animate && (
                <circle r="4.5" fill="#4d8cff" filter="url(#ff-glow)">
                  <animateMotion dur={edge.dur} begin={edge.begin} repeatCount="indefinite" rotate="none">
                    <mpath href={`#${edge.id}`} />
                  </animateMotion>
                </circle>
              )}
            </g>
          ))}

          {/* Nodes */}
          {NODES.map((node) => (
            <NodeChip key={node.id} node={node} animate={animate} />
          ))}
        </svg>
      </motion.div>
    </div>
  );
}

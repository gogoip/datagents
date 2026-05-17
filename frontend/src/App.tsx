import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  ChevronLeft,
  CircleDot,
  Database,
  Factory,
  FileCheck2,
  GitBranch,
  GripVertical,
  LineChart,
  MessageSquare,
  Play,
  Plus,
  Search,
  Send,
  ShieldCheck,
  ShoppingCart,
  Trash2,
} from 'lucide-react';

type AgentCatalogItem = {
  id: string;
  name: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
};

type NodeStatus = 'idle' | 'researching' | 'talking';

type CanvasNode = {
  instanceId: string;
  catalogId: string;
  x: number;
  y: number;
  status: NodeStatus;
  latest: string;
};

type ConversationMessage = {
  from: string;
  to: string;
  text: string;
};

const agentCatalog: AgentCatalogItem[] = [
  {
    id: 'finance',
    name: 'Finance Agent',
    desc: 'Revenue, margin, invoices, cost analytics',
    icon: LineChart,
    color: 'bg-cyan-500',
  },
  {
    id: 'sales',
    name: 'Sales Agent',
    desc: 'Pipeline, conversion, customer trends',
    icon: LineChart,
    color: 'bg-blue-500',
  },
  {
    id: 'purchase',
    name: 'Purchasing Agent',
    desc: 'Orders, vendors, spend, procurement KPIs',
    icon: ShoppingCart,
    color: 'bg-amber-500',
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing Agent',
    desc: 'Production, defects, throughput, downtime',
    icon: Factory,
    color: 'bg-violet-500',
  },
  {
    id: 'data',
    name: 'Data Agent',
    desc: 'Schema discovery, profiling, metadata lookup',
    icon: Database,
    color: 'bg-slate-500',
  },
  {
    id: 'validation',
    name: 'Validation Agent',
    desc: 'DQ checks, anomaly review, rule validation',
    icon: FileCheck2,
    color: 'bg-emerald-500',
  },
  {
    id: 'governance',
    name: 'Governance Agent',
    desc: 'PII, lineage, policy, access checks',
    icon: ShieldCheck,
    color: 'bg-indigo-500',
  },
  {
    id: 'orchestrator',
    name: 'Friday Agent',
    desc: 'Conversation coordinator and task router',
    icon: Bot,
    color: 'bg-sky-500',
  },
];

const seedCanvasAgents: CanvasNode[] = [
  {
    instanceId: 'node-friday',
    catalogId: 'orchestrator',
    x: 190,
    y: 170,
    status: 'idle',
    latest: 'Waiting for user question',
  },
  {
    instanceId: 'node-purchase',
    catalogId: 'purchase',
    x: 560,
    y: 245,
    status: 'researching',
    latest: 'Researching purchase orders',
  },
];

const conversationSeed: ConversationMessage[] = [
  {
    from: 'User',
    to: 'Friday Agent',
    text: 'What is our biggest purchase order?',
  },
  {
    from: 'Friday Agent',
    to: 'Purchasing Agent',
    text: 'Find the largest purchase order and explain the vendor and value.',
  },
  {
    from: 'Purchasing Agent',
    to: 'Data Agent',
    text: 'Query purchase order facts and vendor dimension. Return top order by amount.',
  },
];

function getAgent(catalogId: string) {
  return agentCatalog.find((agent) => agent.id === catalogId) ?? agentCatalog[0];
}

function Button({
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition ${className}`}
    >
      {children}
    </button>
  );
}

function AgentListItem({ agent }: { agent: AgentCatalogItem }) {
  const Icon = agent.icon;

  return (
    <div
      draggable
      onDragStart={(event) => event.dataTransfer.setData('agentId', agent.id)}
      className="group flex cursor-grab items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 hover:border-cyan-500/50 hover:bg-cyan-950/20"
    >
      <GripVertical size={15} className="text-slate-600 group-hover:text-slate-400" />
      <div className={`rounded-xl ${agent.color} p-2 text-white`}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-100">{agent.name}</p>
        <p className="truncate text-xs text-slate-500">{agent.desc}</p>
      </div>
    </div>
  );
}

function Sidebar({ count }: { count: number }) {
  return (
    <aside className="flex h-full flex-col border-r border-slate-800 bg-slate-950 p-4">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-cyan-500/15 p-2 text-cyan-300 ring-1 ring-cyan-500/30">
          <Database size={22} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Data Agent Council</h1>
          <p className="text-xs text-slate-500">Independent enterprise data agents</p>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-200">Available Agents</p>
          <p className="text-xs text-slate-500">Drag agents onto the canvas</p>
        </div>
        <Search size={17} className="text-slate-500" />
      </div>

      <div className="space-y-2 overflow-y-auto pr-1">
        {agentCatalog.map((agent) => (
          <AgentListItem key={agent.id} agent={agent} />
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
        <span className="font-semibold text-cyan-300">{count}</span> agents on canvas
      </div>
    </aside>
  );
}

function CanvasAgentNode({
  node,
  selected,
  onSelect,
  onRemove,
}: {
  node: CanvasNode;
  selected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const agent = getAgent(node.catalogId);
  const Icon = agent.icon;
  const isActive = node.status === 'researching' || node.status === 'talking';

  return (
    <motion.div
      drag
      dragMomentum={false}
      onClick={() => onSelect(node.instanceId)}
      style={{ left: node.x, top: node.y }}
      className={`absolute w-56 cursor-move rounded-3xl border p-4 shadow-2xl backdrop-blur ${
        selected
          ? 'border-cyan-400 bg-cyan-950/40 shadow-cyan-950/50'
          : 'border-slate-700 bg-slate-950/80 shadow-black/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`rounded-2xl ${agent.color} p-2 text-white shadow-lg`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{agent.name}</p>
            <p className="text-xs text-slate-500">Independent agent</p>
          </div>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onRemove(node.instanceId);
          }}
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
        <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
          <CircleDot size={12} className={isActive ? 'text-cyan-300' : 'text-slate-500'} />
          {node.status}
        </div>
        <p className="text-xs leading-relaxed text-slate-300">{node.latest}</p>
      </div>

      {isActive && (
        <div className="absolute -right-3 -top-3 rounded-full bg-cyan-500 px-2 py-1 text-[10px] font-semibold text-slate-950 shadow-lg">
          active
        </div>
      )}
    </motion.div>
  );
}

function AgentCanvas({
  nodes,
  setNodes,
  selectedId,
  setSelectedId,
}: {
  nodes: CanvasNode[];
  setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
  selectedId: string | null;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    const catalogId = event.dataTransfer.getData('agentId');
    if (!catalogId) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const newNode: CanvasNode = {
      instanceId: `${catalogId}-${Date.now()}`,
      catalogId,
      x: event.clientX - rect.left - 110,
      y: event.clientY - rect.top - 40,
      status: 'idle',
      latest: 'Ready to receive or send messages',
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedId(newNode.instanceId);
  };

  const removeNode = (instanceId: string) => {
    setNodes((prev) => prev.filter((node) => node.instanceId !== instanceId));
    if (selectedId === instanceId) {
      setSelectedId(null);
    }
  };

  return (
    <section
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className="relative h-full overflow-hidden rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_center,_rgba(8,145,178,0.13),_rgba(2,6,23,0.35)_35%,_rgba(2,6,23,1)_75%)]"
    >
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:40px_40px]" />

      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <line
          x1="300"
          y1="230"
          x2="610"
          y2="300"
          stroke="rgba(34,211,238,.35)"
          strokeWidth="2"
          strokeDasharray="7 7"
        />
        <line
          x1="300"
          y1="230"
          x2="440"
          y2="470"
          stroke="rgba(34,211,238,.2)"
          strokeWidth="2"
          strokeDasharray="7 7"
        />
      </svg>

      {nodes.map((node) => (
        <CanvasAgentNode
          key={node.instanceId}
          node={node}
          selected={selectedId === node.instanceId}
          onSelect={setSelectedId}
          onRemove={removeNode}
        />
      ))}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-3xl bg-cyan-400 px-7 py-4 text-sm font-semibold text-slate-950 shadow-2xl shadow-cyan-950/50">
        What is our biggest purchase order?
      </div>
    </section>
  );
}

function ConversationPanel({
  selectedNode,
  messages,
  onStart,
}: {
  selectedNode: CanvasNode | undefined;
  messages: ConversationMessage[];
  onStart: () => void;
}) {
  const selectedAgent = selectedNode ? getAgent(selectedNode.catalogId) : null;

  return (
    <aside className="flex h-full flex-col border-l border-slate-800 bg-slate-950 p-4">
      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={19} className="text-cyan-300" />
          <h2 className="text-base font-semibold text-slate-100">Conversation</h2>
        </div>
        <span className="text-xs text-slate-500">{messages.length} messages</span>
      </div>

      <div className="mb-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="mb-1 text-xs font-semibold text-cyan-300">Selected Agent</p>
        <p className="text-sm font-semibold text-slate-100">{selectedAgent?.name ?? 'No agent selected'}</p>
        <p className="mt-1 text-xs text-slate-500">
          {selectedAgent?.desc ?? 'Select any canvas agent to inspect it.'}
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((message, index) => (
          <div key={`${message.from}-${index}`} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-300">{message.from}</span>
              <span className="text-slate-500">to {message.to}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-200">{message.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-900 p-3">
        <textarea
          className="min-h-24 w-full resize-none bg-transparent px-2 py-1 text-sm text-slate-200 outline-none placeholder:text-slate-600"
          placeholder="Ask selected agents to discuss, validate, research, or generate artifacts..."
          defaultValue="What is our biggest purchase order?"
        />
        <div className="mt-2 flex items-center justify-between">
          <Button className="rounded-2xl border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800">
            <Plus size={15} className="mr-2" />
            Attach Context
          </Button>
          <Button onClick={onStart} className="rounded-2xl bg-cyan-500 text-slate-950 hover:bg-cyan-400">
            <Send size={15} className="mr-2" />
            Start Talk
          </Button>
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  const [nodes, setNodes] = useState<CanvasNode[]>(seedCanvasAgents);
  const [selectedId, setSelectedId] = useState<string | null>('node-purchase');
  const [messages, setMessages] = useState<ConversationMessage[]>(conversationSeed);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.instanceId === selectedId),
    [nodes, selectedId],
  );

  const startAgentConversation = () => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.catalogId === 'purchase') {
          return {
            ...node,
            status: 'talking',
            latest: 'Asking Data Agent for purchase order facts',
          };
        }

        if (node.catalogId === 'data') {
          return {
            ...node,
            status: 'researching',
            latest: 'Querying registered data tools',
          };
        }

        if (node.catalogId === 'orchestrator') {
          return {
            ...node,
            status: 'talking',
            latest: 'Coordinating agent discussion',
          };
        }

        return node;
      }),
    );

    setMessages((prev) => [
      ...prev,
      {
        from: 'Data Agent',
        to: 'Purchasing Agent',
        text: 'I found purchase order data. Running aggregation by order amount and vendor.',
      },
      {
        from: 'Purchasing Agent',
        to: 'Friday Agent',
        text: 'I will summarize the highest-value order, vendor, amount, and supporting evidence.',
      },
    ]);
  };

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100">
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950 px-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-300">
            <GitBranch size={19} />
          </div>
          <div>
            <p className="text-sm font-semibold">Data Agent Council</p>
            <p className="text-xs text-slate-500">Multi-agent drag-and-drop workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-5 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> {agentCatalog.length} Agents Connected
          </span>
          <span>Pran</span>
        </div>
      </header>

      <div className="grid h-[calc(100vh-56px)] grid-cols-[330px_1fr_390px]">
        <Sidebar count={nodes.length} />

        <main className="flex flex-col bg-slate-950 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button className="rounded-2xl text-slate-300 hover:bg-slate-900">
                <ChevronLeft size={18} className="mr-2" />
                Back
              </Button>
              <div>
                <h2 className="text-2xl font-semibold text-cyan-300">AI Council</h2>
                <p className="text-sm text-slate-500">
                  Drop independent agents on the canvas. Start a conversation to let them coordinate.
                </p>
              </div>
            </div>

            <Button onClick={startAgentConversation} className="rounded-2xl bg-cyan-500 text-slate-950 hover:bg-cyan-400">
              <Play size={16} className="mr-2" />
              Start Agent Discussion
            </Button>
          </div>

          <AgentCanvas
            nodes={nodes}
            setNodes={setNodes}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        </main>

        <ConversationPanel
          selectedNode={selectedNode}
          messages={messages}
          onStart={startAgentConversation}
        />
      </div>
    </div>
  );
}

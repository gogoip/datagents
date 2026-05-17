import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Code2,
  Database,
  FileUp,
  GitBranch,
  KeyRound,
  Layers3,
  PauseCircle,
  Play,
  Settings2,
  Sparkles,
  TerminalSquare,
  User,
} from 'lucide-react'
import { approve, chat, fetchAgents, stream, uploadFiles } from './api/client'

type StepStatus = 'done' | 'active' | 'pending'

function statusDot(status: StepStatus) {
  const base = 'h-2.5 w-2.5 rounded-full'
  if (status === 'done') return <span className={`${base} bg-emerald-500`} />
  if (status === 'active') return <span className={`${base} bg-blue-500 animate-pulse`} />
  return <span className={`${base} bg-slate-600`} />
}

export default function App() {
  const [agents, setAgents] = useState<any[]>([])
  const [sessionId, setSessionId] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; text: string; approval?: boolean }>>([])
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [status, setStatus] = useState<Record<string, string>>({})
  const [pending, setPending] = useState<string>()
  const [input, setInput] = useState('Describe this data and find quality issues')

  useEffect(() => {
    fetchAgents().then(setAgents)
  }, [])

  const steps = useMemo(() => {
    const hasIntent = messages.some((m) => m.text.toLowerCase().includes('requirement_agent'))
    const hasMetadata = messages.some((m) => m.text.toLowerCase().includes('metadata_agent'))
    const hasDq = messages.some((m) => m.text.toLowerCase().includes('data_quality_agent'))
    return [
      { label: 'Intent', status: hasIntent ? 'done' : 'active' as StepStatus },
      { label: 'MCP Discovery', status: hasMetadata ? 'done' : 'pending' as StepStatus },
      { label: 'Schema Profiling', status: hasDq ? 'done' : 'pending' as StepStatus },
      { label: 'HITL Approval', status: pending ? 'active' : 'pending' as StepStatus },
      { label: 'Generate Code', status: artifacts.some((a) => a.kind === 'code') ? 'done' : 'pending' as StepStatus },
    ]
  }, [messages, pending, artifacts])

  const ensureStream = (sid: string) => {
    const es = stream(sid)
    es.onmessage = (e) => {
      const evt = JSON.parse(e.data)
      if (evt.type === 'agent_started') setStatus((s) => ({ ...s, [evt.agent]: 'thinking' }))
      if (evt.type === 'agent_message') {
        setMessages((m) => [...m, { role: 'agent', text: `${evt.agent}: ${evt.message}` }])
        setStatus((s) => ({ ...s, [evt.agent]: 'done' }))
      }
      if (evt.type === 'artifact_generated') setArtifacts((a) => [...a, evt])
      if (evt.type === 'approval_required') {
        setPending(evt.pending_action)
        setMessages((m) => [...m, { role: 'agent', text: 'Approval required before generating pipeline code.', approval: true }])
      }
      if (evt.type === 'final_response') setMessages((m) => [...m, { role: 'agent', text: `Final: ${evt.message}` }])
    }
  }

  const onUpload = async (files: File[]) => {
    const r = await uploadFiles(files, sessionId || undefined)
    setSessionId(r.session_id)
    ensureStream(r.session_id)
    setMessages((m) => [...m, { role: 'agent', text: `Uploaded ${r.files.length} files for session ${r.session_id}` }])
  }

  const onSend = async () => {
    if (!sessionId) return
    await chat(sessionId, input, selected)
    setMessages((m) => [...m, { role: 'user', text: input }])
  }

  return (
    <div className='h-screen w-full bg-slate-950 text-slate-100'>
      <div className='grid h-full grid-cols-[300px_1fr_360px]'>
        <aside className='h-full border-r border-slate-800 bg-slate-900/70 p-4'>
          <div className='mb-5 flex items-center gap-2'>
            <div className='rounded-2xl bg-cyan-600 p-2 text-white'><Layers3 size={20} /></div>
            <div><h1 className='text-lg font-semibold'>Data Agent Council</h1><p className='text-xs text-slate-400'>LangGraph Agent Console</p></div>
          </div>
          <div className='mb-4 rounded-2xl border border-slate-800 bg-slate-900 p-4'>
            <div className='mb-3 flex items-center gap-2 text-sm font-semibold'><KeyRound size={16} /> Runtime Config</div>
            <div className='space-y-3'>
              <input className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm' placeholder='Mistral API Key' type='password' />
              <input className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm' placeholder='Model: mistral-large-latest' />
            </div>
          </div>
          <div className='mb-4 rounded-2xl border border-slate-800 bg-slate-900 p-4'>
            <div className='mb-3 flex items-center gap-2 text-sm font-semibold'><Database size={16} /> Agents</div>
            <div className='space-y-2 max-h-52 overflow-auto'>
              {agents.map((a) => (
                <button key={a.id} onClick={() => setSelected((s) => s.includes(a.id) ? s : [...s, a.id])} className='flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-left text-sm hover:bg-slate-900'>
                  <span>{a.name}</span><ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>
          <label className='block rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-5 text-center cursor-pointer'>
            <FileUp className='mx-auto mb-2 text-slate-500' size={28} />
            <p className='text-sm font-medium'>Drop files here</p>
            <p className='text-xs text-slate-500'>CSV, JSON, Excel</p>
            <input className='hidden' type='file' multiple onChange={(e) => onUpload(Array.from(e.target.files || []))} />
          </label>
        </aside>

        <main className='flex h-full flex-col bg-slate-950'>
          <header className='border-b border-slate-800 px-5 py-4'>
            <div className='flex items-center justify-between'>
              <div><h2 className='text-xl font-semibold'>Agent Workspace</h2><p className='text-sm text-slate-400'>Streaming reasoning, approvals, and artifact generation</p></div>
              <div className='flex gap-2'>
                <button className='rounded-xl border border-slate-700 px-3 py-2 text-sm'><Settings2 size={16} className='mr-2 inline' />Settings</button>
                <button onClick={onSend} className='rounded-xl bg-cyan-700 px-3 py-2 text-sm'><Play size={16} className='mr-2 inline' />Run</button>
              </div>
            </div>
          </header>
          <section className='border-b border-slate-800 bg-slate-900/60 px-5 py-3'>
            <div className='flex items-center gap-3 overflow-x-auto'>
              {steps.map((step, i) => <div key={step.label} className='flex items-center gap-3 text-sm'><div className='flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5'>{statusDot(step.status)}<span className='whitespace-nowrap'>{step.label}</span></div>{i < steps.length - 1 && <ChevronRight size={14} className='text-slate-500' />}</div>)}
            </div>
          </section>
          <section className='flex-1 overflow-y-auto p-5'>
            <div className='mx-auto max-w-4xl space-y-4'>
              {messages.map((msg, i) => <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>{msg.role === 'agent' && <div className='mt-1 rounded-xl bg-slate-800 p-2 text-white'><Bot size={16} /></div>}<div className={`max-w-[72%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-cyan-700 text-white' : 'border border-slate-700 bg-slate-900 text-slate-100'}`}><p>{msg.text}</p>{msg.approval && pending && <div className='mt-3 flex gap-2'><button onClick={async ()=>{await approve(sessionId,pending);setPending(undefined)}} className='rounded-xl bg-emerald-600 px-2 py-1 text-xs'><CheckCircle2 size={14} className='mr-1 inline' />Approve</button><button className='rounded-xl border border-slate-600 px-2 py-1 text-xs'><PauseCircle size={14} className='mr-1 inline' />Reject</button></div>}</div>{msg.role === 'user' && <div className='mt-1 rounded-xl bg-slate-700 p-2 text-slate-200'><User size={16} /></div>}</div>)}
            </div>
          </section>
          <footer className='border-t border-slate-800 p-4'><div className='mx-auto flex max-w-4xl items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-2'><input value={input} onChange={(e)=>setInput(e.target.value)} className='flex-1 bg-transparent px-3 py-2 text-sm outline-none' placeholder='Ask the agent to inspect data, generate DDL, create pipeline code...' /><button onClick={onSend} className='rounded-xl bg-cyan-700 px-3 py-2 text-sm'><Sparkles size={16} className='mr-2 inline' />Send</button></div></footer>
        </main>

        <aside className='h-full border-l border-slate-800 bg-slate-900/70 p-4'>
          <div className='mb-4 rounded-2xl border border-slate-800 bg-slate-900 p-4'><div className='mb-3 flex items-center gap-2 text-sm font-semibold'><ClipboardList size={16} /> Current Context</div><div className='space-y-2 text-sm text-slate-400'><div className='rounded-xl border border-slate-700 bg-slate-950 p-3'><p className='font-medium text-slate-200'>Intent</p><p>{input}</p></div><div className='rounded-xl border border-slate-700 bg-slate-950 p-3'><p className='font-medium text-slate-200'>Session</p><p>{sessionId || 'No active session'}</p></div></div></div>
          <div className='mb-4 rounded-2xl border border-slate-800 bg-slate-900 p-4'><div className='mb-3 flex items-center gap-2 text-sm font-semibold'><TerminalSquare size={16} /> Tool Trace</div><div className='space-y-2 text-xs font-mono text-slate-400'><div className='rounded-lg border border-slate-700 bg-slate-950 p-2'>/upload → success</div><div className='rounded-lg border border-slate-700 bg-slate-950 p-2'>/chat/stream → connected</div>{pending && <div className='rounded-lg border border-amber-700 bg-amber-950/20 p-2 flex gap-2'><AlertTriangle size={14} />waiting_for_approval</div>}</div></div>
          <div className='mb-4 rounded-2xl border border-slate-800 bg-slate-900 p-4'><div className='mb-3 flex items-center gap-2 text-sm font-semibold'><Code2 size={16} /> Generated Artifacts</div><div className='space-y-2'>{artifacts.map((item, i) => <div key={`${item.name}-${i}`} className='flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-3 py-2'><div><p className='text-sm font-medium text-slate-200'>{item.name}</p><p className='text-xs text-slate-500'>{item.kind}</p></div><button className='rounded-xl border border-slate-700 px-2 py-1 text-xs'>Open</button></div>)}</div></div>
          <div className='rounded-2xl border border-slate-800 bg-slate-900 p-4'><div className='mb-3 flex items-center gap-2 text-sm font-semibold'><GitBranch size={16} /> Graph Preview</div><div className='rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-400'>user_input → supervisor → requirement_agent → metadata_agent → data_quality_agent → approval_gate → pipeline_builder_agent</div></div>
        </aside>
      </div>
    </div>
  )
}

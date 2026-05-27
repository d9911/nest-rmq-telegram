import React from 'react'
import { Layers, Terminal, ArrowRight, Clock, Check, Cpu } from 'lucide-react'
import { TranslationDict } from '../translations'
import { SimulatedMessage } from '../types'

interface TopologyMapProps {
  t: TranslationDict
  tasksQueueItems: SimulatedMessage[]
  tasksQueueProcessing: SimulatedMessage[]
  notifyQueueItems: SimulatedMessage[]
  activeWorkerId: number | null
}

export function TopologyMap({ t, tasksQueueItems, tasksQueueProcessing, notifyQueueItems, activeWorkerId }: TopologyMapProps) {
  return (
    <div id="topology-map-deck" className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="font-sans font-semibold text-white text-base flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            Live Distributed Architecture Sandbox
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Watch transactional events traverse between microservice queues and trigger manual actions.</p>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex gap-2 font-mono text-xs">
          <span className="rounded bg-sky-955/70 text-sky-400 border border-sky-900/40 px-2.5 py-1 font-semibold flex items-center gap-1">
            tasks: <b className="text-sky-300 font-bold">{tasksQueueItems.length + tasksQueueProcessing.length}</b>
          </span>
          <span className="rounded bg-amber-955/70 text-amber-300 border border-amber-900/40 px-2.5 py-1 font-semibold flex items-center gap-1">
            notifies: <b className="text-amber-205 font-bold">{notifyQueueItems.length}</b>
          </span>
        </div>
      </div>

      {/* Interactive Topology Visual Flowchart Grid */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center relative py-4">
        {/* 1. PORT: REST API Microservice (Producer) */}
        <div className="md:col-span-2 flex flex-col items-center bg-[#07090E] border border-slate-800 rounded-lg p-3 text-center shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Terminal className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-slate-200">Producer API</span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5">Nest.js • Port 3001</span>
          <div className="inline-flex rounded bg-emerald-955/80 text-emerald-400 px-1.5 py-0.2 text-[9px] font-bold uppercase mt-2 font-mono border border-emerald-900/40">REST Active</div>
        </div>

        {/* Link arrow 1 */}
        <div className="hidden md:flex md:col-span-1 flex-col items-center justify-center text-slate-600">
          <ArrowRight className="h-5 w-5 animate-pulse text-indigo-500/50" />
          <span className="text-[9px] font-mono text-slate-500 mt-1">process_task</span>
        </div>

        {/* 2. RabbitMQ Broker Pipeline (Exchanges & Queues) */}
        <div className="md:col-span-5 border border-slate-800 rounded-xl p-4 bg-[#07090E]/40 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">RabbitMQ Broker</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Port 5672</span>
          </div>

          {/* tasks_queue block */}
          <div className="bg-[#07090E] rounded-lg p-3 border border-slate-800 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 font-mono">tasks_queue</span>
              <span className="text-[11px] font-semibold text-indigo-400 font-mono">durable: true</span>
            </div>

            {/* Visualizer Queue Slot */}
            <div className="min-h-12 border border-dashed border-slate-800 rounded p-1.5 flex flex-wrap gap-1.5 items-center justify-start bg-[#05060A]">
              {tasksQueueItems.length === 0 && tasksQueueProcessing.length === 0 ? (
                <span className="text-[9px] text-slate-600 italic mx-auto font-mono text-center">Queue Empty. Publish events to see packets...</span>
              ) : (
                <>
                  {tasksQueueItems.map((msg) => (
                    <div
                      key={msg.id}
                      className="h-7 px-2 bg-sky-955/80 border border-sky-900/50 text-sky-300 rounded flex items-center gap-1 text-[10px] font-mono select-none shadow-xs transition-colors hover:border-sky-450"
                      title={`Click database explorer below. ID: ${msg.id}`}
                    >
                      <span className="font-semibold text-[8px] tracking-wider text-sky-400 font-bold">MSG</span>
                      <span className="text-[8px] font-bold text-sky-400 shrink-0">#{msg.id.substring(4, 8) || msg.id.substring(0, 4)}</span>
                      {msg.retryCount > 0 && (
                        <span className="rounded bg-amber-600 text-white text-[8px] font-bold px-1 ml-1" title={`${msg.retryCount} system retries completed`}>
                          R:{msg.retryCount}
                        </span>
                      )}
                    </div>
                  ))}
                  {tasksQueueProcessing.map((msg) => (
                    <div key={msg.id} className="h-7 px-2 bg-amber-955/80 border border-amber-900 text-amber-300 rounded flex items-center gap-1 text-[10px] font-mono select-none animate-pulse">
                      <Clock className="h-3 w-3 text-amber-500 animate-spin" />
                      <span className="text-[8px] font-bold text-amber-400">#{msg.id.substring(4, 8) || msg.id.substring(0, 4)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* notify_queue block */}
          <div className="bg-[#07090E] rounded-lg p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 font-mono">notify_queue</span>
              <span className="text-[11px] font-semibold text-indigo-400 font-mono">durable: true</span>
            </div>

            {/* Visualizer Queue Slot Container */}
            <div className="min-h-12 border border-dashed border-slate-800 rounded p-1.5 flex flex-wrap gap-1.5 items-center justify-start bg-[#05060A]">
              {notifyQueueItems.length === 0 ? (
                <span className="text-[9px] text-slate-500 italic mx-auto font-mono text-center">Queue Empty. Awaiting processed tasks...</span>
              ) : (
                <>
                  {notifyQueueItems.map((msg) => (
                    <div
                      key={msg.id}
                      className={`h-7 px-2 rounded flex items-center gap-1 border text-[10px] font-mono select-none ${
                        msg.status === 'processing' ? 'bg-amber-955/80 border-amber-900 text-amber-300 animate-pulse' : 'bg-emerald-955/80 border border-emerald-900/60 text-emerald-300'
                      }`}
                    >
                      {msg.status === 'processing' ? <Clock className="h-3 w-3 text-amber-500 animate-spin" /> : <Check className="h-3.5 w-3.5 text-emerald-400" />}
                      <span className="text-[8px] font-bold text-sky-400 font-mono">#{msg.id.substring(4, 8) || msg.id.substring(0, 4)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Link arrow 2 */}
        <div className="hidden md:flex md:col-span-1 flex-col items-center justify-center text-slate-600">
          <ArrowRight className="h-5 w-5 animate-pulse text-indigo-500/50" />
          <span className="text-[9px] font-mono text-slate-500 mt-1">ack / nack</span>
        </div>

        {/* 3. Multi-threaded Consumer Workers Task executing */}
        <div className="md:col-span-2 flex flex-col gap-2">
          <div className="flex flex-col items-center bg-[#07090E] border border-slate-800 rounded-lg p-3 text-center shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2">
              <Cpu className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-200">Consumer</span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">Nest Worker Pool</span>
          </div>

          {/* Workers Thread visual representations */}
          <div className="space-y-1">
            {[1, 2, 3].map((workerId) => {
              const isActive = activeWorkerId === workerId
              return (
                <div
                  key={workerId}
                  className={`rounded px-2.5 py-1 text-center transition-all border text-[9px] font-mono flex items-center justify-between ${
                    isActive ? 'bg-amber-600 text-white border-amber-500 font-semibold shadow-[0_0_10px_rgba(217,119,6,0.15)]' : 'bg-[#07090E] text-slate-500 border-slate-800'
                  }`}
                >
                  <span>Thread #{workerId}</span>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${isActive ? 'bg-amber-400 animate-ping' : 'bg-slate-800'}`}></span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom explanations panel */}
      <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400 leading-relaxed font-sans">
        <div>
          <span className="font-semibold text-white block mb-1">1. Ensures Idempotency</span>
          Every publish receives a signed UUID. Subsequent checks safeguard against duplication inside our worker nodes.
        </div>
        <div>
          <span className="font-semibold text-white block mb-1">2. Transactional Stability</span>
          Under manual ACK options, event logs reside inside the MQ engine. Workers won't delete tasks until processes succeed.
        </div>
        <div>
          <span className="font-semibold text-white block mb-1">3. Retry Strategy</span>
          Failure intercepts trigger automated NACK requeue steps, replicating clean-architecture standards.
        </div>
      </div>
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import { Terminal, RefreshCw, Layers } from 'lucide-react'
import { TranslationDict } from '../translations'
import { SimulationLog } from '../types'

interface TerminalConsoleProps {
  t: TranslationDict
  logs: SimulationLog[]
  onClearLogs: () => void
  scrollRef: React.RefObject<HTMLDivElement | null>
}

type LogTypeFilter = 'all' | 'Producer' | 'Broker' | 'Consumer' | 'Notification'

export function TerminalConsole({ t, logs, onClearLogs, scrollRef }: TerminalConsoleProps) {
  const [filter, setFilter] = useState<LogTypeFilter>('all')

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs
    return logs.filter((l) => l.service === filter)
  }, [logs, filter])

  return (
    <div className="bg-[#05060A]/95 rounded-xl overflow-hidden shadow-2xl border border-slate-800/80">
      {/* Top Header tab bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-[#0e121e] border-b border-slate-800 p-3 sm:px-4 gap-2">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-5 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">{t.stdoutTitle}</span>
        </div>

        {/* Filtering service selector */}
        <div className="flex flex-wrap items-center gap-1">
          {(['all', 'Producer', 'Broker', 'Consumer', 'Notification'] as const).map((serviceName) => (
            <button
              key={serviceName}
              onClick={() => setFilter(serviceName)}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-all cursor-pointer ${
                filter === serviceName ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold' : 'bg-[#05060A]/40 text-slate-500 border border-transparent hover:text-slate-300'
              }`}
            >
              {serviceName === 'all' ? 'All Streams' : serviceName}
            </button>
          ))}

          <button
            onClick={onClearLogs}
            className="ml-2 px-2 py-1 bg-slate-800 hover:bg-slate-705 rounded text-[10px] text-slate-400 hover:text-white transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer outline-hidden"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            <span>{t.stdoutClearBtn}</span>
          </button>
        </div>
      </div>

      {/* Actual Logs Output Viewport */}
      <div ref={scrollRef} className="p-4 font-mono text-[11px] leading-relaxed h-[240px] overflow-y-auto space-y-2 text-slate-400 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <p className="text-slate-500 italic text-center py-10">{t.stdoutEmpty}</p>
        ) : (
          filteredLogs.map((log) => {
            // Color mapping matching RabbitMQ & NestJS CLI styles
            let textClass = 'text-slate-300'
            let systemTagClass = 'bg-slate-800 text-slate-400 border-slate-700'

            if (log.type === 'success') {
              textClass = 'text-slate-205 text-white font-medium'
              systemTagClass = 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40'
            } else if (log.type === 'warn') {
              textClass = 'text-amber-300 font-medium'
              systemTagClass = 'bg-amber-950/50 text-amber-400 border border-amber-900/40'
            } else if (log.type === 'error') {
              textClass = 'text-red-400 font-bold'
              systemTagClass = 'bg-red-955/54 text-red-400 border border-red-900/40'
            }

            // Set tag based on emitting service name
            let tagColor = 'text-purple-400'
            if (log.service === 'Producer') tagColor = 'text-sky-400 font-bold'
            if (log.service === 'Broker') tagColor = 'text-orange-400 font-bold'
            if (log.service === 'Consumer') tagColor = 'text-[#fcab79] font-bold'
            if (log.service === 'Notification') tagColor = 'text-emerald-400 font-bold'

            return (
              <div key={log.id} className="flex items-start space-x-2 animate-fade-in group">
                <span className="text-slate-600 select-none text-[10px] shrink-0 font-medium mt-0.5">[{log.timestamp}]</span>
                <span className={`px-1 rounded text-[9px] font-bold uppercase border tracking-wide mt-0.5 shrink-0 ${systemTagClass}`}>{log.type}</span>
                <span className={`shrink-0 font-bold ${tagColor}`}>[{log.service === 'Notification' ? 'notify' : log.service.toLowerCase()}]:</span>
                <span className={`${textClass} break-all break-words leading-relaxed`}>{log.text}</span>
              </div>
            )
          })
        )}
      </div>

      {/* Terminal Footer */}
      <div className="bg-[#0e121e] border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>nest-cli daemon listening</span>
        </div>
        <span>UTF-8 stream on active container console</span>
      </div>
    </div>
  )
}

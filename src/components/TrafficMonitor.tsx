import React from 'react'
import { CheckCircle, AlertTriangle, RotateCcw, Clock, Trash2, HelpCircle } from 'lucide-react'
import { TranslationDict } from '../translations'
import { SimulatedMessage } from '../types'

interface TrafficMonitorProps {
  t: TranslationDict
  messages: SimulatedMessage[]
  setMessages: React.Dispatch<React.SetStateAction<SimulatedMessage[]>>
  manualAck: (msg: SimulatedMessage) => void
  manualNack: (msg: SimulatedMessage) => void
  autoAck: boolean
}

export function TrafficMonitor({ t, messages, setMessages, manualAck, manualNack, autoAck }: TrafficMonitorProps) {
  return (
    <div className="bg-[#0D111A] border border-slate-800 rounded-xl shadow-xl p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h4 className="font-sans font-semibold text-white text-sm tracking-wide">{t.brokerMonitorTitle}</h4>
          <span className="text-[10.5px] text-slate-400 font-mono tracking-wider">{t.brokerMonitorSubtitle}</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg">
            <p className="text-xs text-slate-500 italic">{t.brokerMonitorEmpty}</p>
          </div>
        ) : (
          [...messages].reverse().map((msg) => {
            // Stylings based on individual packet status
            let cardBorder = 'border-slate-800 bg-[#05060A]/60'
            let statusBadge = 'bg-slate-805 text-slate-400'
            let statusText = msg.status.toUpperCase()

            if (msg.status === 'queued') {
              cardBorder = 'border-sky-900/40 bg-sky-955/5 animate-pulse'
              statusBadge = 'bg-sky-955/60 text-sky-400 border border-sky-900/30'
            } else if (msg.status === 'broker_delivering') {
              cardBorder = 'border-amber-900/30 bg-amber-955/5'
              statusBadge = 'bg-amber-955/60 text-amber-300 border border-amber-900/40'
              statusText = 'DELIVERING'
            } else if (msg.status === 'processing') {
              cardBorder = 'border-yellow-600/30 bg-yellow-600/5'
              statusBadge = 'bg-yellow-955/60 text-yellow-300 border border-yellow-800/20'
            } else if (msg.status === 'acked') {
              cardBorder = 'border-emerald-900/30 bg-[#05060A]/80'
              statusBadge = 'bg-emerald-955/40 text-emerald-400 border border-emerald-900/30 font-bold'
              statusText = 'ACKED'
            } else if (msg.status === 'nacked') {
              cardBorder = 'border-pink-900/30 bg-pink-955/5'
              statusBadge = 'bg-pink-955/50 text-pink-400 border border-pink-900/30'
              statusText = 'NACKED'
            } else if (msg.status === 'dead_letter') {
              cardBorder = 'border-red-900/60 bg-red-955/5 ring-1 ring-red-500/20'
              statusBadge = 'bg-red-955 text-red-400 border border-red-900/60 font-black'
              statusText = 'DEAD LETTER'
            }

            return (
              <div key={msg.id} className={`p-3.5 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors duration-200 ${cardBorder}`}>
                <div className="space-y-1 sm:max-w-[70%] text-left font-sans">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-slate-100 font-bold text-xs">{msg.title || t.directQueueTransFallback}</span>
                    <span className="text-[10px] text-slate-500 font-mono tracking-wide">#{msg.id}</span>
                    <span className={`text-[9px] font-mono font-bold tracking-wider rounded-md px-1.5 py-0.5 ${statusBadge}`}>{statusText}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-normal break-words">{msg.message}</p>

                  {Object.keys(msg.metadata).length > 0 && (
                    <div className="flex items-center space-x-1.5 pt-1 text-[10px] font-mono text-slate-500">
                      <span>{t.brokerHeaderArgs}</span>
                      <span className="bg-slate-900 border border-slate-800 rounded px-1 text-slate-400">{JSON.stringify(msg.metadata)}</span>
                    </div>
                  )}

                  {msg.retryCount > 0 && (
                    <span className="text-[9.5px] text-amber-400 font-mono flex items-center gap-1.5 pt-0.5">
                      <Clock className="h-3 w-3 inline" />
                      {t.brokerRetryAttempts}{' '}
                      <b className="font-extrabold">
                        {msg.retryCount} {t.brokerOf} 2
                      </b>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-2 sm:mt-0 shrink-0 font-sans">
                  {msg.status === 'processing' && !autoAck && (
                    <div className="flex items-center gap-1.5 bg-[#0A050D] p-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => manualAck(msg)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9.5px] uppercase tracking-wider rounded transition-all flex items-center gap-1 shadow-sm leading-none"
                        title={t.brokerAckTooltip}
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-200" />
                        <span>ACK</span>
                      </button>
                      <button
                        onClick={() => manualNack(msg)}
                        className="px-2.5 py-1 bg-red-600/40 hover:bg-red-500 hover:text-white text-red-300 font-semibold text-[9.5px] uppercase tracking-wider rounded transition-all flex items-center gap-1 border border-red-900/30 leading-none"
                        title={t.brokerNackTooltip}
                      >
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>NACK</span>
                      </button>
                    </div>
                  )}

                  {msg.status === 'dead_letter' && (
                    <button
                      onClick={() => {
                        // Resubmit dead-letter directly back to queue
                        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'queued', retryCount: 0 } : m)))
                      }}
                      className="px-2.5 py-1 bg-[#aa2d00] hover:bg-orange-700 text-white rounded text-[10px] transition-all flex items-center space-x-1 font-semibold cursor-pointer outline-hidden"
                      title={t.brokerRequeueTooltip}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t.requeueBtnText}</span>
                    </button>
                  )}

                  <span className="text-[10px] text-slate-500 font-mono tracking-wider pl-1 font-semibold">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

import React from 'react'
import { Send } from 'lucide-react'
import { TranslationDict } from '../translations'

interface MessageProducerProps {
  t: TranslationDict
  inputs: {
    title: string
    message: string
    metadata: string
  }
  setInputs: React.Dispatch<
    React.SetStateAction<{
      title: string
      message: string
      metadata: string
    }>
  >
  dispatchMessage: () => Promise<void>
}

export function MessageProducer({ t, inputs, setInputs, dispatchMessage }: MessageProducerProps) {
  return (
    <div className="bg-[#000000]/20 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl text-left">
      <div className="flex items-center space-x-2 border-b border-slate-850 pb-3">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
        <h3 className="font-sans font-semibold text-white text-sm tracking-wide">{t.ingestPayloadTitle}</h3>
      </div>

      <div className="space-y-3.5 text-xs font-sans">
        {/* Title Input */}
        <div className="space-y-1">
          <label className="block text-slate-400 font-semibold">{t.messageEventTitle}</label>
          <input
            type="text"
            className="w-full bg-[#05060A]/90 border border-slate-800 rounded px-3 py-2 text-white placeholder-slate-650 focus:border-amber-400 focus:outline-hidden"
            value={inputs.title}
            onChange={(e) => setInputs((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Event Action Title, e.g. User Signed Up"
          />
        </div>

        {/* Message Body Area */}
        <div className="space-y-1">
          <label className="block text-slate-400 font-semibold">{t.payloadNotificationMessage}</label>
          <textarea
            rows={3}
            className="w-full bg-[#05060A]/90 border border-slate-800 rounded px-3 py-2 text-white placeholder-slate-650 focus:border-amber-400 focus:outline-hidden resize-none leading-relaxed"
            value={inputs.message}
            onChange={(e) => setInputs((prev) => ({ ...prev, message: e.target.value }))}
            placeholder="Transaction telemetry text content..."
          />
        </div>

        {/* JSON Metadata Area */}
        <div className="space-y-1">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-slate-400 font-semibold">{t.contextJsonMetadata}</label>
            <span className="text-[10px] text-slate-505 text-slate-500 font-mono tracking-wider">application/json</span>
          </div>
          <textarea
            rows={4}
            className="w-full bg-[#05060A]/90 border border-slate-800 rounded px-3 py-2 text-white font-mono placeholder-slate-650 focus:border-amber-400 focus:outline-hidden resize-none leading-relaxed text-[11px]"
            value={inputs.metadata}
            onChange={(e) => setInputs((prev) => ({ ...prev, metadata: e.target.value }))}
            placeholder='{\n  "priority": "high"\n}'
          />
        </div>

        {/* Dispatch REST request */}
        <div className="pt-2">
          <button
            onClick={dispatchMessage}
            className="w-full py-3 bg-[#aa2d00] hover:bg-orange-700 font-bold rounded-lg text-white shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center space-x-2 cursor-pointer outline-hidden"
          >
            <Send className="w-4 h-4 text-orange-200" />
            <span>{t.publishEventBtn}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

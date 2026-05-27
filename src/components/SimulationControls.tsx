import React from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { TranslationDict } from '../translations'
import { ConsumerSettings } from '../types'

interface SimulationControlsProps {
  t: TranslationDict
  consumerSettings: ConsumerSettings
  setConsumerSettings: React.Dispatch<React.SetStateAction<ConsumerSettings>>
}

export function SimulationControls({ t, consumerSettings, setConsumerSettings }: SimulationControlsProps) {
  return (
    <div className="bg-[#000000]/20 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl text-left font-sans">
      <div className="flex items-center justify-between border-b border-slate-850 pb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-505 bg-indigo-500" />
          <h3 className="font-semibold text-white text-sm tracking-wide">{t.faultDeckTitle}</h3>
        </div>
      </div>

      <div className="space-y-4 text-xs">
        {/* Auto Ack Switch */}
        <div className="flex items-center justify-between p-2.5 bg-[#05060A]/60 border border-slate-800/80 rounded-lg">
          <div className="space-y-0.5 pr-2">
            <span className="font-semibold text-slate-200 block">{t.manualAckTitle}</span>
            <span className="text-[10px] text-slate-505 text-slate-500 leading-normal font-sans">{consumerSettings.autoAck ? t.noAckTrue : t.noAckFalse}</span>
          </div>
          <button
            onClick={() => setConsumerSettings((prev) => ({ ...prev, autoAck: !prev.autoAck }))}
            className={`w-11 h-6 shrink-0 rounded-full transition-colors relative cursor-pointer ${consumerSettings.autoAck ? 'bg-indigo-600' : 'bg-slate-800'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${consumerSettings.autoAck ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Simulate Exception Switch */}
        <div className="flex items-center justify-between p-2.5 bg-[#05060A]/60 border border-slate-800/80 rounded-lg">
          <div className="space-y-0.5 pr-2">
            <span className="font-semibold text-slate-200 block">{t.simulateErrTitle}</span>
            <span className="text-[10px] text-emerald-500 leading-normal font-sans">{consumerSettings.simulateError ? t.dlxEnabled : t.dlxDisabled}</span>
          </div>
          <button
            onClick={() => setConsumerSettings((prev) => ({ ...prev, simulateError: !prev.simulateError }))}
            className={`w-11 h-6 shrink-0 rounded-full transition-colors relative cursor-pointer ${consumerSettings.simulateError ? 'bg-red-658 bg-red-600' : 'bg-slate-800'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${consumerSettings.simulateError ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Delay Slider */}
        <div className="space-y-2 bg-[#05060A]/60 p-3 border border-slate-800/80 rounded-lg">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-slate-300">{t.consumerLatencyLabel}</span>
            <span className="font-mono text-[#fcab79] font-bold">{consumerSettings.processingDelayMs} ms</span>
          </div>
          <input
            type="range"
            min={400}
            max={4000}
            step={200}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#fcab79] outline-hidden"
            value={consumerSettings.processingDelayMs}
            onChange={(e) => setConsumerSettings((prev) => ({ ...prev, processingDelayMs: Number(e.target.value) }))}
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>400ms</span>
            <span>4000ms</span>
          </div>
        </div>
      </div>
    </div>
  )
}

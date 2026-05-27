import React from 'react'
import { Cpu, Play, Code } from 'lucide-react'
import { TranslationDict } from '../translations'

interface HeroBandProps {
  t: TranslationDict
  setActiveTab: (tab: 'playground' | 'code' | 'docs') => void
}

export function HeroBand({ t, setActiveTab }: HeroBandProps) {
  return (
    <header className="py-8 sm:py-12 bg-slate-900/10 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#aa2d00]/10 border border-[#aa2d00]/30 text-[#fcab79] text-xs font-semibold mb-4">
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
            <span>{t.heroTechBadge}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-tight mb-4 break-words">
            {t.heroHeaderFirst} <span className="font-semibold text-[#fcab79]">{t.heroHeaderAccent}</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">{t.heroDesc}</p>

          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <button
              onClick={() => setActiveTab('playground')}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-slate-100 text-[#07090E] font-semibold rounded-lg text-sm transition-all inline-flex items-center space-x-2 shadow-md w-full sm:w-auto justify-center"
            >
              <Play className="w-4 h-4 fill-current text-slate-950" />
              <span>{t.runSignalBtn}</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 font-medium rounded-lg text-sm transition-all inline-flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <Code className="w-4 h-4" />
              <span>{t.browseCodeBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

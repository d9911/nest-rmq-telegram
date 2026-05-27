import React from 'react'
import { Sparkles, CheckCircle, AlertTriangle, Layers, ChevronRight } from 'lucide-react'
import { TranslationDict } from '../translations'

interface DocDetailsProps {
  t: TranslationDict
  setActiveTab: (tab: 'playground' | 'code' | 'docs') => void
}

export function DocDetails({ t, setActiveTab }: DocDetailsProps) {
  return (
    <div className="space-y-8 text-left font-sans">
      <div className="p-8 rounded-xl bg-[#aa2d00] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
            <Sparkles className="w-4.5 h-4.5" />
            <span>{t.docsManifestoBadge}</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">{t.docsManifestoTitle}</h2>
          <p className="text-white/80 text-sm leading-relaxed">{t.docsManifestoDesc}</p>
        </div>
        <button
          onClick={() => setActiveTab('code')}
          className="px-6 py-3 bg-white text-[#aa2d00] hover:bg-gray-100 font-bold rounded-lg text-sm transition-colors whitespace-nowrap cursor-pointer outline-hidden"
        >
          {t.docsInspectBtn}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="bg-[#0D111A] border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
          <h3 className="text-lg font-semibold flex items-center space-x-2 text-white">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{t.docsIdempotencyTitle}</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">{t.docsIdempotencyDesc}</p>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed font-normal">
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 text-[#fcab79] shrink-0 mt-0.5" />
              <span>{t.docsIdempotencyStep1}</span>
            </li>
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 text-[#fcab79] shrink-0 mt-0.5" />
              <span>{t.docsIdempotencyStep2}</span>
            </li>
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 text-[#fcab79] shrink-0 mt-0.5" />
              <span>{t.docsIdempotencyStep3}</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#0D111A] border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl font-sans">
          <h3 className="text-lg font-semibold flex items-center space-x-2 text-white">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>{t.docsErrorRecoveryTitle}</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">{t.docsErrorRecoveryDesc}</p>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed font-normal">
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 text-[#fcab79] shrink-0 mt-0.5" />
              <span>{t.docsErrorRecoveryStep1}</span>
            </li>
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 text-[#fcab79] shrink-0 mt-0.5" />
              <span>{t.docsErrorRecoveryStep2}</span>
            </li>
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 text-[#fcab79] shrink-0 mt-0.5" />
              <span>{t.docsErrorRecoveryStep3}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-[#0D111A] border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
        <h3 className="text-lg font-semibold flex items-center space-x-2 text-white">
          <Layers className="w-5 h-5 text-[#fcab79]" />
          <span>{t.docsDockerTitle}</span>
        </h3>
        <p className="text-sm text-slate-300">{t.docsDockerDesc}</p>

        <div className="bg-[#05060A]/95 border border-slate-800/80 rounded-lg p-4 font-mono text-xs space-y-2 text-slate-300 leading-normal">
          <p className="text-[#fcab79] font-bold"># Step 1: Clone the workspace</p>
          <p>git clone https://github.com/your-username/nest-rmq-telegram.git</p>
          <p>cd nest-rmq-telegram</p>
          <br />
          <p className="text-[#fcab79] font-bold"># Step 2: Configure secrets inside an .env file</p>
          <p>echo "TELEGRAM_BOT_TOKEN='your_token'" &gt; .env</p>
          <p>echo "TELEGRAM_CHAT_ID='your_chat_id'" &gt;&gt; .env</p>
          <br />
          <p className="text-[#fcab79] font-bold"># Step 3: Run compose or Makefile shortcuts</p>
          <p>make up</p>
          <br />
          <p className="text-emerald-400 font-bold"># Verified: Docker-Compose will compile images and launch RabbitMQ + 3 services!</p>
        </div>
      </div>
    </div>
  )
}

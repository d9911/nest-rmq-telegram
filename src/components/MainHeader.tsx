import React from 'react'
import { Layers, Settings, Globe } from 'lucide-react'
import { Language, TranslationDict } from '../translations'
import { TelegramConfig } from '../types'

interface MainHeaderProps {
  t: TranslationDict
  lang: Language
  setLang: (lang: Language) => void
  tgConfig: TelegramConfig
  showConfig: boolean
  setShowConfig: (show: boolean) => void
  activeTab: 'playground' | 'code' | 'docs'
  setActiveTab: (tab: 'playground' | 'code' | 'docs') => void
}

export function MainHeader({ t, lang, setLang, tgConfig, showConfig, setShowConfig, activeTab, setActiveTab }: MainHeaderProps) {
  return (
    <nav id="top-nav" className="sticky top-0 z-50 h-16 bg-[#07090E]/95 border-b border-slate-800 shadow-xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        <div className="flex items-center space-x-4 sm:space-x-8 min-w-0">
          {/* FSD Grid Icon & Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
            <span className="font-semibold text-sm sm:text-base md:text-lg tracking-tight text-white truncate max-w-[110px] xs:max-w-[180px] sm:max-w-none">{t.workspaceTitle}</span>
          </div>

          {/* Tab Navigation links */}
          <div className="hidden md:flex items-center space-x-1 border border-slate-800 bg-[#05060A] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('playground')}
              className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-md text-[11px] md:text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'playground' ? 'bg-[#aa2d00] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.interactivePlayground}
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-md text-[11px] md:text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'code' ? 'bg-[#aa2d00] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.sourceCodeIde}
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-md text-[11px] md:text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'docs' ? 'bg-[#aa2d00] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.documentation}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          {/* Language Toggle Selector */}
          <div className="flex bg-slate-900 p-0.5 sm:p-1 rounded-lg border border-slate-800 items-center text-[10px] sm:text-[11px] shrink-0">
            <button
              onClick={() => {
                setLang('ru')
                localStorage.setItem('APP_LANGUAGE', 'ru')
              }}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded font-bold transition-all ${lang === 'ru' ? 'bg-[#aa2d00] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              RU
            </button>
            <button
              onClick={() => {
                setLang('en')
                localStorage.setItem('APP_LANGUAGE', 'en')
              }}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded font-bold transition-all ${lang === 'en' ? 'bg-[#aa2d00] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              EN
            </button>
          </div>

          {/* Telegram config indicator */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-colors shrink-0 ${
              tgConfig.token ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40' : 'border-slate-800 text-slate-350 bg-slate-900 hover:bg-slate-800/80'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tgConfig.token ? t.liveBotConfigured : t.configureLiveBot}</span>
          </button>

          <a
            href="#code-ide"
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('code')
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold tracking-wide hover:bg-slate-700 hover:text-white transition-colors shrink-0 hidden min-[1500px]:inline-block"
          >
            {t.copySourceCodeBtn}
          </a>
        </div>
      </div>
    </nav>
  )
}

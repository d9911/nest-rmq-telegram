import React from 'react'
import { Sparkles, Trash2, Check } from 'lucide-react'
import { TranslationDict } from '../translations'
import { TelegramConfig } from '../types'

interface BotConfigDialogProps {
  t: TranslationDict
  tgConfig: TelegramConfig
  setTgConfig: React.Dispatch<React.SetStateAction<TelegramConfig>>
  showConfig: boolean
  setShowConfig: (show: boolean) => void
  isSavingConfig: boolean
  saveTelegramConfig: (e: React.FormEvent) => void
  clearTelegramConfig: () => void
}

export function BotConfigDialog({ t, tgConfig, setTgConfig, showConfig, setShowConfig, isSavingConfig, saveTelegramConfig, clearTelegramConfig }: BotConfigDialogProps) {
  if (!showConfig) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={() => setShowConfig(false)} className="absolute inset-0 bg-[#020305]/80 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto" />

      <div className="bg-[#0D111A] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-800 animate-slide-up relative z-50 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-205 text-white flex items-center gap-1.5 leading-none">
            <Sparkles className="w-4 h-4 text-[#fcab79] animate-pulse" />
            <span>{t.botDialogTitle}</span>
          </h3>
          <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-normal">{t.botSecureLabel}</p>

        <form onSubmit={saveTelegramConfig} className="space-y-4 text-xs font-sans">
          <div className="space-y-1">
            <label className="block text-slate-350 font-semibold">{t.botTokenLabel}</label>
            <input
              type="password"
              value={tgConfig.token === 'SERVER_ENV_TOKEN_ACTIVE' ? '••••••••••••••••••••••••' : tgConfig.token}
              disabled={tgConfig.token === 'SERVER_ENV_TOKEN_ACTIVE'}
              onChange={(e) => setTgConfig((prev) => ({ ...prev, token: e.target.value }))}
              placeholder={t.botTokenPlaceholder}
              className="w-full bg-[#05060A] border border-slate-800 rounded px-3 py-2 text-white font-mono placeholder-slate-650 focus:border-amber-400 outline-hidden focus:ring-1 focus:ring-amber-400/30"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-350 font-semibold">{t.botChatIdLabel}</label>
            <input
              type="text"
              value={tgConfig.chatId === 'SERVER_ENV_CHAT_ID_ACTIVE' ? 'Default Cloud Service (Active)' : tgConfig.chatId}
              disabled={tgConfig.chatId === 'SERVER_ENV_CHAT_ID_ACTIVE'}
              onChange={(e) => setTgConfig((prev) => ({ ...prev, chatId: e.target.value }))}
              placeholder={t.botChatIdPlaceholder}
              className="w-full bg-[#05060A] border border-slate-800 rounded px-3 py-2 text-white font-mono placeholder-slate-650 focus:border-amber-400 outline-hidden focus:ring-1 focus:ring-amber-400/30"
            />
            <p className="text-[10px] text-slate-500 italic mt-1 leading-normal">{t.botChatIdDesc}</p>
          </div>

          <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-1">
            {tgConfig.token && (
              <button
                type="button"
                onClick={clearTelegramConfig}
                className="px-3 py-2 bg-red-955/44 text-red-400 hover:text-white border border-red-900/30 rounded font-semibold transition-all inline-flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.botClearBtn}</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSavingConfig || tgConfig.token === 'SERVER_ENV_TOKEN_ACTIVE'}
              className="ml-auto px-4 py-2 bg-gradient-to-r from-amber-600 to-[#aa2d00] text-white rounded font-bold transition-all hover:scale-102 flex items-center space-x-1.5 disabled:opacity-50 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>{isSavingConfig ? t.botSavingBtn : t.botSaveBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

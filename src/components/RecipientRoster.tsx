import React from 'react'
import { Plus, Users, Trash2, CheckCircle, HelpCircle } from 'lucide-react'
import { TranslationDict } from '../translations'
import { Subscriber } from '../types'

interface RecipientRosterProps {
  t: TranslationDict
  subscribers: Subscriber[]
  selectedChatIds: string[]
  setSelectedChatIds: React.Dispatch<React.SetStateAction<string[]>>
  newChatId: string
  setNewChatId: (id: string) => void
  newName: string
  setNewName: (name: string) => void
  isRegisteringSub: boolean
  registerSubscriberManually: (e: React.FormEvent) => Promise<void>
  deleteSubscriber: (id: string) => Promise<void>
}

export function RecipientRoster({
  t,
  subscribers,
  selectedChatIds,
  setSelectedChatIds,
  newChatId,
  setNewChatId,
  newName,
  setNewName,
  isRegisteringSub,
  registerSubscriberManually,
  deleteSubscriber,
}: RecipientRosterProps) {
  const toggleSubscriberChecked = (id: string) => {
    setSelectedChatIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  return (
    <div className="bg-[#0D111A] border border-slate-800 rounded-xl shadow-xl p-6 space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h4 className="font-sans font-semibold text-white text-sm tracking-wide">{t.subscribersRosterTitle}</h4>
          <p className="text-[10.5px] text-slate-400 font-mono tracking-wider">{t.subscribersSubtitle}</p>
        </div>
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {subscribers.length === 0 ? (
          <div className="p-5 border border-dashed border-slate-800 rounded-lg bg-[#05060A]/60 text-center space-y-1.5">
            <p className="text-xs font-semibold text-slate-500">{t.subscribersEmpty}</p>
          </div>
        ) : (
          subscribers.map((sub) => {
            const isChecked = selectedChatIds.includes(sub.id)
            return (
              <div
                key={sub.id}
                className={`p-2.5 rounded-lg border font-sans text-xs flex items-center justify-between transition-colors ${
                  isChecked ? 'border-indigo-500/30 bg-indigo-955/5 text-indigo-200' : 'border-slate-800 bg-[#05060A]/40 text-slate-350'
                }`}
              >
                <div className="flex items-center space-x-2 w-[75%]">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSubscriberChecked(sub.id)}
                    className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-1 focus:ring-indigo-500 hover:border-slate-700 cursor-pointer"
                    id={`sub-box-${sub.id}`}
                  />
                  <label htmlFor={`sub-box-${sub.id}`} className="min-w-0 cursor-pointer flex flex-col pt-0.5 text-left">
                    <span className="font-semibold text-slate-200 text-xs truncate">{sub.name}</span>
                    <span className="text-[9px] font-mono text-slate-500 truncate">Chat ID: {sub.id}</span>
                  </label>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="inline-flex items-center space-x-1 text-[9px] bg-emerald-955/60 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-900/30">
                    <CheckCircle className="h-2.5 w-2.5" />
                    <span>{sub.status || 'Active'}</span>
                  </span>

                  <button
                    onClick={() => deleteSubscriber(sub.id)}
                    className="p-1 hover:bg-red-955 hover:text-red-400 text-slate-500 rounded border border-transparent hover:border-red-900/20 transition-all cursor-pointer"
                    title="Remove recipient"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Manual Input Form Add Recipient */}
      <form onSubmit={registerSubscriberManually} className="bg-[#05060A]/60 rounded-xl p-3 border border-slate-800/80 space-y-2.5 text-xs font-sans">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block border-b border-slate-850 pb-1.5">{t.subscribersManualRegisterTitle}</span>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-slate-450 block text-[9.5px] font-bold text-slate-400">{t.botChatIdLabel}</label>
            <input
              type="text"
              required
              className="w-full bg-[#05060A] border border-slate-800 rounded px-2 py-1 text-white text-[11px] font-mono focus:border-indigo-500"
              placeholder={t.subscribersManualChatIdPlaceholder || 'e.g. 504144412'}
              value={newChatId}
              onChange={(e) => setNewChatId(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-450 block text-[9.5px] font-bold text-slate-400">Username</label>
            <input
              type="text"
              className="w-full bg-[#05060A] border border-slate-800 rounded px-2 py-1 text-white text-[11px] focus:border-indigo-500"
              placeholder={t.subscribersManualNamePlaceholder || 'e.g. Operator Beta'}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isRegisteringSub}
          className="w-full py-1.5 bg-slate-800 hover:bg-slate-705 border border-slate-700 text-slate-200 hover:text-white rounded font-bold text-xs transition-colors flex items-center justify-center space-x-1 disabled:opacity-50 cursor-pointer outline-hidden"
        >
          <Plus className="h-3.5 w-3.5 text-slate-300" />
          <span>{isRegisteringSub ? t.subscribersManualAddingBtn : t.subscribersManualAddBtn}</span>
        </button>
      </form>
    </div>
  )
}

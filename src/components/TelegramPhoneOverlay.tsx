import React from 'react'
import { Bot, Clock, Check } from 'lucide-react'
import { TranslationDict } from '../translations'
import { SimulatedMessage } from '../types'

interface TelegramPhoneOverlayProps {
  t: TranslationDict
  messages: SimulatedMessage[]
}

export function TelegramPhoneOverlay({ t, messages }: TelegramPhoneOverlayProps) {
  const phoneMessages = messages.filter((m) => m.status === 'acked' || m.status === 'processing')

  return (
    <div className="bg-[#0D111A] rounded-xl border border-slate-800 p-8 mt-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
      <div className="md:col-span-7 space-y-4 text-left">
        <div className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full font-bold border border-emerald-900/30">
          <Bot className="w-3.5 h-3.5" />
          <span>{t.virtualPhoneHeaderBadge}</span>
        </div>
        <h3 className="text-2xl font-semibold tracking-tight text-white leading-tight">{t.virtualPhoneTitle}</h3>
        <p className="text-sm text-slate-300 leading-relaxed font-sans">{t.virtualPhoneDesc}</p>

        <div className="bg-[#05060A]/85 rounded-xl border border-slate-800/80 p-4 text-xs select-none">
          <h4 className="font-semibold text-xs mb-1.5 text-[#fcab79]">{t.virtualPhoneSetupGuideTitle}</h4>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 font-normal leading-relaxed font-sans">
            <li>{t.virtualPhoneGuideStep1}</li>
            <li>{t.virtualPhoneGuideStep2}</li>
            <li>{t.virtualPhoneGuideStep3}</li>
          </ol>
        </div>
      </div>

      <div className="md:col-span-5 flex justify-center">
        {/* PHYSICAL DEVICE BODY MOCKUP */}
        <div className="relative w-[300px] h-[480px] bg-slate-900 rounded-[36px] shadow-2xl overflow-hidden border-[8px] border-slate-950">
          {/* Top Speaker Notch Ear Piece and Camera Lens */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-xl z-20 flex items-center justify-around px-4">
            <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800"></div>
          </div>

          <div className="h-full bg-slate-950 p-4 pt-8 flex flex-col justify-between overflow-hidden relative">
            {/* Screen background texture / accent glow */}
            <div className="absolute top-1/4 right-5 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Carrier, Signal bars and Battery Header */}
            <div className="relative z-10 flex items-center justify-between text-slate-500 text-[8.5px] font-mono tracking-wide mb-1 select-none border-b border-slate-900 pb-1.5 px-1">
              <span>RMQ Cellular</span>
              <div className="flex items-center space-x-1">
                <span className="shrink-0 flex gap-0.5">
                  <span className="w-0.5 h-1 bg-slate-500 rounded-xs"></span>
                  <span className="w-0.5 h-1.5 bg-slate-500 rounded-xs"></span>
                  <span className="w-0.5 h-2 bg-slate-500 rounded-xs"></span>
                  <span className="w-0.5 h-2.5 bg-slate-500 rounded-xs"></span>
                </span>
                <span>LTE</span>
                <span>84%</span>
              </div>
            </div>

            {/* Simulated Chat Window Wrapper */}
            <div className="relative z-10 flex-1 overflow-y-auto space-y-2 pr-1 pt-1 flex flex-col justify-end w-full custom-scrollbar">
              {phoneMessages.length === 0 ? (
                <p className="text-slate-505 text-slate-500 italic text-center py-10 text-[11px] font-sans my-auto leading-relaxed">{t.phoneBotAwaiting}</p>
              ) : (
                phoneMessages
                  .slice(-5) // show up to 5 latest delivered messages nicely
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3 bg-indigo-950/45 border border-indigo-900/40 text-left rounded-2xl rounded-tr-none text-xs text-white max-w-[85%] ml-auto shadow-md animate-slide-up relative space-y-1"
                    >
                      <span className="text-[10px] font-semibold text-sky-400 block font-sans">NestJS RabbitMQ Broker</span>
                      <p className="font-bold text-[11px] text-[#fcab79] tracking-tight">{msg.title}</p>
                      <p className="text-[10px] text-slate-200 leading-relaxed font-sans">{msg.message}</p>

                      <div className="flex items-center justify-between text-[8px] text-slate-450 text-slate-400 font-mono mt-1 pt-0.5 border-t border-indigo-900/30">
                        <span>UUID: {msg.id.substring(4, 9) || msg.id.substring(0, 4)}</span>
                        <div className="flex items-center gap-0.5 select-none font-bold">
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <Check className="h-3 w-3 text-emerald-400 shrink-0 inline ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Bottom Phone Bar */}
            <div className="relative z-10 pt-2 border-t border-slate-800/80 mt-2 flex items-center justify-between">
              <div className="text-[9px] bg-[#05060A] border border-slate-800/80 text-slate-400 rounded-full w-full py-1 px-3 text-center font-mono">{t.phoneReadOnlyConsole}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

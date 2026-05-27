import React, { useState } from 'react'

// Core assets & localized translations
import { CODE_FILES, CodeFile } from './codefiles'
import { translations, Language } from './translations'

// Clean Architecture Custom Hooks & Domain Use-Cases
import { useSimulation } from './hooks/useSimulation'

// Feature Components
import { MainHeader } from './components/MainHeader'
import { HeroBand } from './components/HeroBand'
import { BotConfigDialog } from './components/BotConfigDialog'
import { TopologyMap } from './components/TopologyMap'
import { MessageProducer } from './components/MessageProducer'
import { SimulationControls } from './components/SimulationControls'
import { TerminalConsole } from './components/TerminalConsole'
import { TrafficMonitor } from './components/TrafficMonitor'
import { RecipientRoster } from './components/RecipientRoster'
import { TelegramPhoneOverlay } from './components/TelegramPhoneOverlay'
import { CodeExporter } from './components/CodeExporter'
import { DocDetails } from './components/DocDetails'

export default function App() {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Multilingual Language state (English / Russian)
  const [lang, setLang] = useState<Language>((localStorage.getItem('APP_LANGUAGE') as Language) || 'ru')
  const t = translations[lang]

  // Navigation state
  const [activeTab, setActiveTab] = useState<'playground' | 'code' | 'docs'>('playground')

  // Code IDE State
  const [selectedFile, setSelectedFile] = useState<CodeFile>(CODE_FILES[0])
  const [copied, setCopied] = useState<boolean>(false)

  // Load consolidated business logic and state managers
  const sim = useSimulation()

  // Copy code blocks helper
  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans antialiased selection:bg-[#fb923c] selection:text-white pb-16">
      {/* 1. TOP NAV BAR */}
      <MainHeader t={t} lang={lang} setLang={setLang} tgConfig={sim.tgConfig} showConfig={sim.showConfig} setShowConfig={sim.setShowConfig} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. HERO HEADER STRAP */}
      <HeroBand t={t} setActiveTab={setActiveTab} />

      {/* 3. MAIN WORKSPACE CONTENT PAGES */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* VIEW A: INTERACTIVE PLAYGROUND (AMQP SIMULATOR) */}
        {activeTab === 'playground' && (
          <div className="space-y-10">
            {/* Interactive RabbitMQ Grid Map */}
            <TopologyMap t={t} tasksQueueItems={sim.tasksQueueItems} tasksQueueProcessing={sim.tasksQueueProcessing} notifyQueueItems={sim.notifyQueueItems} activeWorkerId={sim.activeWorkerId} />

            {/* Split controls & terminal consoles */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Sidebar controls (Message Creator & Tuning stats) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <MessageProducer t={t} inputs={sim.inputs} setInputs={sim.setInputs} dispatchMessage={sim.dispatchMessage} />
                <SimulationControls t={t} consumerSettings={sim.consumerSettings} setConsumerSettings={sim.setConsumerSettings} />
              </div>

              {/* Console logs & event lists */}
              <div className="lg:col-span-8 flex flex-col gap-6 justify-between">
                <TerminalConsole t={t} logs={sim.logs} onClearLogs={sim.onClearLogs} scrollRef={scrollRef} />
                <TrafficMonitor t={t} messages={sim.messages} setMessages={sim.setMessages} manualAck={sim.manualAck} manualNack={sim.manualNack} autoAck={sim.consumerSettings.autoAck} />
              </div>
            </div>

            {/* Recipient Dashboard & Phone viewports */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-6">
                <RecipientRoster
                  t={t}
                  subscribers={sim.subscribers}
                  selectedChatIds={sim.selectedChatIds}
                  setSelectedChatIds={sim.setSelectedChatIds}
                  newChatId={sim.newChatId}
                  setNewChatId={sim.setNewChatId}
                  newName={sim.newName}
                  setNewName={sim.setNewName}
                  isRegisteringSub={sim.isRegisteringSub}
                  registerSubscriberManually={sim.registerSubscriberManually}
                  deleteSubscriber={sim.deleteSubscriber}
                />
              </div>
              <div className="lg:col-span-6">
                <TelegramPhoneOverlay t={t} messages={sim.messages} />
              </div>
            </div>
          </div>
        )}

        {/* VIEW B: INTEGRATED BROWSER IDE BLOCK */}
        {activeTab === 'code' && <CodeExporter t={t} selectedFile={selectedFile} setSelectedFile={setSelectedFile} copied={copied} handleCopyCode={handleCopyCode} />}

        {/* VIEW C: ARCHITECTURAL GUIDES PORTAL */}
        {activeTab === 'docs' && <DocDetails t={t} setActiveTab={setActiveTab} />}
      </main>

      {/* 4. MODAL TELEGRAM BOT CONFIGURATION */}
      <BotConfigDialog
        t={t}
        tgConfig={sim.tgConfig}
        setTgConfig={sim.setTgConfig}
        showConfig={sim.showConfig}
        setShowConfig={sim.setShowConfig}
        isSavingConfig={sim.isSavingConfig}
        saveTelegramConfig={sim.saveTelegramConfig}
        clearTelegramConfig={sim.clearTelegramConfig}
      />

      {/* 5. FOOTER */}
      <footer className="bg-[#05060A]/95 border-t border-slate-800 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-[#aa2d00] flex items-center justify-center text-white font-bold text-xs shadow-sm">N</div>
            <span className="font-semibold text-xs tracking-wide text-slate-400">NestJS Microservices Workspace • denGu</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Project License: GPL-3.0-or-later • Solid clean code blocks pre-compiled</p>
        </div>
      </footer>
    </div>
  )
}

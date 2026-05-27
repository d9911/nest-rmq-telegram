import React, { useState, useEffect } from 'react'
import {
  Send,
  Play,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Database,
  Terminal,
  Settings,
  Bot,
  Code,
  Copy,
  Check,
  Folder,
  ArrowRight,
  BookOpen,
  Cpu,
  ChevronRight,
  FileCode,
  Sparkles,
  Layers,
  HelpCircle,
  Users,
  Trash2,
  Plus,
  Clock,
  RotateCcw,
} from 'lucide-react'
import { CODE_FILES, CodeFile } from './codefiles'
import { translations, Language } from './translations'

// Interfaces for our live RabbitMQ simulation
export interface SimulatedMessage {
  id: string
  title: string
  message: string
  metadata: Record<string, any>
  timestamp: string
  status: 'queued' | 'broker_delivering' | 'processing' | 'acked' | 'nacked' | 'dead_letter'
  retryCount: number
}

export interface SimulationLog {
  id: string
  timestamp: string
  service: 'Producer' | 'Broker' | 'Consumer' | 'Notification' | 'System'
  type: 'info' | 'success' | 'warn' | 'error'
  text: string
}

const loggedChatIdsGlobal = new Set<string>()

export default function App() {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [activeWorkerId, setActiveWorkerId] = useState<number | null>(null)

  // Multilingual Language state (English / Russian)
  const [lang, setLang] = useState<Language>((localStorage.getItem('APP_LANGUAGE') as Language) || 'ru')
  const t = translations[lang]

  // Navigation: 'playground' | 'code' | 'docs'
  const [activeTab, setActiveTab] = useState<'playground' | 'code' | 'docs'>('playground')

  // Code Explorer State
  const [selectedFile, setSelectedFile] = useState<CodeFile>(CODE_FILES[0])
  const [copied, setCopied] = useState<boolean>(false)

  // Simulation State
  const [inputs, setInputs] = useState({
    title: 'New Order Ingested',
    message: 'Order #W10514 has been verified by warehousing and is ready for courier collection!',
    metadata: '{\n  "priority": "high",\n  "department": "fulfillment"\n}',
  })

  // Configuration (Telegram Setup - stored in localStorage for safety)
  const [tgConfig, setTgConfig] = useState({
    token: localStorage.getItem('TELEGRAM_BOT_TOKEN') || '',
    chatId: localStorage.getItem('TELEGRAM_CHAT_ID') || '',
  })
  const [showConfig, setShowConfig] = useState<boolean>(false)
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false)

  // Message Queue Simulation store
  const [messages, setMessages] = useState<SimulatedMessage[]>([])
  const [logs, setLogs] = useState<SimulationLog[]>([
    {
      id: 'init-1',
      timestamp: new Date(Date.now() - 3000).toLocaleTimeString(),
      service: 'System',
      type: 'info',
      text: 'NestJS microservices initialization sequence completed successfully.',
    },
    {
      id: 'init-2',
      timestamp: new Date(Date.now() - 2000).toLocaleTimeString(),
      service: 'Broker',
      type: 'success',
      text: 'RabbitMQ connection ready on port 5672. Exchanges [amq.direct] and queues [tasks_queue, notify_queue] verified.',
    },
    {
      id: 'init-3',
      timestamp: new Date(Date.now() - 1000).toLocaleTimeString(),
      service: 'Consumer',
      type: 'info',
      text: 'Consumer module bound. Manual Acknowledgment flag (noAck: false) engaged.',
    },
  ])

  // Simulation settings
  const [consumerSettings, setConsumerSettings] = useState({
    autoAck: true,
    simulateError: false,
    processingDelayMs: 1500,
  })

  // Global Stat Counters
  const [sentCount, setSentCount] = useState<number>(0)
  const [ackedCount, setAckedCount] = useState<number>(0)
  const [nackedCount, setNackedCount] = useState<number>(0)
  const [deadLetterCount, setDeadLetterCount] = useState<number>(0)
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'success' | 'failed' | 'simulated'>('idle')

  // Subscribers session lists
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([])
  const [newChatId, setNewChatId] = useState('')
  const [newName, setNewName] = useState('')
  const [isRegisteringSub, setIsRegisteringSub] = useState(false)

  // Reactive Queue simulation helpers mapping messages to active status pipelines
  const tasksQueueItems = messages.filter((m) => m.status === 'queued' || m.status === 'broker_delivering')
  const tasksQueueProcessing = messages.filter((m) => m.status === 'processing')
  const notifyQueueItems = messages.filter((m) => m.status === 'acked' || (m.status === 'processing' && m.retryCount > 0))

  const onClearLogs = () => setLogs([])

  // Fetch subscribers list from backend
  const fetchSubscribersList = async () => {
    try {
      const res = await fetch('/api/telegram/subscribers')
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.subscribers)) {
          setSubscribers(data.subscribers)
        }
      }
    } catch (err) {
      // Ignore polling errors silently
    }
  }

  // Handle manual recipient registration
  const registerSubscriberManually = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChatId.trim()) return
    setIsRegisteringSub(true)
    try {
      const res = await fetch('/api/telegram/subscribers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newChatId.trim(),
          name: newName.trim() || `User ${newChatId}`,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSubscribers(data.subscribers)
          addLog('System', 'success', `Manually registered Chat ID ${newChatId} inside the recipient roster!`)
          setNewChatId('')
          setNewName('')
        }
      }
    } catch (err: any) {
      addLog('System', 'error', `Failed to register chat ID manually: ${err.message || err}`)
    } finally {
      setIsRegisteringSub(false)
    }
  }

  // Handle removing a subscriber from list
  const deleteSubscriber = async (idToDelete: string) => {
    try {
      const res = await fetch('/api/telegram/subscribers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idToDelete }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSubscribers(data.subscribers)
          setSelectedChatIds((prev) => prev.filter((id) => id !== idToDelete))
          addLog('System', 'info', `Removed subscriber ${idToDelete} from the recipient dashboard.`)
        }
      }
    } catch (err: any) {
      addLog('System', 'error', `Failed to remove subscriber: ${err.message || err}`)
    }
  }

  // Save Config to Local Storage safely
  const saveTelegramConfig = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingConfig(true)
    setTimeout(() => {
      localStorage.setItem('TELEGRAM_BOT_TOKEN', tgConfig.token)
      localStorage.setItem('TELEGRAM_CHAT_ID', tgConfig.chatId)
      setIsSavingConfig(false)
      addLog('System', 'success', `Telegram configurations cached safely. Integration will trigger real-time messages!`)
      setShowConfig(false)
    }, 400)
  }

  // Clear Telegram keys
  const clearTelegramConfig = () => {
    localStorage.removeItem('TELEGRAM_BOT_TOKEN')
    localStorage.removeItem('TELEGRAM_CHAT_ID')
    setTgConfig({ token: '', chatId: '' })
    addLog('System', 'info', `Telegram integrations reverted to simulation fallback mode.`)
  }

  // Appends a log line to our Simulated Microservices Terminal
  const addLog = (service: SimulationLog['service'], type: SimulationLog['type'], text: string) => {
    const newLog: SimulationLog = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      service,
      type,
      text,
    }
    setLogs((prev) => [newLog, ...prev].slice(0, 50)) // limit to 50 logs the UI handles beautifully
  }

  // Copies the currently focused code block
  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Trigger simulated/real message dispatch sequence
  const dispatchMessage = async () => {
    let metaObj = {}
    try {
      metaObj = JSON.parse(inputs.metadata)
    } catch (e) {
      addLog('Producer', 'error', 'Failed validation: Metadata must be formatted as valid JSON object.')
      return
    }

    const uuid = 'msg-' + Math.floor(Math.random() * 900000 + 100000).toString() + '-' + Date.now().toString().slice(-4)

    const newMsg: SimulatedMessage = {
      id: uuid,
      title: inputs.title,
      message: inputs.message,
      metadata: metaObj,
      timestamp: new Date().toISOString(),
      status: 'queued',
      retryCount: 0,
    }

    // 1. PRODUCER LOGS
    addLog('Producer', 'info', `REST Request parsed successfully. Generated Idempotency signature: ${uuid}`)
    addLog('Producer', 'info', `Serializing payload to JSON envelope. Publishing payload to Exchange [amq.direct] queue [tasks_queue]`)
    setSentCount((prev) => prev + 1)
    setMessages((prev) => [...prev, newMsg])

    // Wait slightly to pass through RabbitMQ
    setTimeout(() => {
      brokerDelivering(newMsg)
    }, 800)
  }

  // 2. RABBITMQ BROKER TRANSITIONS
  const brokerDelivering = (msg: SimulatedMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'broker_delivering' } : m)))
    addLog('Broker', 'info', `Message delivery initiated. Routing key matches binding pattern 'process_task' for envelope ${msg.id}`)

    setTimeout(() => {
      consumeMessage(msg)
    }, 800)
  }

  // 3. CONSUMER SERVICE LOGIC & ACKING
  const consumeMessage = async (msg: SimulatedMessage) => {
    const threadId = Math.floor(Math.random() * 3) + 1
    setActiveWorkerId(threadId)

    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'processing' } : m)))
    addLog('Consumer', 'info', `Message received from tasks_queue. Spawning Thread Worker for UUID: ${msg.id}`)

    // Check if error simulation is checked
    const delay = consumerSettings.processingDelayMs
    setTimeout(async () => {
      setActiveWorkerId(null)
      if (consumerSettings.simulateError) {
        // Consumer handles error & NACK
        setNackedCount((prev) => prev + 1)
        addLog('Consumer', 'error', `Exception caught! Simulating DB connection constraint block during process for task ${msg.id}`)

        if (msg.retryCount < 2) {
          // Send NACK with requeue=true
          const retriedMsg = { ...msg, retryCount: msg.retryCount + 1, status: 'queued' as const }
          addLog('Broker', 'warn', `Consumer issued NACK for task ${msg.id}. Re-queueing envelope to Head. Retry attempt #${retriedMsg.retryCount}`)

          setMessages((prev) => prev.map((m) => (m.id === msg.id ? retriedMsg : m)))
          // Re-process
          setTimeout(() => {
            brokerDelivering(retriedMsg)
          }, 1200)
        } else {
          // Exceeded retry count, send to dead letter queue
          setDeadLetterCount((prev) => prev + 1)
          addLog('Broker', 'error', `Consumer NACK limit threshold exceeded for ${msg.id}. Diverting message envelope to Dead-Letter-Exchange [amq.dlx] -> dead_letter_queue`)
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'dead_letter' } : m)))
        }
      } else {
        // Success case. Trigger Notification workflow
        if (consumerSettings.autoAck) {
          addLog('Consumer', 'success', `Consumer processing complete for event ${msg.id}. Dispatched ACK token.`)
          setAckedCount((prev) => prev + 1)
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'acked' } : m)))
          // Trigger TG service
          triggerNotificationService(msg)
        } else {
          // Manual ACK simulation
          addLog('Consumer', 'warn', `Consumer processing paused for manual operator approval (autoAck: false). Awaiting manual ACK trigger...`)
        }
      }
    }, delay)
  }

  // Force Manual ACK for messages hanging in processing status
  const manualAck = (msg: SimulatedMessage) => {
    addLog('Consumer', 'success', `Operator manually issued ACK approval code for transaction ${msg.id}.`)
    setAckedCount((prev) => prev + 1)
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'acked' } : m)))
    triggerNotificationService(msg)
  }

  // Force manual discard (NACK)
  const manualNack = (msg: SimulatedMessage) => {
    addLog('Consumer', 'error', `Operator manually issued NACK command for transaction ${msg.id}.`)
    setNackedCount((prev) => prev + 1)
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'nacked' } : m)))
  }

  // 4. TELEGRAM NOTIFICATION DISPATCH (REAL OR SIMULATED MULTI-RECEIVER BROADCAST)
  const triggerNotificationService = async (msg: SimulatedMessage) => {
    addLog('Notification', 'info', `Consuming alert request from notify_queue corresponding to processed task ID: ${msg.id}`)

    // We utilize the local /api/telegram/send endpoint to handle this securely with CORS bypass
    const passedToken = tgConfig.token === 'SERVER_ENV_TOKEN_ACTIVE' ? '' : tgConfig.token

    // Compile targets. Default to all selected checking checkboxes, otherwise fallback to standard default chatId setup
    const activeTargets =
      selectedChatIds.length > 0
        ? selectedChatIds
        : subscribers.length > 0
          ? subscribers.map((s) => s.id)
          : [tgConfig.chatId === 'SERVER_ENV_CHAT_ID_ACTIVE' ? '' : tgConfig.chatId].filter((id) => id !== '')

    if (activeTargets.length === 0) {
      setTelegramStatus('simulated')
      addLog('Notification', 'info', `Sandbox preview: No active receivers found. Delivery simulated in virtual smartphone on right!`)
      return
    }

    addLog('Notification', 'info', `Dispatching real-time notifications to ${activeTargets.length} recipient(s)...`)

    let successes = 0
    let errors: string[] = []

    for (const targetId of activeTargets) {
      try {
        const passedChatId = targetId === 'SERVER_ENV_CHAT_ID_ACTIVE' ? '' : targetId
        const response = await fetch('/api/telegram/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: passedToken,
            chatId: passedChatId,
            id: msg.id,
            title: msg.title,
            message: msg.message,
          }),
        })

        if (response.ok) {
          const outcome = await response.json()
          if (outcome.delivered) {
            successes += outcome.deliveredCount || 1
          } else {
            errors.push(outcome.reason || 'Not delivered')
          }
        } else {
          errors.push(`Status ${response.status}`)
        }
      } catch (err: any) {
        errors.push(err.message || String(err))
      }
    }

    if (successes > 0) {
      setTelegramStatus('success')
      addLog('Notification', 'success', `✨ LIVE Telegram alert delivered! Notification sent to ${successes} recipient(s) in chat! (UUID: ${msg.id})`)
      fetchSubscribersList() // Refresh their status
    } else {
      setTelegramStatus('failed')
      addLog('Notification', 'error', `Delivery failed for all (${activeTargets.length}) recipients: ${errors.join(', ')}`)
    }
  }

  // Pre-seed some logs or mock data on mounting once
  useEffect(() => {
    // Check server configuration for Telegram credentials
    const checkServerConfig = async () => {
      try {
        const res = await fetch('/api/telegram/config')
        if (res.ok) {
          const cfg = await res.json()
          if (cfg.hasServerToken) {
            if (cfg.chatIdVal) {
              if (!loggedChatIdsGlobal.has(cfg.chatIdVal)) {
                loggedChatIdsGlobal.add(cfg.chatIdVal)
                addLog('System', 'success', `✨ Получен числовой Chat ID от Telegram: ${cfg.chatIdVal}! Подключение установлено!`)
              }
            }

            // If server-side API or polling detected a chat ID, grab it!
            setTgConfig((prev) => {
              const newToken = prev.token || 'SERVER_ENV_TOKEN_ACTIVE'
              const newChatId = prev.chatId || (cfg.chatIdVal ? cfg.chatIdVal : 'SERVER_ENV_CHAT_ID_ACTIVE')

              return {
                token: newToken,
                chatId: newChatId,
              }
            })
          }
        }
      } catch (err) {
        // Fallback silently if server has not fully booted
      }
    }

    // Initial fetch
    checkServerConfig()
    fetchSubscribersList()

    // Periodically poll every 3 seconds to catch live events or updates
    const configInterval = setInterval(checkServerConfig, 3000)
    const subInterval = setInterval(fetchSubscribersList, 3000)

    if (messages.length === 0) {
      // Create a pre-loaded successful transaction in history of visual board
      const historicalId = 'msg-701449-hist'
      setMessages([
        {
          id: historicalId,
          title: 'Database Sync Completed',
          message: 'PostgreSQL catalog indices were systematically rebuilt and optimized in 405ms.',
          metadata: { optimizeMode: 'full' },
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'acked',
          retryCount: 0,
        },
      ])
      setSentCount(1)
      setAckedCount(1)
    }

    return () => {
      clearInterval(configInterval)
      clearInterval(subInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans antialiased selection:bg-[#fb923c] selection:text-white pb-16">
      {/* 1. TOP NAV - Airtable Unified Space Dark Styling */}
      <nav id="top-nav" className="sticky top-0 z-50 h-16 bg-[#07090E]/95 border-b border-slate-800 shadow-xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {/* Airtable Signature Visual Grid Icon & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#aa2d00] flex items-center justify-center text-white font-bold text-lg shadow-md">N</div>
              <span className="font-semibold text-lg tracking-tight text-white">{t.workspaceTitle}</span>
            </div>

            {/* Nav links */}
            <div className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('playground')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'playground' ? 'text-white bg-slate-800/60 font-semibold border border-slate-700/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.interactivePlayground}
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'code' ? 'text-white bg-slate-800/60 font-semibold border border-slate-700/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.sourceCodeIde}
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'docs' ? 'text-white bg-slate-800/60 font-semibold border border-slate-700/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.documentation}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Toggle Selector */}
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 items-center text-[11px]">
              <button
                onClick={() => {
                  setLang('ru')
                  localStorage.setItem('APP_LANGUAGE', 'ru')
                }}
                className={`px-2.5 py-1 rounded font-bold transition-all ${lang === 'ru' ? 'bg-[#aa2d00] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                RU
              </button>
              <button
                onClick={() => {
                  setLang('en')
                  localStorage.setItem('APP_LANGUAGE', 'en')
                }}
                className={`px-2.5 py-1 rounded font-bold transition-all ${lang === 'en' ? 'bg-[#aa2d00] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                EN
              </button>
            </div>

            {/* Telegram config indicator */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-colors ${
                tgConfig.token ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40' : 'border-slate-800 text-slate-350 bg-slate-900 hover:bg-slate-800/80'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{tgConfig.token ? t.liveBotConfigured : t.configureLiveBot}</span>
            </button>

            <a
              href="#view_code"
              onClick={(e) => {
                e.preventDefault()
                setActiveTab('code')
              }}
              className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold tracking-wide hover:bg-slate-700 hover:text-white transition-colors"
            >
              {t.copySourceCodeBtn}
            </a>
          </div>
        </div>
      </nav>

      {/* 2. HERO BAND - Unified dark workspace theme */}
      <header className="py-12 bg-slate-900/10 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#aa2d00]/10 border border-[#aa2d00]/30 text-[#fcab79] text-xs font-semibold mb-4">
              <Cpu className="w-3.5 h-3.5 animate-pulse" />
              <span>{t.heroTechBadge}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-white leading-tight mb-4">
              {t.heroHeaderFirst} <span className="font-semibold text-[#fcab79]">{t.heroHeaderAccent}</span>
            </h1>
            <p className="text-base text-slate-300 leading-relaxed mb-6">{t.heroDesc}</p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('playground')}
                className="px-6 py-3 bg-white hover:bg-slate-100 text-[#07090E] font-semibold rounded-lg text-sm transition-all inline-flex items-center space-x-2 shadow-md"
              >
                <Play className="w-4 h-4 fill-current text-slate-950" />
                <span>{t.runSignalBtn}</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className="px-6 py-3 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 font-medium rounded-lg text-sm transition-all inline-flex items-center space-x-2"
              >
                <Code className="w-4 h-4" />
                <span>{t.browseCodeBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. SETTING DIALOG - IN-APP SECRETS STORAGE ACCORDING TO SECURITY DIRECTIVES */}
      {showConfig && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D111A] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-800">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center text-white">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-[#fcab79]" />
                <span className="font-semibold text-base text-white">{t.botDialogTitle}</span>
              </div>
              <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-white text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={saveTelegramConfig} className="p-6 space-y-4">
              <div className="p-3 bg-amber-955/20 text-[#fcab79] rounded-lg border border-amber-900/40 text-xs leading-relaxed">
                <strong>{t.botSecureLabel}</strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.botTokenLabel}</label>
                <input
                  type="password"
                  placeholder={t.botTokenPlaceholder}
                  id="bot-token-input"
                  value={tgConfig.token}
                  onChange={(e) => setTgConfig({ ...tgConfig, token: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-800 px-3 py-2.5 bg-slate-950 text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.botChatIdLabel}</label>
                <input
                  type="text"
                  placeholder={t.botChatIdPlaceholder}
                  id="chat-id-input"
                  value={tgConfig.chatId}
                  onChange={(e) => setTgConfig({ ...tgConfig, chatId: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-800 px-3 py-2.5 bg-slate-950 text-slate-100 focus:outline-none focus:border-orange-500"
                />
                <span className="text-[11px] text-slate-450 text-slate-400 mt-1 block">{t.botChatIdDesc}</span>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="flex-1 bg-[#aa2d00] hover:bg-[#802200] disabled:opacity-50 text-white py-2 px-4 rounded-lg font-medium text-xs tracking-wider transition-colors"
                >
                  {isSavingConfig ? t.botSavingBtn : t.botSaveBtn}
                </button>
                <button
                  type="button"
                  onClick={clearTelegramConfig}
                  className="bg-slate-800 hover:bg-slate-705 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-lg font-medium text-xs transition-colors border border-slate-700/60"
                >
                  {t.botClearBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MAIN PLAYGROUND CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'playground' && (
          <div className="space-y-6">
            {/* Embedded custom styling for SVG flow dash arrays */}
            <style
              dangerouslySetInnerHTML={{
                __html: `
              @keyframes flow-highway {
                to { stroke-dashoffset: -40; }
              }
              .animate-flow-dash {
                animation: flow-highway 2.5s linear infinite;
              }
              .animate-flow-slow {
                animation: flow-highway 7s linear infinite;
              }
            `,
              }}
            />

            {/* TWO ASPECT COLUMNS / GRID SYSTEM LAYOUT */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* LEFT TELEMENTRY COLUMN: Topology Chart + Message Queues + System Trace Logs */}
              <div className="xl:col-span-8 space-y-6">
                {/* 1. TOPOLOGY MAP DECK (Microservices Architecture Flow Chart) */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 shadow-sm relative overflow-hidden">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 border-b border-slate-800/80 pb-4">
                    <div>
                      <h3 className="font-sans font-semibold text-white text-base flex items-center gap-2">
                        <Layers className="h-5 w-5 text-indigo-400" />
                        Live Distributed Architecture Sandbox
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Watch transactional events traverse between microservice queues and trigger manual actions.</p>
                    </div>

                    {/* Quick Stats Banner */}
                    <div className="flex gap-2 font-mono text-xs">
                      <span className="rounded bg-sky-955/70 text-sky-400 border border-sky-900/40 px-2.5 py-1 font-semibold flex items-center gap-1">
                        tasks: <b className="text-sky-300 font-bold">{tasksQueueItems.length + tasksQueueProcessing.length}</b>
                      </span>
                      <span className="rounded bg-amber-955/70 text-amber-300 border border-amber-900/40 px-2.5 py-1 font-semibold flex items-center gap-1">
                        notifies: <b className="text-amber-205 font-bold">{notifyQueueItems.length}</b>
                      </span>
                    </div>
                  </div>

                  {/* Interactive Topology Visual Flowchart Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center relative py-4">
                    {/* 1. PORT: REST API Microservice (Producer) */}
                    <div className="md:col-span-2 flex flex-col items-center bg-[#07090E] border border-slate-800 rounded-lg p-3 text-center shadow-xs">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2">
                        <Terminal className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200">Producer API</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">Nest.js • Port 3001</span>
                      <div className="inline-flex rounded bg-emerald-955/80 text-emerald-400 px-1.5 py-0.2 text-[9px] font-bold uppercase mt-2 font-mono border border-emerald-900/40">REST Active</div>
                    </div>

                    {/* Link arrow 1 */}
                    <div className="hidden md:flex md:col-span-1 flex-col items-center justify-center text-slate-600">
                      <ArrowRight className="h-5 w-5 animate-pulse text-indigo-500/50" />
                      <span className="text-[9px] font-mono text-slate-500 mt-1">process_task</span>
                    </div>

                    {/* 2. RabbitMQ Broker Pipeline (Exchanges & Queues) */}
                    <div className="md:col-span-5 border border-slate-800 rounded-xl p-4 bg-[#07090E]/40 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">RabbitMQ Broker</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">Port 5672</span>
                      </div>

                      {/* tasks_queue block */}
                      <div className="bg-[#07090E] rounded-lg p-3 border border-slate-800 relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-300 font-mono">tasks_queue</span>
                          <span className="text-[11px] font-semibold text-indigo-400 font-mono">durable : true</span>
                        </div>

                        {/* Visualizer Queue Slot */}
                        <div className="min-h-12 border border-dashed border-slate-800 rounded p-1.5 flex flex-wrap gap-1.5 items-center justify-start bg-[#05060A]">
                          {tasksQueueItems.length === 0 && tasksQueueProcessing.length === 0 ? (
                            <span className="text-[9px] text-slate-600 italic mx-auto font-mono text-center">Queue Empty. Publish events to see packets...</span>
                          ) : (
                            <>
                              {tasksQueueItems.map((msg) => (
                                <div
                                  key={msg.id}
                                  className="h-7 px-2 bg-sky-955/80 border border-sky-900/50 text-sky-300 rounded flex items-center gap-1 text-[10px] font-mono select-none shadow-xs transition-colors hover:border-sky-400"
                                  title={`Click database explorer below. ID: ${msg.id}`}
                                >
                                  <span className="font-semibold text-[8px] tracking-wider text-sky-400 font-bold">MSG</span>
                                  <span className="text-[8px] font-bold text-sky-400 shrink-0">#{msg.id.substring(4, 8) || msg.id.substring(0, 4)}</span>
                                  {msg.retryCount > 0 && (
                                    <span className="rounded bg-amber-600 text-white text-[8px] font-bold px-1 ml-1" title={`${msg.retryCount} system retries completed`}>
                                      R:{msg.retryCount}
                                    </span>
                                  )}
                                </div>
                              ))}
                              {tasksQueueProcessing.map((msg) => (
                                <div
                                  key={msg.id}
                                  className="h-7 px-2 bg-amber-955/80 border border-amber-900 text-amber-300 rounded flex items-center gap-1 text-[10px] font-mono select-none animate-pulse"
                                >
                                  <Clock className="h-3 w-3 text-amber-500 animate-spin" />
                                  <span className="text-[8px] font-bold text-amber-400">#{msg.id.substring(4, 8) || msg.id.substring(0, 4)}</span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>

                      {/* notify_queue block */}
                      <div className="bg-[#07090E] rounded-lg p-3 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-300 font-mono">notify_queue</span>
                          <span className="text-[11px] font-semibold text-indigo-400 font-mono">durable : true</span>
                        </div>

                        {/* Visualizer Queue Slot Container */}
                        <div className="min-h-12 border border-dashed border-slate-800 rounded p-1.5 flex flex-wrap gap-1.5 items-center justify-start bg-[#05060A]">
                          {notifyQueueItems.length === 0 ? (
                            <span className="text-[9px] text-slate-500 italic mx-auto font-mono text-center">Queue Empty. Awaiting processed tasks...</span>
                          ) : (
                            <>
                              {notifyQueueItems.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`h-7 px-2 rounded flex items-center gap-1 border text-[10px] font-mono select-none ${
                                    msg.status === 'processing' ? 'bg-amber-955/80 border-amber-900 text-amber-300 animate-pulse' : 'bg-emerald-955/80 border border-emerald-900/60 text-emerald-300'
                                  }`}
                                >
                                  {msg.status === 'processing' ? <Clock className="h-3 w-3 text-amber-500 animate-spin" /> : <Check className="h-3.5 w-3.5 text-emerald-400" />}
                                  <span className="text-[8px] font-bold text-sky-400 font-mono">#{msg.id.substring(4, 8) || msg.id.substring(0, 4)}</span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Link arrow 2 */}
                    <div className="hidden md:flex md:col-span-1 flex-col items-center justify-center text-slate-600">
                      <ArrowRight className="h-5 w-5 animate-pulse text-indigo-500/50" />
                      <span className="text-[9px] font-mono text-slate-500 mt-1">ack / nack</span>
                    </div>

                    {/* 3. Multi-threaded Consumer Workers Task executing */}
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <div className="flex flex-col items-center bg-[#07090E] border border-slate-800 rounded-lg p-3 text-center shadow-xs">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2">
                          <Cpu className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-200">Consumer</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">Nest Worker Pool</span>
                      </div>

                      {/* Workers Thread visual representations */}
                      <div className="space-y-1">
                        {[1, 2, 3].map((workerId) => {
                          const isActive = activeWorkerId === workerId
                          return (
                            <div
                              key={workerId}
                              className={`rounded px-2.5 py-1 text-center transition-all border text-[9px] font-mono flex items-center justify-between ${
                                isActive ? 'bg-amber-600 text-white border-amber-500 font-semibold shadow-[0_0_10px_rgba(217,119,6,0.15)]' : 'bg-[#07090E] text-slate-500 border-slate-800'
                              }`}
                            >
                              <span>Thread #{workerId}</span>
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${isActive ? 'bg-amber-400 animate-ping' : 'bg-slate-800'}`}></span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Bottom explanations panel, in Airtable typography */}
                  <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400 leading-relaxed font-sans">
                    <div>
                      <span className="font-semibold text-white block mb-1">1. Ensures Idempotency</span>
                      Every publish receives a signed UUID. Sub-sequent checks safeguard against duplication inside our worker nodes.
                    </div>
                    <div>
                      <span className="font-semibold text-white block mb-1">2. Transactional Stability</span>
                      Under manual ACK options, event logs reside inside the MQ engine. Workers won't delete tasks until processes succeed.
                    </div>
                    <div>
                      <span className="font-semibold text-white block mb-1">3. Retry Strategy</span>
                      Failure intercepts trigger automated NACK requeue steps, replicating clean-architecture standards.
                    </div>
                  </div>
                </div>

                {/* 2. TRANSACTION PACKETS MONITOR */}
                <div className="bg-[#0D111A] border border-slate-800 rounded-xl shadow-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold flex items-center space-x-2 text-white">
                      <RefreshCw className="w-5 h-5 text-[#fcab79] animate-spin-slow" />
                      <span>{t.brokerMonitorTitle}</span>
                    </h3>
                    <span className="text-[10.5px] text-slate-400 font-mono tracking-wider">{t.brokerMonitorSubtitle}</span>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 italic">{t.brokerMonitorEmpty}</p>
                      </div>
                    ) : (
                      [...messages].reverse().map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-xl border text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all ${
                            msg.status === 'queued'
                              ? 'bg-orange-950/15 border-orange-900/40 text-orange-200'
                              : msg.status === 'broker_delivering'
                                ? 'bg-yellow-950/15 border-yellow-900/40 text-yellow-200'
                                : msg.status === 'processing'
                                  ? 'bg-blue-950/15 border-blue-900/40 text-blue-200'
                                  : msg.status === 'acked'
                                    ? 'bg-emerald-950/15 border-emerald-900/40 text-emerald-200'
                                    : msg.status === 'nacked'
                                      ? 'bg-red-950/15 border-red-900/40 text-red-200'
                                      : 'bg-slate-900/40 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <span className="font-mono font-bold text-[9px] uppercase bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-slate-300">UUID: {msg.id.slice(0, 8)}</span>
                              <span className="font-semibold text-xs text-slate-100">{msg.title}</span>
                              {msg.retryCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-amber-955/80 text-amber-400 border border-amber-900/40 text-[9px] font-semibold rounded animate-pulse">
                                  {t.brokerRetryTag} x{msg.retryCount}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed max-w-xl truncate">{msg.message}</p>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <span className="text-slate-600">METADATA:</span>
                              <span className="truncate max-w-md">{JSON.stringify(msg.metadata)}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-1.5 justify-center shrink-0 self-stretch md:self-auto border-t md:border-t-0 border-slate-800/60 pt-2 md:pt-0">
                            {/* Operational Status tags */}
                            <span className="text-[11px] font-semibold tracking-wide uppercase font-mono">
                              {msg.status === 'queued' && <span className="text-orange-400">{t.brokerStatusIntake}</span>}
                              {msg.status === 'broker_delivering' && <span className="text-yellow-405 text-yellow-455 text-yellow-400">{t.brokerStatusRouting}</span>}
                              {msg.status === 'processing' && <span className="text-sky-400">{t.brokerStatusWorker}</span>}
                              {msg.status === 'acked' && <span className="text-emerald-400">{t.brokerStatusAck}</span>}
                              {msg.status === 'nacked' && <span className="text-red-400">{t.brokerStatusNack}</span>}
                              {msg.status === 'dead_letter' && <span className="text-purple-400">{t.brokerStatusDead}</span>}
                            </span>

                            {/* Actions needed if manual ack is on */}
                            {msg.status === 'processing' && !consumerSettings.autoAck && (
                              <div className="flex space-x-1.5 mt-1">
                                <button
                                  onClick={() => manualAck(msg)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold tracking-wide transition-colors"
                                >
                                  ACK
                                </button>
                                <button
                                  onClick={() => manualNack(msg)}
                                  className="px-2.5 py-1 bg-red-650 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold tracking-wide transition-colors"
                                >
                                  NACK
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. STDOUT SYSTEM LOGGING CONSOLE TERMINAL */}
                <div className="bg-[#05060A]/95 rounded-xl overflow-hidden shadow-2xl border border-slate-800/80">
                  <div className="px-5 py-3 border-b border-slate-800/60 bg-[#0A0D14] flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal className="font-semibold text-[#fcab79] w-4 h-4" />
                      <span className="text-xs font-mono font-bold text-slate-100 tracking-wider">system_terminal_trace.log</span>
                    </div>
                    <button onClick={() => setLogs([])} className="text-[10px] text-slate-400 border border-slate-800 px-2 py-0.5 rounded hover:text-white hover:bg-slate-800 transition-colors">
                      {t.stdoutClearBtn}
                    </button>
                  </div>

                  <div ref={scrollRef} className="p-4 font-mono text-[11px] leading-relaxed h-[240px] overflow-y-auto space-y-2 text-slate-300">
                    {logs.length === 0 ? (
                      <p className="text-slate-500 italic text-center py-10">{t.stdoutNoStreams}</p>
                    ) : (
                      logs.map((log) => {
                        const serviceLower = log.service.toLowerCase()
                        let badgeColor = 'text-sky-455 text-sky-404 text-sky-400 bg-sky-955/40 border-sky-900/40'
                        if (serviceLower === 'broker' || serviceLower === 'rabbitmq') {
                          badgeColor = 'text-purple-400 bg-purple-950/40 border-purple-900/40'
                        } else if (serviceLower === 'consumer') {
                          badgeColor = 'text-amber-400 bg-amber-955/40 border-amber-900/40'
                        } else if (serviceLower === 'notification') {
                          badgeColor = 'text-indigo-400 bg-indigo-950/40 border-indigo-900/40'
                        } else if (serviceLower === 'producer') {
                          badgeColor = 'text-sky-400 bg-sky-955/40 border-sky-900/40'
                        } else {
                          badgeColor = 'text-slate-400 bg-slate-900/40 border-slate-800/40'
                        }

                        let levelIcon = <span className="text-slate-500">💡</span>
                        if (log.type === 'success' ? true : false) levelIcon = <span className="text-emerald-400">✅</span>
                        if (log.type === 'warn' ? true : false) levelIcon = <span className="text-amber-400">⚠️</span>
                        if (log.type === 'error' ? true : false) levelIcon = <span className="text-red-400">🚨</span>

                        return (
                          <div key={log.id} className="flex items-start space-x-2 border-b border-white/5 pb-1 select-all hover:bg-white/5 p-0.5 rounded">
                            <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                            <span className={`font-mono font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.2 select-none rounded border shrink-0 ${badgeColor}`}>{log.service}</span>
                            <span className="shrink-0">{levelIcon}</span>
                            <span
                              className={`flex-1 ${
                                log.type === 'success'
                                  ? 'text-green-400'
                                  : log.type === 'warn'
                                    ? 'text-yellow-350'
                                    : log.type === 'error'
                                      ? 'text-red-400 font-medium'
                                      : 'text-slate-250 text-slate-200'
                              }`}
                            >
                              {log.text}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT ASPECT SIDEBAR COLUMN: Payload Ingestion tool + subscribers roster + Mock Phone */}
              <div className="xl:col-span-4 space-y-6">
                {/* 1. EVENT INGESTION TOOL */}
                <div className="bg-[#0D111A] border border-slate-800 rounded-xl shadow-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold flex items-center space-x-2 text-white">
                      <Layers className="w-5 h-5 text-[#fcab79]" />
                      <span>{t.ingestPayloadTitle}</span>
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider text-slate-450 text-slate-400 font-bold">{t.producerApiLabel}</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.messageEventTitle}</label>
                      <input
                        type="text"
                        value={inputs.title}
                        onChange={(e) => setInputs({ ...inputs, title: e.target.value })}
                        className="w-full text-xs rounded-lg border border-slate-800 px-3 py-2 bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.payloadNotificationMessage}</label>
                      <textarea
                        rows={3}
                        value={inputs.message}
                        onChange={(e) => setInputs({ ...inputs, message: e.target.value })}
                        className="w-full text-xs rounded-lg border border-slate-800 px-3 py-2 bg-slate-950 text-slate-100 placeholder-slate-605 placeholder-slate-600 focus:outline-none focus:border-orange-500 leading-relaxed"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.contextJsonMetadata}</label>
                        <span className="text-[9px] text-slate-500 font-mono">JSON struct</span>
                      </div>
                      <textarea
                        rows={3}
                        value={inputs.metadata}
                        onChange={(e) => setInputs({ ...inputs, metadata: e.target.value })}
                        className="w-full text-xs font-mono rounded-lg border border-slate-800 px-3 py-2 bg-slate-950 text-slate-205 text-slate-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={dispatchMessage}
                    className="w-full py-2.5 bg-[#aa2d00] hover:bg-[#802200] active:scale-[0.99] text-white rounded-lg text-xs font-bold tracking-wider shadow transition-all flex items-center justify-center space-x-2 uppercase"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t.publishEventBtn}</span>
                  </button>
                </div>

                {/* 2. ACTIVE TELEGRAM SUBSCRIBERS ROSTER */}
                <div className="bg-[#0D111A] border border-slate-800 rounded-xl shadow-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold flex items-center space-x-2 text-[#34d399]">
                      <Users className="w-5 h-5" />
                      <span>
                        {t.subscribersRosterTitle} ({subscribers.length})
                      </span>
                    </h3>
                    <span className="text-[10px] uppercase tracking-widest text-[#34d399] bg-[#052e16]/60 border border-emerald-950 px-2 py-0.5 rounded font-mono">Real-time Poll</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{t.subscribersSubtitle}</p>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {subscribers.length === 0 ? (
                      <div className="p-5 border border-dashed border-slate-800 rounded-lg bg-[#05060A]/60 text-center space-y-1.5">
                        <p className="text-xs font-semibold text-slate-500">{t.subscribersEmpty}</p>
                        <p className="text-[11px] text-slate-400 leading-normal">{t.subscribersHelp}</p>
                      </div>
                    ) : (
                      subscribers.map((sub) => {
                        const isChecked = selectedChatIds.includes(sub.id)
                        return (
                          <div
                            key={sub.id}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedChatIds((prev) => prev.filter((id) => id !== sub.id))
                              } else {
                                setSelectedChatIds((prev) => [...prev, sub.id])
                              }
                            }}
                            className={`p-3 rounded-lg border cursor-pointer select-none transition-all flex items-center justify-between gap-3 ${
                              isChecked ? 'border-emerald-500 bg-emerald-950/20 text-emerald-200' : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // toggled on row click
                                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#0d111a] accent-emerald-500 bg-slate-950 border-slate-800"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-1.5 flex-wrap">
                                  <span className="font-bold text-xs truncate text-slate-100">{sub.name}</span>
                                  {sub.username && <span className="text-[10px] text-emerald-400 font-mono">@{sub.username}</span>}
                                </div>
                                <div className="flex flex-col text-[10px] text-slate-500 font-mono mt-0.5">
                                  <span>CHATID: {sub.id}</span>
                                  {sub.lastTextReceived && <span className="text-[10.5px] italic text-slate-400 font-sans mt-0.5 truncate max-w-xs block">«{sub.lastTextReceived}»</span>}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteSubscriber(sub.id)
                              }}
                              className="p-1 hover:bg-red-950/40 border border-transparent hover:border-red-900/50 rounded text-red-400 hover:text-red-300 transition-colors shrink-0"
                              title="Delete recipient"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* MINI FORM TO REGISTER MANUALLY */}
                  <form onSubmit={registerSubscriberManually} className="pt-3 border-t border-slate-800/80 space-y-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.subscribersManualRegisterTitle}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={t.subscribersManualChatIdPlaceholder}
                        value={newChatId}
                        onChange={(e) => setNewChatId(e.target.value)}
                        className="text-xs bg-slate-950 text-slate-100 border border-slate-800 rounded px-2.5 py-1.5 placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder={t.subscribersManualNamePlaceholder}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="text-xs bg-slate-950 text-slate-100 border border-slate-800 rounded px-2.5 py-1.5 placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isRegisteringSub || !newChatId}
                      className="w-full py-1.5 border border-slate-800 bg-[#05060A] hover:bg-slate-900 disabled:opacity-40 text-xs text-slate-200 font-semibold rounded flex items-center justify-center space-x-1 hover:text-white transition-colors"
                    >
                      <Plus className="w-3 h-3 text-emerald-400 font-bold" />
                      <span>{isRegisteringSub ? t.subscribersManualAddingBtn : t.subscribersManualAddBtn}</span>
                    </button>
                  </form>
                </div>

                {/* 3. CONSUMER FAULT INDUCTION DECK */}
                <div className="bg-[#0D111A] border border-slate-800 rounded-xl shadow-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold flex items-center space-x-2 text-slate-100">
                      <Terminal className="w-5 h-5 text-amber-500" />
                      <span>{t.faultDeckTitle}</span>
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{t.faultDeckLabel}</span>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Auto-acknowledge toggle */}
                    <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-800 bg-slate-900/50">
                      <div>
                        <span className="font-semibold block text-xs text-slate-200">{t.manualAckTitle}</span>
                        <span className="text-[11px] text-slate-400 font-sans">{t.manualAckDesc}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!consumerSettings.autoAck}
                          onChange={(e) => setConsumerSettings({ ...consumerSettings, autoAck: !e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-transparent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600" />
                      </label>
                    </div>

                    {/* Simulate network failure */}
                    <div
                      className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${
                        consumerSettings.simulateError ? 'border-red-900/60 bg-red-955/10 text-red-200' : 'border-slate-800 bg-slate-900/50 text-slate-350'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block text-xs text-slate-200">{t.simulateErrTitle}</span>
                        <span className="text-[11px] text-slate-400 font-sans">{t.simulateErrDesc}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={consumerSettings.simulateError}
                          onChange={(e) => setConsumerSettings({ ...consumerSettings, simulateError: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-transparent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600" />
                      </label>
                    </div>

                    {/* Delay settings */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-400">{t.consumerLatencyLabel}</span>
                        <span className="font-mono text-orange-400">{consumerSettings.processingDelayMs} ms</span>
                      </div>
                      <input
                        type="range"
                        min={300}
                        max={4000}
                        step={100}
                        value={consumerSettings.processingDelayMs}
                        onChange={(e) => setConsumerSettings({ ...consumerSettings, processingDelayMs: Number(e.target.value) })}
                        className="w-full accent-orange-500 cursor-pointer bg-slate-800 h-1.5 rounded-lg appearance-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TG TELEGRAM SCREEN PHONE DISPLAY EMULATOR */}
            <div className="bg-[#0D111A] rounded-xl border border-slate-800 p-8 mt-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-4">
                <div className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full font-bold border border-emerald-900/30">
                  <Bot className="w-3.5 h-3.5" />
                  <span>{t.virtualPhoneHeaderBadge}</span>
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-white">{t.virtualPhoneTitle}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{t.virtualPhoneDesc}</p>

                <div className="bg-[#05060A]/85 rounded-xl border border-slate-800/80 p-4 text-xs">
                  <h4 className="font-semibold text-xs mb-1.5 text-[#fcab79]">{t.virtualPhoneSetupGuideTitle}</h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 font-normal">
                    <li>{t.virtualPhoneGuideStep1}</li>
                    <li>{t.virtualPhoneGuideStep2}</li>
                    <li>{t.virtualPhoneGuideStep3}</li>
                  </ol>
                </div>
              </div>

              {/* PHONE MOCKUP */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-[300px] h-[480px] bg-slate-900 rounded-[36px] shadow-2xl overflow-hidden border-[8px] border-slate-950">
                  {/* Phone Speaker & Camera Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-slate-950 rounded-b-2xl z-20 flex justify-center items-start">
                    <span className="w-10 h-1 bg-slate-850 rounded-full mt-1.5" />
                  </div>

                  {/* Inside Screen Content */}
                  <div className="h-full bg-slate-950 p-4 pt-8 flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute inset-0 bg-slate-950/95 z-0" />

                    {/* Header */}
                    <div className="relative z-10 flex items-center justify-between border-b pb-2 mb-2 border-slate-800/80">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-sky-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">TG</div>
                        <div>
                          <p className="font-bold text-[11px] text-white">Microservice Alert Bot</p>
                          <p className="text-[9px] text-emerald-400 font-semibold">@nest_rmq_notification_bot</p>
                        </div>
                      </div>
                    </div>

                    {/* Messages Panel */}
                    <div className="relative z-10 flex-1 overflow-y-auto space-y-2 pr-1 pt-1 flex flex-col justify-end w-full">
                      {messages.filter((m) => m.status === 'acked' || m.status === 'processing').length === 0 ? (
                        <p className="text-slate-500 italic text-center py-10 text-[11px]">{t.phoneBotAwaiting}</p>
                      ) : (
                        messages
                          .filter((m) => m.status === 'acked' || m.status === 'processing')
                          .slice(-4)
                          .map((msgRef) => (
                            <div key={msgRef.id} className="bg-[#111622] rounded-xl p-3 shadow-sm border border-slate-800 max-w-[90%] text-[11px] text-slate-200 animate-slide-up self-start">
                              <div className="font-bold text-xs text-[#fcab79] flex items-center space-x-1 mb-1">
                                <span>🔔 {msgRef.title}</span>
                              </div>
                              <p className="leading-normal mb-1">{msgRef.message}</p>
                              <p className="text-[8px] text-slate-505 text-slate-500 text-right font-mono">
                                ID: {msgRef.id} • {new Date().toLocaleTimeString()}
                              </p>
                            </div>
                          ))
                      )}
                    </div>

                    {/* Bottom Phone Bar */}
                    <div className="relative z-10 pt-2 border-t border-slate-800/80 mt-2 flex items-center justify-between">
                      <div className="text-[9px] bg-[#05060A] border border-slate-800/80 text-slate-400 rounded-full w-full py-1 px-3 text-center">{t.phoneReadOnlyConsole}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-8" id="view_code">
            <div className="p-6 bg-[#0D111A] border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
              <div>
                <h2 className="text-lg font-semibold text-white">NestJS Web Ide & Microservices Workspace</h2>
                <p className="text-sm text-slate-300">This folder structure displays pristine production components obeying SOLID design patterns. Choose a file below to explore and clone.</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-[#aa2d00] hover:bg-[#802200] text-white rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-1.5 transition-colors shadow"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* SPLIT CODES SCREEN */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* File tree sidebar */}
              <div className="lg:col-span-4 bg-[#0D111A] border border-slate-800 rounded-xl p-4 space-y-4 shadow-xl">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 block uppercase">Project Files Tree</span>

                <div className="space-y-1.5">
                  {/* Root config blocks */}
                  <div className="font-semibold text-xs text-slate-400 uppercase tracking-wide flex items-center space-x-1 pl-1">
                    <Folder className="w-3.5 h-3.5 text-slate-400" />
                    <span>Workspace Configs</span>
                  </div>
                  {CODE_FILES.slice(0, 3).map((f) => (
                    <button
                      key={f.path}
                      onClick={() => setSelectedFile(f)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                        selectedFile.path === f.path ? 'bg-amber-955/25 text-[#fcab79] font-semibold border border-amber-900/40 shadow-sm' : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}

                  {/* Producer Service */}
                  <div className="pt-2 font-semibold text-xs text-slate-450 text-slate-400 uppercase tracking-wide flex items-center space-x-1 pl-1">
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>services/producer</span>
                  </div>
                  {CODE_FILES.slice(3, 9).map((f) => (
                    <button
                      key={f.path}
                      onClick={() => setSelectedFile(f)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                        selectedFile.path === f.path ? 'bg-amber-955/25 text-[#fcab79] font-semibold border border-amber-900/40 shadow-sm' : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 shrink-0 text-slate-500" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}

                  {/* Consumer Service */}
                  <div className="pt-2 font-semibold text-xs text-slate-450 text-slate-400 uppercase tracking-wide flex items-center space-x-1 pl-1">
                    <Folder className="w-3.5 h-3.5 text-[#aa2d00]" />
                    <span>services/consumer</span>
                  </div>
                  {CODE_FILES.slice(9, 13).map((f) => (
                    <button
                      key={f.path}
                      onClick={() => setSelectedFile(f)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                        selectedFile.path === f.path ? 'bg-amber-955/25 text-[#fcab79] font-semibold border border-amber-900/40 shadow-sm' : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 shrink-0 text-slate-500" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}

                  {/* Notification service */}
                  <div className="pt-2 font-semibold text-xs text-slate-450 text-slate-400 uppercase tracking-wide flex items-center space-x-1 pl-1">
                    <Folder className="w-3.5 h-3.5 text-emerald-500" />
                    <span>services/notification</span>
                  </div>
                  {CODE_FILES.slice(13, 17).map((f) => (
                    <button
                      key={f.path}
                      onClick={() => setSelectedFile(f)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                        selectedFile.path === f.path ? 'bg-amber-955/25 text-[#fcab79] font-semibold border border-amber-900/40 shadow-sm' : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 shrink-0 text-slate-500" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Code viewer pane */}
              <div className="lg:col-span-8 bg-[#0D111A] rounded-xl overflow-hidden shadow-xl border border-slate-800 flex flex-col">
                <div className="px-5 py-3 border-b border-slate-800/80 bg-[#05060A]/95 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex space-x-1.5">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                      <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    </div>
                    <span className="font-mono text-xs text-slate-350 select-all">{selectedFile.path}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-semibold">{selectedFile.language}</span>
                </div>

                <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto text-slate-300 max-h-[580px]">
                  <pre className="select-all">
                    {selectedFile.content.split('\n').map((line, idx) => (
                      <div key={idx} className="flex">
                        <span className="text-slate-600 w-8 inline-block select-none text-right pr-3">{idx + 1}</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-8">
            {/* SIGNATURE CORAL CARD FOR HIGH-VOLTAGE ARCHITECTURE */}
            <div className="p-8 rounded-xl bg-[#aa2d00] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center space-x-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                  <Sparkles className="w-4.5 h-4.5" />
                  <span>SOLID & SOLID-Clean Principles Architecture</span>
                </div>
                <h2 className="text-3xl font-semibold tracking-tight">Microservices Architecture Manifesto</h2>
                <p className="text-white/80 text-sm leading-relaxed">
                  We decouple our services following single responsibilities. The <strong>Producer Service</strong> does not share data structures, file layers, or memory space with the{' '}
                  <strong>Consumer</strong>; they synchronize entirely through standard AMQP streams. This creates zero point bottlenecks, massive horizontal scaling options, and robust error
                  fallback.
                </p>
              </div>
              <button onClick={() => setActiveTab('code')} className="px-6 py-3 bg-white text-[#aa2d00] hover:bg-gray-100 font-bold rounded-lg text-sm transition-colors whitespace-nowrap">
                Inspect Files Tree
              </button>
            </div>

            {/* DETAILED INFO GRIDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="bg-[#0D111A] border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
                <h3 className="text-lg font-semibold flex items-center space-x-2 text-white">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Idempotency Mechanisms</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">In distributed systems, networks can drop, duplicate, or re-deliver packets. Our architecture guarantees idempotency:</p>
                <ul className="space-y-2 text-xs text-slate-300 leading-relaxed font-normal">
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-[#fcab79] shrink-0 mt-0.5" />
                    <span>Every ingested event triggers a unique UUID generated by the Producer.</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-[#fcab79] shrink-0 mt-0.5" />
                    <span>The database or Consumer caches these transaction signatures during processing.</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-[#fcab79] shrink-0 mt-0.5" />
                    <span>Duplicate packages arriving with active matching GUID tokens are automatically skipped or served from cache, preventing duplicate alerts to the customer.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#0D111A] border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
                <h3 className="text-lg font-semibold flex items-center space-x-2 text-white">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Broker Error Recovery & Requeuing</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">What happens when third-party servers (like Telegram Bot endpoints) collapse temporarily?</p>
                <ul className="space-y-2 text-xs text-slate-300 leading-relaxed font-normal">
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-[#fcab79] shrink-0 mt-0.5" />
                    <span>
                      With <strong>noAck: false</strong>, RabbitMQ preserves the message until the Consumer sends an explicit <code>ack</code> code.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-[#fcab79] shrink-0 mt-0.5" />
                    <span>
                      If operations fail, we issue a <code>nack</code> with <code>requeue: true</code>, putting the message back to try again later.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-[#fcab79] shrink-0 mt-0.5" />
                    <span>
                      After 3 retry failures, we discard or direct messages to a <strong>Dead-Letter Queue (DLX)</strong> for operator debugging and diagnostics, keeping queues clean.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* DOCKER COMPOSE CONFIG GUIDE */}
            <div className="bg-[#0D111A] border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-semibold flex items-center space-x-2 text-white">
                <Layers className="w-5 h-5 text-[#fcab79]" />
                <span>Docker-Compose Deployment Guide</span>
              </h3>
              <p className="text-sm text-slate-300">
                We use Docker Compose to bind all microservices and dependency networks under a single operational environment. To launch the whole project locally:
              </p>

              <div className="bg-[#05060A]/95 border border-slate-800/80 rounded-lg p-4 font-mono text-xs space-y-2 text-slate-300">
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
        )}
      </main>

      {/* 5. FOOTER */}
      <footer className="bg-[#05060A]/95 border-t border-slate-800 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-[#aa2d00] flex items-center justify-center text-white font-bold text-xs shadow-sm">N</div>
            <span className="font-semibold text-xs tracking-wide text-slate-405 text-slate-400">NestJS Microservices Workspace • Crafted in AI Studio Build</span>
          </div>
          <p className="text-xs text-slate-505 text-slate-500 font-medium">Project License: GPL-3.0-or-later • Solid clean code blocks pre-compiled</p>
        </div>
      </footer>
    </div>
  )
}

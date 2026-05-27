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
  Plus
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

export default function App() {
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
    metadata: '{\n  "priority": "high",\n  "department": "fulfillment"\n}'
  })

  // Configuration (Telegram Setup - stored in localStorage for safety)
  const [tgConfig, setTgConfig] = useState({
    token: localStorage.getItem('TELEGRAM_BOT_TOKEN') || '',
    chatId: localStorage.getItem('TELEGRAM_CHAT_ID') || ''
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
      text: 'NestJS microservices initialization sequence completed successfully.'
    },
    {
      id: 'init-2',
      timestamp: new Date(Date.now() - 2000).toLocaleTimeString(),
      service: 'Broker',
      type: 'success',
      text: 'RabbitMQ connection ready on port 5672. Exchanges [amq.direct] and queues [tasks_queue, notify_queue] verified.'
    },
    {
      id: 'init-3',
      timestamp: new Date(Date.now() - 1000).toLocaleTimeString(),
      service: 'Consumer',
      type: 'info',
      text: 'Consumer module bound. Manual Acknowledgment flag (noAck: false) engaged.'
    }
  ])

  // Simulation settings
  const [consumerSettings, setConsumerSettings] = useState({
    autoAck: true,
    simulateError: false,
    processingDelayMs: 1500
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
          name: newName.trim() || `User ${newChatId}`
        })
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
        body: JSON.stringify({ id: idToDelete })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSubscribers(data.subscribers)
          setSelectedChatIds(prev => prev.filter(id => id !== idToDelete))
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
  const addLog = (
    service: SimulationLog['service'],
    type: SimulationLog['type'],
    text: string
  ) => {
    const newLog: SimulationLog = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      service,
      type,
      text
    }
    setLogs(prev => [newLog, ...prev].slice(0, 50)) // limit to 50 logs the UI handles beautifully
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
      retryCount: 0
    }

    // 1. PRODUCER LOGS
    addLog('Producer', 'info', `REST Request parsed successfully. Generated Idempotency signature: ${uuid}`)
    addLog('Producer', 'info', `Serializing payload to JSON envelope. Publishing payload to Exchange [amq.direct] queue [tasks_queue]`)
    setSentCount(prev => prev + 1)
    setMessages(prev => [...prev, newMsg])

    // Wait slightly to pass through RabbitMQ
    setTimeout(() => {
      brokerDelivering(newMsg)
    }, 800)
  }

  // 2. RABBITMQ BROKER TRANSITIONS
  const brokerDelivering = (msg: SimulatedMessage) => {
    setMessages(prev =>
      prev.map(m => (m.id === msg.id ? { ...m, status: 'broker_delivering' } : m))
    )
    addLog('Broker', 'info', `Message delivery initiated. Routing key matches binding pattern 'process_task' for envelope ${msg.id}`)

    setTimeout(() => {
      consumeMessage(msg)
    }, 800)
  }

  // 3. CONSUMER SERVICE LOGIC & ACKING
  const consumeMessage = async (msg: SimulatedMessage) => {
    setMessages(prev =>
      prev.map(m => (m.id === msg.id ? { ...m, status: 'processing' } : m))
    )
    addLog('Consumer', 'info', `Message received from tasks_queue. Spawning Thread Worker for UUID: ${msg.id}`)

    // Check if error simulation is checked
    const delay = consumerSettings.processingDelayMs
    setTimeout(async () => {
      if (consumerSettings.simulateError) {
        // Consumer handles error & NACK
        setNackedCount(prev => prev + 1)
        addLog('Consumer', 'error', `Exception caught! Simulating DB connection constraint block during process for task ${msg.id}`)
        
        if (msg.retryCount < 2) {
          // Send NACK with requeue=true
          const retriedMsg = { ...msg, retryCount: msg.retryCount + 1, status: 'queued' as const }
          addLog('Broker', 'warn', `Consumer issued NACK for task ${msg.id}. Re-queueing envelope to Head. Retry attempt #${retriedMsg.retryCount}`)
          
          setMessages(prev =>
            prev.map(m => (m.id === msg.id ? retriedMsg : m))
          )
          // Re-process
          setTimeout(() => {
            brokerDelivering(retriedMsg)
          }, 1200)
        } else {
          // Exceeded retry count, send to dead letter queue
          setDeadLetterCount(prev => prev + 1)
          addLog('Broker', 'error', `Consumer NACK limit threshold exceeded for ${msg.id}. Diverting message envelope to Dead-Letter-Exchange [amq.dlx] -> dead_letter_queue`)
          setMessages(prev =>
            prev.map(m => (m.id === msg.id ? { ...m, status: 'dead_letter' } : m))
          )
        }
      } else {
        // Success case. Trigger Notification workflow
        if (consumerSettings.autoAck) {
          addLog('Consumer', 'success', `Consumer processing complete for event ${msg.id}. Dispatched ACK token.`)
          setAckedCount(prev => prev + 1)
          setMessages(prev =>
            prev.map(m => (m.id === msg.id ? { ...m, status: 'acked' } : m))
          )
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
    setAckedCount(prev => prev + 1)
    setMessages(prev =>
      prev.map(m => (m.id === msg.id ? { ...m, status: 'acked' } : m))
    )
    triggerNotificationService(msg)
  }

  // Force manual discard (NACK)
  const manualNack = (msg: SimulatedMessage) => {
    addLog('Consumer', 'error', `Operator manually issued NACK command for transaction ${msg.id}.`)
    setNackedCount(prev => prev + 1)
    setMessages(prev =>
      prev.map(m => (m.id === msg.id ? { ...m, status: 'nacked' } : m))
    )
  }

  // 4. TELEGRAM NOTIFICATION DISPATCH (REAL OR SIMULATED MULTI-RECEIVER BROADCAST)
  const triggerNotificationService = async (msg: SimulatedMessage) => {
    addLog('Notification', 'info', `Consuming alert request from notify_queue corresponding to processed task ID: ${msg.id}`)
    
    // We utilize the local /api/telegram/send endpoint to handle this securely with CORS bypass
    const passedToken = tgConfig.token === 'SERVER_ENV_TOKEN_ACTIVE' ? '' : tgConfig.token

    // Compile targets. Default to all selected checking checkboxes, otherwise fallback to standard default chatId setup
    const activeTargets = selectedChatIds.length > 0
      ? selectedChatIds
      : subscribers.length > 0 
        ? subscribers.map(s => s.id) 
        : [tgConfig.chatId === 'SERVER_ENV_CHAT_ID_ACTIVE' ? '' : tgConfig.chatId].filter(id => id !== '');

    if (activeTargets.length === 0) {
      setTelegramStatus('simulated')
      addLog('Notification', 'info', `Sandbox preview: No active receivers found. Delivery simulated in virtual smartphone on right!`)
      return;
    }

    addLog('Notification', 'info', `Dispatching real-time notifications to ${activeTargets.length} recipient(s)...`)

    let successes = 0;
    let errors: string[] = [];

    for (const targetId of activeTargets) {
      try {
        const passedChatId = targetId === 'SERVER_ENV_CHAT_ID_ACTIVE' ? '' : targetId;
        const response = await fetch('/api/telegram/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: passedToken,
            chatId: passedChatId,
            id: msg.id,
            title: msg.title,
            message: msg.message
          })
        });

        if (response.ok) {
          const outcome = await response.json();
          if (outcome.delivered) {
            successes += outcome.deliveredCount || 1;
          } else {
            errors.push(outcome.reason || 'Not delivered');
          }
        } else {
          errors.push(`Status ${response.status}`);
        }
      } catch (err: any) {
        errors.push(err.message || String(err));
      }
    }

    if (successes > 0) {
      setTelegramStatus('success')
      addLog('Notification', 'success', `✨ LIVE Telegram alert delivered! Notification sent to ${successes} recipient(s) in chat! (UUID: ${msg.id})`)
      fetchSubscribersList(); // Refresh their status
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
            // If server-side API or polling detected a chat ID, grab it!
            setTgConfig(prev => {
              const newToken = prev.token || 'SERVER_ENV_TOKEN_ACTIVE';
              const newChatId = prev.chatId || (cfg.chatIdVal ? cfg.chatIdVal : 'SERVER_ENV_CHAT_ID_ACTIVE');
              
              if (cfg.chatIdVal && prev.chatId !== cfg.chatIdVal && !subscribers.some(s => s.id === cfg.chatIdVal)) {
                addLog('System', 'success', `✨ Получен числовой Chat ID от Telegram: ${cfg.chatIdVal}! Подключение установлено!`);
              }
              return {
                token: newToken,
                chatId: newChatId
              };
            });
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
    const configInterval = setInterval(checkServerConfig, 3000);
    const subInterval = setInterval(fetchSubscribersList, 3000);

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
          retryCount: 0
        }
      ])
      setSentCount(1)
      setAckedCount(1)
    }

    return () => {
      clearInterval(configInterval);
      clearInterval(subInterval);
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-[#181d26] font-sans antialiased selection:bg-[#fcab79] selection:text-[#aa2d00]">
      {/* 1. TOP NAV - Airtable Pure Light Mode Styling */}
      <nav id="top-nav" className="sticky top-0 z-50 h-16 bg-white border-b border-[#dddddd] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {/* Airtable Signature Visual Grid Icon & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#aa2d00] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                N
              </div>
              <span className="font-semibold text-lg tracking-tight text-[#181d26]">
                {t.workspaceTitle}
              </span>
            </div>
            
            {/* Nav links */}
            <div className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('playground')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'playground'
                    ? 'text-[#aa2d00] bg-[#fdf2f2] font-semibold'
                    : 'text-[#333840] hover:text-[#181d26]'
                }`}
              >
                {t.interactivePlayground}
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'code'
                    ? 'text-[#aa2d00] bg-[#fdf2f2] font-semibold'
                    : 'text-[#333840] hover:text-[#181d26]'
                }`}
              >
                {t.sourceCodeIde}
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'docs'
                    ? 'text-[#aa2d00] bg-[#fdf2f2] font-semibold'
                    : 'text-[#333840] hover:text-[#181d26]'
                }`}
              >
                {t.documentation}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Toggle Selector */}
            <div className="flex bg-gray-100 p-1 rounded-lg border border-[#dddddd] items-center text-[11px]">
              <button
                onClick={() => {
                  setLang('ru');
                  localStorage.setItem('APP_LANGUAGE', 'ru');
                }}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  lang === 'ru' ? 'bg-[#aa2d00] text-white shadow-sm' : 'text-gray-600 hover:text-black'
                }`}
              >
                RU
              </button>
              <button
                onClick={() => {
                  setLang('en');
                  localStorage.setItem('APP_LANGUAGE', 'en');
                }}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  lang === 'en' ? 'bg-[#aa2d00] text-white shadow-sm' : 'text-gray-600 hover:text-black'
                }`}
              >
                EN
              </button>
            </div>

            {/* Telegram config indicator */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-colors ${
                tgConfig.token 
                  ? 'border-[#006400] text-[#006400] bg-[#e6f4ea]' 
                  : 'border-[#dddddd] text-[#333840] bg-white hover:bg-gray-50'
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
              className="px-4 py-1.5 rounded-lg bg-[#181d26] text-white text-xs font-semibold tracking-wide hover:bg-[#0d1218] transition-colors"
            >
              {t.copySourceCodeBtn}
            </a>
          </div>
        </div>
      </nav>

      {/* 2. HERO BAND - Generous Minimalist Breathing Room */}
      <header className="py-12 bg-[#f8fafc] border-b border-[#dddddd]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f5e9d4] border border-[#d9a441] text-[#aa2d00] text-xs font-semibold mb-4">
              <Cpu className="w-3.5 h-3.5" />
              <span>{t.heroTechBadge}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-[#181d26] leading-tight mb-4">
              {t.heroHeaderFirst} <span className="font-semibold text-[#aa2d00]">{t.heroHeaderAccent}</span>
            </h1>
            <p className="text-base text-[#333840] leading-relaxed mb-6">
              {t.heroDesc}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('playground')}
                className="px-6 py-3 bg-[#181d26] hover:bg-[#0d1218] text-white font-medium rounded-lg text-sm transition-all inline-flex items-center space-x-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t.runSignalBtn}</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className="px-6 py-3 bg-white border border-[#dddddd] text-[#181d26] hover:bg-gray-50 font-medium rounded-lg text-sm transition-all inline-flex items-center space-x-2"
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
        <div className="fixed inset-0 z-50 bg-[#181d26]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-[#dddddd]">
            <div className="px-6 py-4 border-b border-[#dddddd] bg-gray-50 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-[#aa2d00]" />
                <span className="font-semibold text-base">{t.botDialogTitle}</span>
              </div>
              <button 
                onClick={() => setShowConfig(false)}
                className="text-[#717680] hover:text-[#181d26] text-xl font-bold"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={saveTelegramConfig} className="p-6 space-y-4">
              <div className="p-3 bg-[#f5e9d4] text-[#aa2d00] rounded-lg border border-[#e0cbaf] text-xs leading-relaxed">
                <strong>{t.botSecureLabel}</strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181d26] uppercase tracking-wider mb-1">
                  {t.botTokenLabel}
                </label>
                <input
                  type="password"
                  placeholder={t.botTokenPlaceholder}
                  id="bot-token-input"
                  value={tgConfig.token}
                  onChange={(e) => setTgConfig({ ...tgConfig, token: e.target.value })}
                  className="w-full text-sm rounded-lg border border-[#dddddd] px-3 py-2.5 bg-white text-[#181d26] focus:outline-none focus:border-[#aa2d00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181d26] uppercase tracking-wider mb-1">
                  {t.botChatIdLabel}
                </label>
                <input
                  type="text"
                  placeholder={t.botChatIdPlaceholder}
                  id="chat-id-input"
                  value={tgConfig.chatId}
                  onChange={(e) => setTgConfig({ ...tgConfig, chatId: e.target.value })}
                  className="w-full text-sm rounded-lg border border-[#dddddd] px-3 py-2.5 bg-white text-[#181d26] focus:outline-none focus:border-[#aa2d00]"
                />
                <span className="text-[11px] text-[#717680] mt-1 block">
                  {t.botChatIdDesc}
                </span>
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
                  className="bg-gray-100 hover:bg-gray-200 text-[#333840] py-2 px-3 rounded-lg font-medium text-xs transition-colors"
                >
                  {t.botClearBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MAIN PLAYGROUND CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === 'playground' && (
          <div className="space-y-12">
            {/* INTERACTIVE WORKFLOW MAP */}
            <section className="bg-white border border-[#dddddd] rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-[#dddddd] bg-gray-50 flex justify-between items-center">
                <span className="font-semibold text-sm tracking-wide text-[#333840]">
                  {t.architectureTitle}
                </span>
                <span className="flex items-center space-x-1.5 text-xs text-[#0d9488]">
                  <span className="w-2 h-2 rounded-full bg-[#0d9488] animate-ping" />
                  <span className="font-semibold">{t.brokerNetworkOnline}</span>
                </span>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
                {/* Visual flowchart connections for Desktop */}
                <div className="hidden lg:block absolute top-[43%] left-[22%] w-[12%] h-[2px] bg-dashed-border" />
                <div className="hidden lg:block absolute top-[43%] left-[47%] w-[12%] h-[2px] bg-dashed-border" />
                <div className="hidden lg:block absolute top-[43%] left-[72%] w-[12%] h-[2px] bg-dashed-border" />

                {/* Node 1: Producer API */}
                <div className="border border-[#dddddd] rounded-xl p-5 bg-[#fafafa] flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-[#717680] uppercase">{t.producerNodeTitle}</span>
                    <span className="px-2 py-0.5 bg-[#e0f2fe] text-[#0369a1] text-[10px] font-bold rounded">Fastify API</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1">nest-producer</h3>
                    <p className="text-xs text-[#717680]">
                      {t.producerNodeDesc}
                    </p>
                    <div className="mt-2 text-xs font-mono bg-white p-1.5 rounded border border-[#dddddd]">
                      {t.producerExchangeLabel}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#dddddd] flex items-center justify-between text-xs">
                    <span className="text-[#717680]">{t.producerTotalDispatched}</span>
                    <span className="font-mono font-bold">{sentCount}</span>
                  </div>
                </div>

                {/* Node 2: Message queue RabbitMQ */}
                <div className="ring-2 ring-[#aa2d00] ring-offset-2 rounded-xl p-5 bg-[#fcab79]/5 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-[#aa2d00] uppercase">{t.brokerNodeTitle}</span>
                    <span className="px-2 py-0.5 bg-[#ffedd5] text-[#aa2d00] text-[10px] font-bold rounded">AMQP 3.13</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1 text-[#aa2d00] flex items-center space-x-1.5">
                      <Database className="w-4.5 h-4.5 text-[#aa2d00]" />
                      <span>Message Broker</span>
                    </h3>
                    <p className="text-xs text-[#717680]">
                      {t.brokerNodeDesc}
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[11px] font-mono bg-white p-1 rounded border border-[#dddddd]">
                        <span className="text-[#333840]">{t.brokerTasksQueue}</span>
                        <span className="text-[#aa2d00] font-bold">
                          {messages.filter(m => m.status === 'queued' || m.status === 'broker_delivering').length}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] font-mono bg-white p-1 rounded border border-[#dddddd]">
                        <span className="text-[#333840]">{t.brokerNotifyQueue}</span>
                        <span className="text-[#0a2e0e] font-bold">
                          {messages.filter(m => m.status === 'processing').length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#e0cbaf] flex items-center justify-between text-xs">
                    <span className="text-[#717680]">{t.brokerDLXCount}</span>
                    <span className="font-mono font-bold text-red-600">{deadLetterCount}</span>
                  </div>
                </div>

                {/* Node 3: Consumer Worker */}
                <div className="border border-[#dddddd] rounded-xl p-5 bg-[#fafafa] flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-[#717680] uppercase">{t.consumerNodeTitle}</span>
                    <span className="px-2 py-0.5 bg-[#e0e7ff] text-[#4338ca] text-[10px] font-bold rounded">Event Processor</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1">nest-consumer</h3>
                    <p className="text-xs text-[#717680]">
                      {t.consumerNodeDesc}
                    </p>
                    <div className="mt-2 text-xs font-mono bg-white p-1.5 rounded border border-[#dddddd]">
                      {t.consumerQueueLabel}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#dddddd] flex items-center justify-between text-xs">
                    <span className="text-[#717680]">{t.consumerAckNackLabel}</span>
                    <span className="font-mono font-bold text-[#181d26]">
                      {ackedCount} <span className="text-gray-400">/</span> <span className="text-red-500">{nackedCount}</span>
                    </span>
                  </div>
                </div>

                {/* Node 4: Telegram Integrator */}
                <div className="border border-[#dddddd] rounded-xl p-5 bg-[#0a2e0e]/5 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-[#0a2e0e] uppercase">{t.telegramGatewayTitle}</span>
                    <span className="px-2 py-0.5 bg-[#dcfce7] text-[#15803d] text-[10px] font-bold rounded">Bot API</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1 text-[#0a2e0e] flex items-center space-x-1.5">
                      <Bot className="w-4.5 h-4.5 text-[#0a2e0e]" />
                      <span>nest-notification</span>
                    </h3>
                    <p className="text-xs text-[#717680]">
                      {t.telegramGatewayDesc}
                    </p>
                    <div className="mt-2 text-[11px] leading-relaxed">
                      {t.telegramStatusLabel}{' '}
                      {telegramStatus === 'idle' && <span className="text-gray-400 font-semibold">{t.telegramStatusIdle}</span>}
                      {telegramStatus === 'simulated' && <span className="text-[#0a2e0e] font-semibold">{t.telegramStatusSimulated}</span>}
                      {telegramStatus === 'success' && <span className="text-green-600 font-semibold">{t.telegramStatusSuccess}</span>}
                      {telegramStatus === 'failed' && <span className="text-red-600 font-semibold">{t.telegramStatusFailed}</span>}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#c6dfc9] flex items-center justify-between text-xs">
                    <span className="text-[#717680]">{t.telegramConfigLabel}</span>
                    <span className="text-[11px] font-semibold text-[#0a2e0e]">
                      {tgConfig.token ? t.telegramConfigReal : t.telegramConfigSandbox}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* TWO COLUMN GRID: INPUT & DIAGNOSTIC SIMULATOR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT COLUMN (Span 5): Control Inputs & Settings */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* EVENT INGESTION FORM (PRODUCER CORES) */}
                <div className="bg-white border border-[#dddddd] rounded-xl shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center space-x-2">
                      <Layers className="w-5 h-5 text-[#aa2d00]" />
                      <span>{t.ingestPayloadTitle}</span>
                    </h2>
                    <span className="text-[11px] uppercase tracking-widest text-[#717680] font-bold">{t.producerApiLabel}</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#181d26] uppercase tracking-wider mb-1">
                        {t.messageEventTitle}
                      </label>
                      <input
                        type="text"
                        value={inputs.title}
                        onChange={(e) => setInputs({ ...inputs, title: e.target.value })}
                        className="w-full text-sm rounded-lg border border-[#dddddd] px-3 py-2 bg-white text-[#181d26] focus:outline-none focus:border-[#aa2d00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#181d26] uppercase tracking-wider mb-1">
                        {t.payloadNotificationMessage}
                      </label>
                      <textarea
                        rows={3}
                        value={inputs.message}
                        onChange={(e) => setInputs({ ...inputs, message: e.target.value })}
                        className="w-full text-sm rounded-lg border border-[#dddddd] px-3 py-2 bg-white text-[#181d26] focus:outline-none focus:border-[#aa2d00]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-[#181d26] uppercase tracking-wider">
                          {t.contextJsonMetadata}
                        </label>
                        <span className="text-[10px] text-gray-400 font-mono">JSON format</span>
                      </div>
                      <textarea
                        rows={4}
                        value={inputs.metadata}
                        onChange={(e) => setInputs({ ...inputs, metadata: e.target.value })}
                        className="w-full text-sm font-mono rounded-lg border border-[#dddddd] px-3 py-2 bg-gray-50 text-gray-800 focus:outline-none focus:border-[#aa2d00]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={dispatchMessage}
                    className="w-full py-3 bg-[#aa2d00] hover:bg-[#802200] text-white rounded-lg text-sm font-semibold tracking-wide shadow transition-all flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t.publishEventBtn}</span>
                  </button>
                </div>

                {/* ACTIVE TELEGRAM SUBSCRIBERS ROSTER */}
                <div className="bg-white border border-[#dddddd] rounded-xl shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center space-x-2 text-[#0a2e0e]">
                      <Users className="w-5 h-5" />
                      <span>{t.subscribersRosterTitle} ({subscribers.length})</span>
                    </h2>
                    <span className="text-[11px] uppercase tracking-widest text-[#0a2e0e] bg-emerald-100 rounded px-2 py-0.5 font-bold">
                      Polling Active
                    </span>
                  </div>

                  <p className="text-xs text-[#717680] leading-relaxed">
                    {t.subscribersSubtitle}
                  </p>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {subscribers.length === 0 ? (
                      <div className="p-4 border border-dashed border-[#dddddd] rounded-lg bg-gray-50 text-center space-y-1.5">
                        <p className="text-xs text-semibold text-gray-400">{t.subscribersEmpty}</p>
                        <p className="text-[11px] text-[#717680] leading-normal">
                          {t.subscribersHelp}
                        </p>
                      </div>
                    ) : (
                      subscribers.map((sub) => {
                        const isChecked = selectedChatIds.includes(sub.id);
                        return (
                          <div
                            key={sub.id}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedChatIds(prev => prev.filter(id => id !== sub.id));
                              } else {
                                setSelectedChatIds(prev => [...prev, sub.id]);
                              }
                            }}
                            className={`p-3 rounded-lg border cursor-pointer select-none transition-all flex items-center justify-between gap-3 ${
                              isChecked 
                                ? 'border-[#0a2e0e] bg-emerald-50/40 text-emerald-950 shadow-sm' 
                                : 'border-[#dddddd] bg-white hover:bg-gray-50 text-gray-800'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // toggled on row click
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-[#0a2e0e]"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-xs truncate">
                                    {sub.name}
                                  </span>
                                  {sub.username && (
                                    <span className="text-[10px] text-emerald-700 font-mono">
                                      @{sub.username}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col text-[10px] text-gray-500 font-mono mt-0.5">
                                  <span>ID: {sub.id}</span>
                                  {sub.lastTextReceived && (
                                    <span className="text-[10.5px] italic text-slate-700 font-sans mt-0.5 truncate max-w-xs">
                                      «{sub.lastTextReceived}»
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSubscriber(sub.id);
                              }}
                              className="p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-800 transition-colors"
                              title="Delete recipient"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* MINI FORM TO REGISTER MANUALLY */}
                  <form onSubmit={registerSubscriberManually} className="pt-3 border-t border-[#dddddd] space-y-2">
                    <span className="block text-[11px] font-semibold text-gray-500 uppercase">{t.subscribersManualRegisterTitle}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={t.subscribersManualChatIdPlaceholder}
                        value={newChatId}
                        onChange={(e) => setNewChatId(e.target.value)}
                        className="text-xs bg-white text-gray-800 border border-[#dddddd] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#aa2d00]"
                      />
                      <input
                        type="text"
                        placeholder={t.subscribersManualNamePlaceholder}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="text-xs bg-white text-gray-800 border border-[#dddddd] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#aa2d00]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isRegisteringSub || !newChatId}
                      className="w-full py-1.5 border border-[#dddddd] bg-[#fafafa] hover:bg-gray-100 disabled:opacity-50 text-xs text-gray-800 font-semibold rounded flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isRegisteringSub ? t.subscribersManualAddingBtn : t.subscribersManualAddBtn}</span>
                    </button>
                  </form>
                </div>

                {/* CONSUMER FAULT INDUCTION DECK */}
                <div className="bg-white border border-[#dddddd] rounded-xl shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center space-x-2 text-[#333840]">
                      <Terminal className="w-5 h-5" />
                      <span>{t.faultDeckTitle}</span>
                    </h2>
                    <span className="text-[11px] uppercase tracking-widest text-[#717680] font-bold">{t.faultDeckLabel}</span>
                  </div>

                  <div className="space-y-4 text-sm">
                    {/* Auto-acknowledge toggle */}
                    <div className="flex items-center justify-between p-3.5 rounded-lg border border-[#dddddd] bg-[#fafafa]">
                      <div>
                        <span className="font-semibold block text-xs">{t.manualAckTitle}</span>
                        <span className="text-[11px] text-[#717680]">
                          {t.manualAckDesc}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!consumerSettings.autoAck}
                          onChange={(e) => setConsumerSettings({ ...consumerSettings, autoAck: !e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 hover:bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#aa2d00]" />
                      </label>
                    </div>

                    {/* Simulate network failure */}
                    <div className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${
                      consumerSettings.simulateError 
                        ? 'border-red-300 bg-red-50 text-[#802200]' 
                        : 'border-[#dddddd] bg-white text-[#181d26]'
                    }`}>
                      <div>
                        <span className="font-semibold block text-xs">{t.simulateErrTitle}</span>
                        <span className="text-[11px] text-[#717680]">
                          {t.simulateErrDesc}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consumerSettings.simulateError}
                          onChange={(e) => setConsumerSettings({ ...consumerSettings, simulateError: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 hover:bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600" />
                      </label>
                    </div>

                    {/* Delay settings */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>{t.consumerLatencyLabel}</span>
                        <span className="font-mono text-[#aa2d00]">{consumerSettings.processingDelayMs} milliseconds</span>
                      </div>
                      <input
                        type="range"
                        min={300}
                        max={4000}
                        step={100}
                        value={consumerSettings.processingDelayMs}
                        onChange={(e) => setConsumerSettings({ ...consumerSettings, processingDelayMs: Number(e.target.value) })}
                        className="w-full accent-[#aa2d00]"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN (Span 7): Queue monitor + Live logs + Telegram Mock Phone */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* ACTIVE MESSAGE QUEUE TRACKER */}
                <div className="bg-white border border-[#dddddd] rounded-xl shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center space-x-2">
                      <RefreshCw className="w-5 h-5 text-[#aa2d00]" />
                      <span>{t.brokerMonitorTitle}</span>
                    </h2>
                    <span className="text-[10px] text-[#717680] font-mono">{t.brokerMonitorSubtitle}</span>
                  </div>

                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                    {messages.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-[#dddddd] rounded-lg">
                        <p className="text-sm text-[#717680]">{t.brokerMonitorEmpty}</p>
                      </div>
                    ) : (
                      [...messages].reverse().map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-lg border text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all ${
                            msg.status === 'queued' ? 'bg-orange-50 border-orange-200 text-orange-950' :
                            msg.status === 'broker_delivering' ? 'bg-yellow-50 border-yellow-200 text-yellow-950' :
                            msg.status === 'processing' ? 'bg-blue-50 border-blue-200 text-blue-950' :
                            msg.status === 'acked' ? 'bg-green-50 border-green-200 text-green-950' :
                            msg.status === 'nacked' ? 'bg-red-50 border-red-200 text-red-950' :
                            'bg-gray-100 border-gray-300 text-gray-800'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-semibold text-[10px] uppercase bg-white/70 px-1 py-0.5 rounded border border-black/10">
                                {msg.id}
                              </span>
                              <span className="font-semibold text-xs">{msg.title}</span>
                              {msg.retryCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[9px] font-semibold rounded animate-pulse">
                                  {t.brokerRetryTag} x{msg.retryCount}
                                </span>
                              )}
                            </div>
                            <p className="text-[#333840] text-[11px] leading-relaxed max-w-md">
                              {msg.message}
                            </p>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {t.brokerMetadataLabel} {JSON.stringify(msg.metadata)}
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-1.5 self-stretch md:self-auto justify-center">
                            {/* Operational Status tags */}
                            <span className="text-[11px] font-semibold">
                              {msg.status === 'queued' && t.brokerStatusIntake}
                              {msg.status === 'broker_delivering' && t.brokerStatusRouting}
                              {msg.status === 'processing' && t.brokerStatusWorker}
                              {msg.status === 'acked' && t.brokerStatusAck}
                              {msg.status === 'nacked' && t.brokerStatusNack}
                              {msg.status === 'dead_letter' && t.brokerStatusDead}
                            </span>

                            {/* Actions needed if manual ack is on */}
                            {msg.status === 'processing' && !consumerSettings.autoAck && (
                              <div className="flex space-x-1 mt-1">
                                <button
                                  onClick={() => manualAck(msg)}
                                  className="px-2 py-1 bg-green-700 text-white rounded text-[10px] font-semibold hover:bg-green-800 transition-colors"
                                >
                                  ACK
                                </button>
                                <button
                                  onClick={() => manualNack(msg)}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-semibold hover:bg-red-700 transition-colors"
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

                {/* LOGGING CONSOLE TERMINAL */}
                <div className="bg-[#181d26] rounded-xl overflow-hidden shadow-md border border-[#2d3139]">
                  <div className="px-5 py-3 border-b border-[#2d3139] bg-[#1d222b] flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-[#fcab79]" />
                      <span className="text-xs font-mono font-bold text-white tracking-wider">
                        {t.stdoutTitle}
                      </span>
                    </div>
                    <button
                      onClick={() => setLogs([])}
                      className="text-[10px] text-[#717680] border border-[#2d3139] px-2 py-0.5 rounded hover:text-white transition-colors"
                    >
                      {t.stdoutClearBtn}
                    </button>
                  </div>

                  <div className="p-4 font-mono text-[11px] leading-relaxed h-[240px] overflow-y-auto space-y-2 text-gray-300">
                    {logs.length === 0 ? (
                      <p className="text-gray-500 italic text-center py-10">{t.stdoutNoStreams}</p>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="flex items-start space-x-1.5 border-b border-white/5 pb-1 select-all">
                          <span className="text-gray-500">[{log.timestamp}]</span>
                          <span className={`font-bold uppercase tracking-wider text-[10px] px-1 py-0.1 select-none rounded ${
                            log.service === 'Producer' ? 'bg-sky-900/45 text-sky-300' :
                            log.service === 'Broker' ? 'bg-amber-900/45 text-amber-300' :
                            log.service === 'Consumer' ? 'bg-indigo-900/45 text-indigo-300' :
                            log.service === 'Notification' ? 'bg-emerald-900/45 text-emerald-300' :
                            'bg-gray-800 text-gray-300'
                          }`}>
                            {log.service}
                          </span>
                          <span className={
                            log.type === 'success' ? 'text-green-400' :
                            log.type === 'warn' ? 'text-yellow-400' :
                            log.type === 'error' ? 'text-red-400' :
                            'text-gray-300'
                          }>
                            {log.text}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* TG TELEGRAM SCREEN PHONE DISPLAY EMULATOR */}
            <div className="bg-[#f5e9d4]/30 rounded-xl border border-[#dddddd] p-8 mt-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-4">
                <div className="inline-flex items-center space-x-1.5 text-xs text-[#0a2e0e] bg-green-100 px-3 py-1 rounded-full font-bold border border-green-200">
                   <Bot className="w-3.5 h-3.5" />
                  <span>{t.sandboxBadge}</span>
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#181d26]">
                  {t.sandboxTitle}
                </h3>
                <p className="text-sm text-[#333840] leading-relaxed">
                  {t.sandboxDesc}
                </p>

                <div className="bg-white/80 rounded-lg p-4 border border-[#dddddd] text-xs">
                  <h4 className="font-semibold text-xs mb-1.5 text-[#aa2d00]">{t.sandboxGuideTitle}</h4>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600 font-medium">
                    <li>{t.sandboxGuideStep1}</li>
                    <li>{t.sandboxGuideStep2}</li>
                    <li>{t.sandboxGuideStep3}</li>
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
                  <div className="h-full bg-[#8fa4b4] p-4 pt-8 flex flex-col justify-between overflow-hidden relative" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?q=80&w=300&auto=format&fit=crop)' }}>
                    <div className="absolute inset-0 bg-[#eef1f5]/85 opacity-90 z-0" />
                    
                    {/* Header */}
                    <div className="relative z-10 flex items-center justify-between border-b pb-2 mb-2 border-[#181d26]/10">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-sky-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                          TG
                        </div>
                        <div>
                          <p className="font-bold text-[11px] text-[#181d26]">Microservice Alert Bot</p>
                          <p className="text-[9px] text-[#0a2e0e] font-semibold">@nest_rmq_notification_bot</p>
                        </div>
                      </div>
                    </div>

                    {/* Messages Panel */}
                    <div className="relative z-10 flex-1 overflow-y-auto space-y-2 pr-1 pt-1 flex flex-col justify-end w-full">
                      {messages.filter(m => m.status === 'acked' || m.status === 'processing').length === 0 ? (
                        <p className="text-gray-400 italic text-center py-10 text-[11px]">{t.sandboxEmptyText}</p>
                      ) : (
                        messages
                          .filter(m => m.status === 'acked' || m.status === 'processing')
                          .slice(-4)
                          .map((msgRef) => (
                            <div
                              key={msgRef.id}
                              className="bg-white rounded-xl p-3 shadow-sm border border-black/5 max-w-[90%] text-[11px] text-gray-800 animate-slide-up self-start"
                            >
                              <div className="font-bold text-xs text-[#aa2d00] flex items-center space-x-1 mb-1">
                                <span>🔔 {msgRef.title}</span>
                              </div>
                              <p className="leading-normal mb-1">{msgRef.message}</p>
                              <p className="text-[8px] text-[#717680] text-right font-mono">
                                ID: {msgRef.id} • {new Date().toLocaleTimeString()}
                              </p>
                            </div>
                          ))
                      )}
                    </div>

                    {/* Bottom Phone Bar */}
                    <div className="relative z-10 pt-2 border-t border-[#181d26]/10 mt-2 flex items-center justify-between">
                      <div className="text-[9px] bg-white text-gray-500 rounded-full w-full py-1 px-3 text-center">
                        {t.sandboxConsoleLabel}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-8" id="view_code">
            <div className="p-6 bg-white border border-[#dddddd] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#181d26]">NestJS Web Ide & Microservices Workspace</h2>
                <p className="text-sm text-[#717680]">
                  This folder structure displays pristine production components obeying SOLID design patterns. Choose a file below to explore and clone.
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-[#181d26] hover:bg-[#0d1218] text-white rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* SPLIT CODES SCREEN */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* File tree sidebar */}
              <div className="lg:col-span-4 bg-white border border-[#dddddd] rounded-xl p-4 space-y-4">
                <span className="text-[10px] font-bold tracking-wider text-gray-400 block uppercase">Project Files Tree</span>
                
                <div className="space-y-1.5">
                  {/* Root config blocks */}
                  <div className="font-semibold text-xs text-gray-500 uppercase tracking-wide flex items-center space-x-1 pl-1">
                    <Folder className="w-3.5 h-3.5" />
                    <span>Workspace Configs</span>
                  </div>
                  {CODE_FILES.slice(0, 3).map((f) => (
                    <button
                      key={f.path}
                      onClick={() => setSelectedFile(f)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                        selectedFile.path === f.path
                          ? 'bg-[#fdf2f2] text-[#aa2d00] font-semibold shadow-sm'
                          : 'text-[#333840] hover:bg-gray-100'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}

                  {/* Producer Service */}
                  <div className="pt-2 font-semibold text-xs text-gray-500 uppercase tracking-wide flex items-center space-x-1 pl-1">
                    <Folder className="w-3.5 h-3.5 text-amber-600" />
                    <span>services/producer</span>
                  </div>
                  {CODE_FILES.slice(3, 9).map((f) => (
                    <button
                      key={f.path}
                      onClick={() => setSelectedFile(f)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                        selectedFile.path === f.path
                          ? 'bg-[#fdf2f2] text-[#aa2d00] font-semibold'
                          : 'text-[#333840] hover:bg-gray-100'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}

                  {/* Consumer Service */}
                  <div className="pt-2 font-semibold text-xs text-gray-500 uppercase tracking-wide flex items-center space-x-1 pl-1">
                    <Folder className="w-3.5 h-3.5 text-[#aa2d00]" />
                    <span>services/consumer</span>
                  </div>
                  {CODE_FILES.slice(9, 13).map((f) => (
                    <button
                      key={f.path}
                      onClick={() => setSelectedFile(f)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                        selectedFile.path === f.path
                          ? 'bg-[#fdf2f2] text-[#aa2d00] font-semibold shadow-sm'
                          : 'text-[#333840] hover:bg-gray-100'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}

                  {/* Notification service */}
                  <div className="pt-2 font-semibold text-xs text-gray-500 uppercase tracking-wide flex items-center space-x-1 pl-1">
                    <Folder className="w-3.5 h-3.5 text-[#0a2e0e]" />
                    <span>services/notification</span>
                  </div>
                  {CODE_FILES.slice(13, 17).map((f) => (
                    <button
                      key={f.path}
                      onClick={() => setSelectedFile(f)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                        selectedFile.path === f.path
                          ? 'bg-[#fdf2f2] text-[#aa2d00] font-semibold shadow-sm'
                          : 'text-[#333840] hover:bg-gray-100'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Code viewer pane */}
              <div className="lg:col-span-8 bg-[#181d26] rounded-xl overflow-hidden shadow-lg border border-[#2d3139] flex flex-col">
                <div className="px-5 py-3 border-b border-[#2d3139] bg-[#1d222b] flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex space-x-1.5">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                      <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    </div>
                    <span className="font-mono text-xs text-[#dddddd]">{selectedFile.path}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider font-semibold">
                    {selectedFile.language}
                  </span>
                </div>

                <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto text-gray-300 max-h-[580px]">
                  <pre className="select-all">
                    {selectedFile.content.split('\n').map((line, idx) => (
                      <div key={idx} className="flex">
                        <span className="text-gray-600 w-8 inline-block select-none text-right pr-3">{idx + 1}</span>
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
                  We decouple our services following single responsibilities. The <strong>Producer Service</strong> does not share data structures, file layers, or memory space with the <strong>Consumer</strong>; they synchronize entirely through standard AMQP streams. 
                  This creates zero point bottlenecks, massive horizontal scaling options, and robust error fallback.
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('code')}
                className="px-6 py-3 bg-white text-[#aa2d00] hover:bg-gray-100 font-bold rounded-lg text-sm transition-colors whitespace-nowrap"
              >
                Inspect Files Tree
              </button>
            </div>

            {/* DETAILED INFO GRIDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="bg-white border border-[#dddddd] rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2 text-[#333840]">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Idempotency Mechanisms</span>
                </h3>
                <p className="text-xs text-[#717680] leading-relaxed">
                  In distributed systems, networks can drop, duplicate, or re-deliver packets. 
                  Our architecture guarantees idempotency:
                </p>
                <ul className="space-y-2 text-xs text-gray-700 leading-relaxed font-semibold">
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Every ingested event triggers a unique UUID generated by the Producer.</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>The database or Consumer caches these transaction signatures during processing.</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Duplicate packages arriving with active matching GUID tokens are automatically skipped or served from cache, preventing duplicate alerts to the customer.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white border border-[#dddddd] rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2 text-[#333840]">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Broker Error Recovery & Requeuing</span>
                </h3>
                <p className="text-xs text-[#717680] leading-relaxed">
                  What happens when third-party servers (like Telegram Bot endpoints) collapse temporarily?
                </p>
                <ul className="space-y-2 text-xs text-gray-700 leading-relaxed font-semibold">
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>With <strong>noAck: false</strong>, RabbitMQ preserves the message until the Consumer sends an explicit <code>ack</code> code.</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>If operations fail, we issue a <code>nack</code> with <code>requeue: true</code>, putting the message back to try again later.</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>After 3 retry failures, we discard or direct messages to a <strong>Dead-Letter Queue (DLX)</strong> for operator debugging and diagnostics, keeping queues clean.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* DOCKER COMPOSE CONFIG GUIDE */}
            <div className="bg-white border border-[#dddddd] rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Layers className="w-5 h-5 text-[#aa2d00]" />
                <span>Docker-Compose Deployment Guide</span>
              </h3>
              <p className="text-sm text-[#717680]">
                We use Docker Compose to bind all microservices and dependency networks under a single operational environment. To launch the whole project locally:
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs space-y-2 text-gray-800">
                <p className="text-[#aa2d00] font-bold"># Step 1: Clone the workspace</p>
                <p>git clone https://github.com/your-username/nest-rmq-telegram.git</p>
                <p>cd nest-rmq-telegram</p>
                <br />
                <p className="text-[#aa2d00] font-bold"># Step 2: Configure secrets inside an .env file</p>
                <p>echo "TELEGRAM_BOT_TOKEN='your_token'" &gt; .env</p>
                <p>echo "TELEGRAM_CHAT_ID='your_chat_id'" &gt;&gt; .env</p>
                <br />
                <p className="text-[#aa2d00] font-bold"># Step 3: Run compose or Makefile shortcuts</p>
                <p>make up</p>
                <br />
                <p className="text-green-700 font-bold"># Verified: Docker-Compose will compile images and launch RabbitMQ + 3 services!</p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* 5. FOOTER */}
      <footer className="bg-white border-t border-[#dddddd] mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-[#181d26] flex items-center justify-center text-white font-bold text-xs">
              N
            </div>
            <span className="font-semibold text-xs tracking-wide text-gray-500">
              NestJS Microservices Workspace • Crafted in AI Studio Build
            </span>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            Project License: GPL-3.0-or-later • Solid clean code blocks pre-compiled 
          </p>
        </div>
      </footer>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { SimulatedMessage, SimulationLog, ConsumerSettings, TelegramConfig, Subscriber } from '../types'

const loggedChatIdsGlobal = new Set<string>()

export function useSimulation() {
  const [activeWorkerId, setActiveWorkerId] = useState<number | null>(null)

  // Simulation State
  const [inputs, setInputs] = useState({
    title: 'New Order Ingested',
    message: 'Order #W10514 has been verified by warehousing and is ready for courier collection!',
    metadata: '{\n  "priority": "high",\n  "department": "fulfillment"\n}',
  })

  // Configuration (Telegram Setup - stored in localStorage for safety)
  const [tgConfig, setTgConfig] = useState<TelegramConfig>({
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
  const [consumerSettings, setConsumerSettings] = useState<ConsumerSettings>({
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
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([])
  const [newChatId, setNewChatId] = useState('')
  const [newName, setNewName] = useState('')
  const [isRegisteringSub, setIsRegisteringSub] = useState(false)

  // Reactive Queue simulation helpers mapping messages to active status pipelines
  const tasksQueueItems = messages.filter((m) => m.status === 'queued' || m.status === 'broker_delivering')
  const tasksQueueProcessing = messages.filter((m) => m.status === 'processing')
  const notifyQueueItems = messages.filter((m) => m.status === 'acked' || (m.status === 'processing' && m.retryCount > 0))

  const onClearLogs = () => setLogs([])

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
  }, [messages.length])

  return {
    activeWorkerId,
    inputs,
    setInputs,
    tgConfig,
    setTgConfig,
    showConfig,
    setShowConfig,
    isSavingConfig,
    messages,
    setMessages,
    logs,
    setLogs,
    consumerSettings,
    setConsumerSettings,
    sentCount,
    ackedCount,
    nackedCount,
    deadLetterCount,
    telegramStatus,
    subscribers,
    selectedChatIds,
    setSelectedChatIds,
    newChatId,
    setNewChatId,
    newName,
    setNewName,
    isRegisteringSub,
    tasksQueueItems,
    tasksQueueProcessing,
    notifyQueueItems,
    onClearLogs,
    registerSubscriberManually,
    deleteSubscriber,
    saveTelegramConfig,
    clearTelegramConfig,
    dispatchMessage,
    manualAck,
    manualNack,
  }
}

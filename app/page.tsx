'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { GiDuck, GiSailboat, GiAnchor, GiWaves, GiLighthouse } from 'react-icons/gi'
import { AiFillHeart, AiFillStar, AiOutlineStar } from 'react-icons/ai'
import { IoSettingsSharp, IoHelpCircle, IoClose, IoArrowBack, IoPlay, IoVolumeHigh, IoVolumeMute } from 'react-icons/io5'
import { BsFillTrophyFill, BsHandThumbsUpFill, BsEmojiSmileFill, BsStars, BsLightbulb, BsExclamationTriangle } from 'react-icons/bs'
import { FiSend, FiArrowRight, FiChevronRight } from 'react-icons/fi'
import { MdWaves } from 'react-icons/md'

// ─── Constants ──────────────────────────────────────────────

const GAME_GUIDE_AGENT_ID = '699a08af5c51ba0c6ba1b0bb'

const THEME_VARS = {
  '--background': '30 40% 98%',
  '--foreground': '20 40% 10%',
  '--card': '30 40% 96%',
  '--card-foreground': '20 40% 10%',
  '--primary': '24 95% 53%',
  '--primary-foreground': '30 40% 98%',
  '--secondary': '30 35% 92%',
  '--secondary-foreground': '20 40% 10%',
  '--accent': '12 80% 50%',
  '--accent-foreground': '30 40% 98%',
  '--muted': '30 30% 90%',
  '--muted-foreground': '20 25% 45%',
  '--border': '30 35% 88%',
  '--ring': '24 95% 53%',
  '--radius': '0.875rem',
} as React.CSSProperties

// ─── Types ──────────────────────────────────────────────────

type Screen = 'menu' | 'game' | 'tutorial' | 'gameover'
type EventType = 'hint' | 'encouragement' | 'tutorial' | 'warning' | 'celebration'
type Emotion = 'happy' | 'excited' | 'gentle' | 'celebratory' | 'encouraging'
type Difficulty = 'easy' | 'medium' | 'hard'

interface GuideMessage {
  id: string
  role: 'user' | 'guide'
  eventType?: EventType
  message: string
  emotion?: Emotion
  actionSuggestion?: string
}

// ─── Sample Data ────────────────────────────────────────────

const SAMPLE_MESSAGES: GuideMessage[] = [
  {
    id: 's1',
    role: 'user',
    eventType: 'hint',
    message: 'Event type: hint. I see a duck near the bridge but I cannot reach it.',
  },
  {
    id: 's2',
    role: 'guide',
    eventType: 'hint',
    message: 'Look over by the big stone bridge! If you steer your gondola a little to the left, you will float right past that fluffy duck. You can do it!',
    emotion: 'happy',
    actionSuggestion: 'Steer left toward the bridge',
  },
  {
    id: 's3',
    role: 'user',
    eventType: 'encouragement',
    message: 'Event type: encouragement. I just saved my first duck!',
  },
  {
    id: 's4',
    role: 'guide',
    eventType: 'encouragement',
    message: 'Hooray! You saved your very first duck! That little duckling is so happy to be on your gondola. Keep going, brave captain!',
    emotion: 'celebratory',
    actionSuggestion: 'Look for more ducks ahead',
  },
  {
    id: 's5',
    role: 'user',
    eventType: 'celebration',
    message: 'Event type: celebration. I delivered 3 ducks to the beach safely!',
  },
  {
    id: 's6',
    role: 'guide',
    eventType: 'celebration',
    message: 'What an amazing gondola captain you are! Three ducks safely on the beach, all thanks to you! The ducks are doing a happy dance!',
    emotion: 'excited',
    actionSuggestion: 'Head back for more ducks',
  },
]

// ─── Helpers ────────────────────────────────────────────────

function getEmotionIcon(emotion?: Emotion) {
  switch (emotion) {
    case 'happy':
      return <BsEmojiSmileFill className="text-amber-500" />
    case 'excited':
      return <BsStars className="text-yellow-400" />
    case 'gentle':
      return <AiFillHeart className="text-pink-400" />
    case 'celebratory':
      return <BsFillTrophyFill className="text-yellow-500" />
    case 'encouraging':
      return <BsHandThumbsUpFill className="text-orange-500" />
    default:
      return <BsEmojiSmileFill className="text-amber-500" />
  }
}

function getEmotionLabel(emotion?: Emotion): string {
  switch (emotion) {
    case 'happy': return 'Happy'
    case 'excited': return 'Excited'
    case 'gentle': return 'Gentle'
    case 'celebratory': return 'Celebratory'
    case 'encouraging': return 'Encouraging'
    default: return 'Happy'
  }
}

function getEventTypeIcon(eventType: EventType) {
  switch (eventType) {
    case 'hint':
      return <BsLightbulb />
    case 'encouragement':
      return <BsHandThumbsUpFill />
    case 'tutorial':
      return <GiSailboat />
    case 'warning':
      return <BsExclamationTriangle />
    case 'celebration':
      return <BsFillTrophyFill />
  }
}

function getEventTypeLabel(eventType: EventType): string {
  switch (eventType) {
    case 'hint': return 'Hint'
    case 'encouragement': return 'Cheer'
    case 'tutorial': return 'Tutorial'
    case 'warning': return 'Warning'
    case 'celebration': return 'Celebrate'
  }
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-2 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-3 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

// ─── CSS Animations (injected via style tag alternative: useEffect) ──

function AnimationStyles() {
  useEffect(() => {
    const id = 'ducks-ahoy-animations'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      @keyframes da-wave {
        0%, 100% { transform: translateX(0) translateY(0); }
        25% { transform: translateX(-15px) translateY(-4px); }
        50% { transform: translateX(0) translateY(2px); }
        75% { transform: translateX(15px) translateY(-3px); }
      }
      @keyframes da-wave2 {
        0%, 100% { transform: translateX(0) translateY(0); }
        25% { transform: translateX(10px) translateY(-3px); }
        50% { transform: translateX(-5px) translateY(3px); }
        75% { transform: translateX(-10px) translateY(-2px); }
      }
      @keyframes da-float {
        0%, 100% { transform: translateY(0) rotate(-2deg); }
        50% { transform: translateY(-8px) rotate(2deg); }
      }
      @keyframes da-waddle {
        0% { transform: translateX(-40px) rotate(-5deg); opacity: 0; }
        10% { opacity: 1; }
        25% { transform: translateX(25%) rotate(5deg); }
        50% { transform: translateX(50%) rotate(-5deg); }
        75% { transform: translateX(75%) rotate(5deg); }
        90% { opacity: 1; }
        100% { transform: translateX(calc(100% + 40px)) rotate(-5deg); opacity: 0; }
      }
      @keyframes da-bubble-in {
        0% { transform: scale(0.8) translateY(12px); opacity: 0; }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }
      @keyframes da-pulse-glow {
        0%, 100% { box-shadow: 0 0 8px rgba(249, 115, 22, 0.3); }
        50% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.6); }
      }
      @keyframes da-confetti {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(-80px) rotate(720deg); opacity: 0; }
      }
      @keyframes da-title-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      @keyframes da-duck-parade {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100vw); }
      }
      @keyframes da-hand-point {
        0%, 100% { transform: translateX(0); opacity: 0.7; }
        50% { transform: translateX(10px); opacity: 1; }
      }
      @keyframes da-sparkle {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.3); opacity: 1; }
      }
      .da-wave-anim { animation: da-wave 4s ease-in-out infinite; }
      .da-wave2-anim { animation: da-wave2 5s ease-in-out infinite; }
      .da-float-anim { animation: da-float 3s ease-in-out infinite; }
      .da-waddle-anim { animation: da-waddle 2.5s ease-in-out infinite; }
      .da-bubble-anim { animation: da-bubble-in 0.4s ease-out forwards; }
      .da-pulse-anim { animation: da-pulse-glow 2s ease-in-out infinite; }
      .da-confetti-anim { animation: da-confetti 1s ease-out forwards; }
      .da-title-anim { animation: da-title-float 3s ease-in-out infinite; }
      .da-parade-anim { animation: da-duck-parade 6s linear infinite; }
      .da-hand-anim { animation: da-hand-point 1.5s ease-in-out infinite; }
      .da-sparkle-anim { animation: da-sparkle 2s ease-in-out infinite; }
    `
    document.head.appendChild(style)
    return () => { style.remove() }
  }, [])
  return null
}

// ─── Water Ripple Component ─────────────────────────────────

function WaterRipples() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden pointer-events-none">
      <div className="da-wave-anim absolute bottom-0 left-0 right-0 flex items-end">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={`w1-${i}`} className="flex-1 rounded-t-full" style={{ height: `${14 + Math.sin(i * 0.8) * 8}px`, background: 'rgba(249, 115, 22, 0.15)', marginLeft: '-2px' }} />
        ))}
      </div>
      <div className="da-wave2-anim absolute bottom-0 left-0 right-0 flex items-end" style={{ transform: 'translateX(20px)' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={`w2-${i}`} className="flex-1 rounded-t-full" style={{ height: `${10 + Math.cos(i * 0.9) * 6}px`, background: 'rgba(230, 59, 23, 0.1)', marginLeft: '-2px' }} />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: 'linear-gradient(to top, rgba(249,115,22,0.08), transparent)' }} />
    </div>
  )
}

// ─── Loading Duck Animation ─────────────────────────────────

function LoadingDuck() {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-3">
      <div className="relative w-full h-10 overflow-hidden">
        <div className="da-waddle-anim absolute top-0 left-0">
          <GiDuck className="text-3xl" style={{ color: '#F97316' }} />
        </div>
      </div>
      <p className="text-sm" style={{ color: 'hsl(20 25% 45%)' }}>Your guide is thinking...</p>
    </div>
  )
}

// ─── Confetti Burst ─────────────────────────────────────────

function ConfettiBurst() {
  const colors = ['#F97316', '#E63B17', '#FBBF24', '#FB923C', '#F59E0B']
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={`conf-${i}`}
          className="da-confetti-anim absolute rounded-full"
          style={{
            width: '8px',
            height: '8px',
            background: colors[i % colors.length],
            left: `${15 + (i * 6)}%`,
            top: `${30 + (i % 3) * 15}%`,
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Speech Bubble ──────────────────────────────────────────

function SpeechBubble({ msg }: { msg: GuideMessage }) {
  const isGuide = msg.role === 'guide'
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (msg.emotion === 'celebratory' || msg.emotion === 'excited') {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 1200)
      return () => clearTimeout(t)
    }
  }, [msg.emotion])

  if (!isGuide) {
    return (
      <div className="da-bubble-anim flex justify-end mb-3">
        <div className="max-w-xs sm:max-w-sm rounded-2xl rounded-br-sm px-4 py-3 shadow-md" style={{ background: 'hsl(24 95% 53%)', color: 'hsl(30 40% 98%)' }}>
          {msg.eventType && (
            <div className="flex items-center gap-1.5 mb-1 text-xs font-medium opacity-90">
              {getEventTypeIcon(msg.eventType)}
              <span>{getEventTypeLabel(msg.eventType)}</span>
            </div>
          )}
          <p className="text-sm leading-relaxed">{msg.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="da-bubble-anim flex justify-start mb-3 relative">
      {showConfetti && <ConfettiBurst />}
      <div className="flex gap-2 max-w-xs sm:max-w-md">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm" style={{ background: 'hsl(30 35% 92%)' }}>
          <GiDuck className="text-lg" style={{ color: '#F97316' }} />
        </div>
        <div>
          <div className="rounded-2xl rounded-bl-sm px-4 py-3 shadow-md" style={{ background: 'hsl(30 40% 96%)', border: '1px solid hsl(30 35% 88%)' }}>
            {msg.emotion && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">{getEmotionIcon(msg.emotion)}</span>
                <span className="text-xs font-medium" style={{ color: 'hsl(20 25% 45%)' }}>{getEmotionLabel(msg.emotion)}</span>
              </div>
            )}
            <div style={{ color: 'hsl(20 40% 10%)' }}>
              {renderMarkdown(msg.message)}
            </div>
          </div>
          {msg.actionSuggestion && (
            <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316' }}>
              <FiArrowRight className="text-xs flex-shrink-0" />
              <span>{msg.actionSuggestion}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Menu Screen ────────────────────────────────────────────

function MenuScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4" style={{ background: 'linear-gradient(to bottom, hsl(30 60% 95%), hsl(24 80% 90%), hsl(12 70% 88%))' }}>
      {/* Sun glow */}
      <div className="absolute top-8 right-8 w-20 h-20 rounded-full opacity-60" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.5), rgba(249,115,22,0.1), transparent)', filter: 'blur(10px)' }} />

      {/* Decorative icons */}
      <div className="absolute top-16 left-8 da-float-anim opacity-30">
        <GiLighthouse className="text-4xl" style={{ color: '#E63B17' }} />
      </div>
      <div className="absolute top-24 right-16 da-sparkle-anim opacity-30">
        <BsStars className="text-2xl" style={{ color: '#F97316' }} />
      </div>

      {/* Main title */}
      <div className="da-title-anim text-center mb-2 z-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <GiDuck className="text-5xl" style={{ color: '#F97316' }} />
          <GiSailboat className="text-4xl da-float-anim" style={{ color: '#E63B17' }} />
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight" style={{ color: 'hsl(20 40% 10%)', letterSpacing: '-0.02em' }}>
          Ducks Ahoy!
        </h1>
        <p className="text-lg sm:text-xl mt-2 font-medium" style={{ color: 'hsl(20 25% 45%)' }}>
          Venice Gondola Adventure
        </p>
      </div>

      {/* Gondola silhouette */}
      <div className="da-float-anim mt-4 mb-8 z-10">
        <div className="flex items-end gap-0">
          <MdWaves className="text-2xl" style={{ color: 'rgba(249,115,22,0.4)' }} />
          <GiSailboat className="text-5xl -mb-1" style={{ color: 'hsl(20 40% 10%)' }} />
          <MdWaves className="text-2xl" style={{ color: 'rgba(249,115,22,0.4)' }} />
        </div>
      </div>

      {/* Menu buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs z-10">
        <button
          onClick={() => onNavigate('game')}
          className="da-pulse-anim flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: 'hsl(24 95% 53%)', color: 'hsl(30 40% 98%)' }}
        >
          <IoPlay className="text-xl" />
          <span>Play</span>
        </button>
        <button
          onClick={() => onNavigate('tutorial')}
          className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-lg font-semibold shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: 'hsl(30 40% 96%)', color: 'hsl(20 40% 10%)', border: '2px solid hsl(30 35% 88%)' }}
        >
          <GiSailboat className="text-xl" style={{ color: '#F97316' }} />
          <span>Tutorial</span>
        </button>
        <button
          onClick={() => onNavigate('menu')}
          className="flex items-center justify-center gap-3 px-6 py-3 rounded-2xl text-base font-medium shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: 'hsl(30 35% 92%)', color: 'hsl(20 25% 45%)' }}
        >
          <IoSettingsSharp className="text-lg" />
          <span>Settings</span>
        </button>
      </div>

      {/* Anchor decoration */}
      <div className="mt-8 z-10 opacity-20">
        <GiAnchor className="text-3xl" style={{ color: 'hsl(20 40% 10%)' }} />
      </div>

      <WaterRipples />
    </div>
  )
}

// ─── Event Type Picker ──────────────────────────────────────

function EventTypePicker({
  selected,
  onSelect,
}: {
  selected: EventType | null
  onSelect: (et: EventType) => void
}) {
  const eventTypes: EventType[] = ['hint', 'encouragement', 'tutorial', 'warning', 'celebration']
  const colors: Record<EventType, string> = {
    hint: '#F59E0B',
    encouragement: '#F97316',
    tutorial: '#E63B17',
    warning: '#EF4444',
    celebration: '#FBBF24',
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-1">
      {eventTypes.map((et) => (
        <button
          key={et}
          onClick={() => onSelect(et)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
          style={{
            background: selected === et ? colors[et] : 'hsl(30 35% 92%)',
            color: selected === et ? 'white' : 'hsl(20 25% 45%)',
            border: `1.5px solid ${selected === et ? colors[et] : 'hsl(30 35% 88%)'}`,
          }}
        >
          <span className="text-sm">{getEventTypeIcon(et)}</span>
          <span>{getEventTypeLabel(et)}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Tutorial Screen ────────────────────────────────────────

function TutorialScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [narration, setNarration] = useState<string>('')
  const [emotion, setEmotion] = useState<Emotion>('happy')
  const [actionSuggestion, setActionSuggestion] = useState('')
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  const steps = [
    {
      title: 'Steer the Gondola',
      description: 'Use the joystick to steer your gondola through the Venice canals.',
      icon: <GiSailboat className="text-4xl" style={{ color: '#F97316' }} />,
      agentMessage: 'Event type: tutorial. Step 1: The player is learning to steer the gondola through Venice canals for the first time.',
    },
    {
      title: 'Collect the Ducks',
      description: 'Float close to the ducks in the water to scoop them onto your gondola.',
      icon: <GiDuck className="text-4xl" style={{ color: '#F97316' }} />,
      agentMessage: 'Event type: tutorial. Step 2: The player is learning how to collect ducks from the water onto the gondola.',
    },
    {
      title: 'Deliver to Beach',
      description: 'Take the rescued ducks to the sandy beach at the end of the canal.',
      icon: <GiWaves className="text-4xl" style={{ color: '#E63B17' }} />,
      agentMessage: 'Event type: tutorial. Step 3: The player is learning how to deliver collected ducks safely to the beach.',
    },
  ]

  const currentStep = steps[step]

  const fetchNarration = useCallback(async (stepIndex: number) => {
    setLoading(true)
    setNarration('')
    setActionSuggestion('')
    setActiveAgentId(GAME_GUIDE_AGENT_ID)

    try {
      const result = await callAIAgent(steps[stepIndex]?.agentMessage || '', GAME_GUIDE_AGENT_ID)
      if (result.success) {
        const data = result?.response?.result || {}
        setNarration(data?.message || result?.response?.message || 'Let me tell you about this step...')
        setEmotion((data?.emotion as Emotion) || 'happy')
        setActionSuggestion(data?.action_suggestion || '')
      }
    } catch {
      setNarration('Oops, could not get narration. Try again!')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [])

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
      setNarration('')
      setActionSuggestion('')
    } else {
      onNavigate('game')
    }
  }

  const handlePrev = () => {
    if (step > 0) {
      setStep((s) => s - 1)
      setNarration('')
      setActionSuggestion('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: 'linear-gradient(to bottom, hsl(30 40% 98%), hsl(24 50% 93%))' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid hsl(30 35% 88%)' }}>
        <button onClick={() => onNavigate('menu')} className="p-2 rounded-xl" style={{ color: 'hsl(20 25% 45%)' }}>
          <IoArrowBack className="text-xl" />
        </button>
        <h2 className="text-base font-semibold" style={{ color: 'hsl(20 40% 10%)' }}>Tutorial</h2>
        <div className="w-8" />
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={`prog-${i}`}
              className="flex-1 h-1.5 rounded-full transition-all duration-500"
              style={{ background: i <= step ? 'hsl(24 95% 53%)' : 'hsl(30 30% 90%)' }}
            />
          ))}
        </div>
        <p className="text-xs mt-1.5 font-medium" style={{ color: 'hsl(20 25% 45%)' }}>
          Step {step + 1} of {steps.length}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="da-float-anim mb-6">
          {currentStep?.icon}
        </div>

        <h3 className="text-2xl font-bold mb-2 text-center" style={{ color: 'hsl(20 40% 10%)' }}>
          {currentStep?.title}
        </h3>
        <p className="text-sm text-center mb-6 max-w-sm" style={{ color: 'hsl(20 25% 45%)' }}>
          {currentStep?.description}
        </p>

        {/* Hand pointer hint */}
        <div className="da-hand-anim mb-6 flex items-center gap-2" style={{ color: 'hsl(20 25% 45%)' }}>
          <FiChevronRight className="text-lg" />
          <span className="text-xs font-medium">Tap below to hear from your guide</span>
        </div>

        {/* Narration area */}
        <div className="w-full max-w-sm">
          {!narration && !loading && (
            <button
              onClick={() => fetchNarration(step)}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
              style={{ background: 'hsl(24 95% 53%)', color: 'hsl(30 40% 98%)' }}
            >
              Ask Guide for Tips
            </button>
          )}

          {loading && <LoadingDuck />}

          {narration && !loading && (
            <div className="da-bubble-anim rounded-2xl px-4 py-4 shadow-md" style={{ background: 'hsl(30 40% 96%)', border: '1px solid hsl(30 35% 88%)' }}>
              <div className="flex items-center gap-2 mb-2">
                <GiDuck style={{ color: '#F97316' }} />
                <span className="text-base">{getEmotionIcon(emotion)}</span>
                <span className="text-xs font-medium" style={{ color: 'hsl(20 25% 45%)' }}>{getEmotionLabel(emotion)}</span>
              </div>
              <div style={{ color: 'hsl(20 40% 10%)' }}>
                {renderMarkdown(narration)}
              </div>
              {actionSuggestion && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: '#F97316' }}>
                  <FiArrowRight className="flex-shrink-0" />
                  <span>{actionSuggestion}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 px-6 pb-8">
        <button
          onClick={handlePrev}
          disabled={step === 0}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
          style={{ background: 'hsl(30 35% 92%)', color: 'hsl(20 40% 10%)' }}
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
          style={{ background: 'hsl(24 95% 53%)', color: 'hsl(30 40% 98%)' }}
        >
          {step < steps.length - 1 ? 'Next' : 'Start Playing!'}
        </button>
      </div>
    </div>
  )
}

// ─── Game Over Screen ───────────────────────────────────────

function GameOverScreen({
  ducksSaved,
  messagesCount,
  onNavigate,
}: {
  ducksSaved: number
  messagesCount: number
  onNavigate: (screen: Screen) => void
}) {
  const [paradeStarted, setParadeStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setParadeStarted(true), 300)
    return () => clearTimeout(t)
  }, [])

  const stars = messagesCount >= 6 ? 3 : messagesCount >= 3 ? 2 : 1

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6" style={{ background: 'linear-gradient(to bottom, hsl(30 50% 96%), hsl(24 70% 90%), hsl(12 60% 85%))' }}>
      {/* Confetti layer */}
      <ConfettiBurst />

      <div className="text-center z-10">
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'hsl(20 40% 10%)' }}>
          Great Job, Captain!
        </h1>
        <p className="text-base mb-6" style={{ color: 'hsl(20 25% 45%)' }}>
          What an amazing adventure!
        </p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: 3 }).map((_, i) =>
            i < stars ? (
              <AiFillStar key={`star-${i}`} className="text-4xl" style={{ color: '#FBBF24', animationDelay: `${i * 0.2}s` }} />
            ) : (
              <AiOutlineStar key={`star-${i}`} className="text-4xl" style={{ color: 'hsl(30 30% 90%)' }} />
            )
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 justify-center mb-8">
          <div className="flex flex-col items-center gap-1 px-5 py-4 rounded-2xl shadow-md" style={{ background: 'rgba(246,240,234,0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)' }}>
            <GiDuck className="text-2xl" style={{ color: '#F97316' }} />
            <span className="text-2xl font-bold" style={{ color: 'hsl(20 40% 10%)' }}>{ducksSaved}</span>
            <span className="text-xs font-medium" style={{ color: 'hsl(20 25% 45%)' }}>Ducks Saved</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-5 py-4 rounded-2xl shadow-md" style={{ background: 'rgba(246,240,234,0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)' }}>
            <BsFillTrophyFill className="text-2xl" style={{ color: '#FBBF24' }} />
            <span className="text-2xl font-bold" style={{ color: 'hsl(20 40% 10%)' }}>{messagesCount}</span>
            <span className="text-xs font-medium" style={{ color: 'hsl(20 25% 45%)' }}>Interactions</span>
          </div>
        </div>

        {/* Duck parade */}
        {paradeStarted && (
          <div className="relative w-64 h-10 mx-auto mb-8 overflow-hidden">
            <div className="da-parade-anim absolute top-0 left-0 flex gap-3">
              <GiDuck className="text-2xl" style={{ color: '#F97316' }} />
              <GiDuck className="text-xl" style={{ color: '#FB923C' }} />
              <GiDuck className="text-2xl" style={{ color: '#F59E0B' }} />
              <GiDuck className="text-lg" style={{ color: '#FBBF24' }} />
              <GiDuck className="text-2xl" style={{ color: '#F97316' }} />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-64 mx-auto">
          <button
            onClick={() => onNavigate('game')}
            className="py-3 rounded-2xl text-base font-semibold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'hsl(24 95% 53%)', color: 'hsl(30 40% 98%)' }}
          >
            Play Again
          </button>
          <button
            onClick={() => onNavigate('menu')}
            className="py-3 rounded-2xl text-base font-medium transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'hsl(30 35% 92%)', color: 'hsl(20 40% 10%)', border: '1.5px solid hsl(30 35% 88%)' }}
          >
            Main Menu
          </button>
        </div>
      </div>

      <WaterRipples />
    </div>
  )
}

// ─── Settings Panel ─────────────────────────────────────────

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [soundOn, setSoundOn] = useState(true)
  const [controlMode, setControlMode] = useState<'swipe' | 'tilt'>('swipe')

  const difficulties: { value: Difficulty; label: string; ducks: number }[] = [
    { value: 'easy', label: 'Easy', ducks: 1 },
    { value: 'medium', label: 'Medium', ducks: 2 },
    { value: 'hard', label: 'Hard', ducks: 3 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(26,16,8,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'hsl(30 40% 98%)', border: '1px solid hsl(30 35% 88%)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid hsl(30 35% 88%)' }}>
          <div className="flex items-center gap-2">
            <IoSettingsSharp className="text-lg" style={{ color: '#F97316' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'hsl(20 40% 10%)' }}>Settings</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all hover:scale-110" style={{ color: 'hsl(20 25% 45%)' }}>
            <IoClose className="text-xl" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Difficulty */}
          <div>
            <label className="text-sm font-medium block mb-3" style={{ color: 'hsl(20 40% 10%)' }}>Difficulty</label>
            <div className="flex gap-2">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200 hover:scale-105"
                  style={{
                    background: difficulty === d.value ? 'hsl(24 95% 53%)' : 'hsl(30 35% 92%)',
                    color: difficulty === d.value ? 'hsl(30 40% 98%)' : 'hsl(20 40% 10%)',
                    border: `1.5px solid ${difficulty === d.value ? 'hsl(24 95% 53%)' : 'hsl(30 35% 88%)'}`,
                  }}
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: d.ducks }).map((_, i) => (
                      <GiDuck key={`dd-${d.value}-${i}`} className="text-sm" />
                    ))}
                  </div>
                  <span className="text-xs font-medium">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundOn ? (
                <IoVolumeHigh className="text-lg" style={{ color: '#F97316' }} />
              ) : (
                <IoVolumeMute className="text-lg" style={{ color: 'hsl(20 25% 45%)' }} />
              )}
              <span className="text-sm font-medium" style={{ color: 'hsl(20 40% 10%)' }}>Sound</span>
            </div>
            <button
              onClick={() => setSoundOn((s) => !s)}
              className="w-12 h-6 rounded-full relative transition-all duration-300"
              style={{ background: soundOn ? 'hsl(24 95% 53%)' : 'hsl(30 30% 90%)' }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all duration-300"
                style={{
                  background: 'white',
                  left: soundOn ? '26px' : '2px',
                }}
              />
            </button>
          </div>

          {/* Control mode */}
          <div>
            <label className="text-sm font-medium block mb-3" style={{ color: 'hsl(20 40% 10%)' }}>Control Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setControlMode('swipe')}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{
                  background: controlMode === 'swipe' ? 'hsl(24 95% 53%)' : 'hsl(30 35% 92%)',
                  color: controlMode === 'swipe' ? 'hsl(30 40% 98%)' : 'hsl(20 40% 10%)',
                  border: `1.5px solid ${controlMode === 'swipe' ? 'hsl(24 95% 53%)' : 'hsl(30 35% 88%)'}`,
                }}
              >
                Swipe
              </button>
              <button
                onClick={() => setControlMode('tilt')}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{
                  background: controlMode === 'tilt' ? 'hsl(24 95% 53%)' : 'hsl(30 35% 92%)',
                  color: controlMode === 'tilt' ? 'hsl(30 40% 98%)' : 'hsl(20 40% 10%)',
                  border: `1.5px solid ${controlMode === 'tilt' ? 'hsl(24 95% 53%)' : 'hsl(30 35% 88%)'}`,
                }}
              >
                Tilt
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
            style={{ background: 'hsl(24 95% 53%)', color: 'hsl(30 40% 98%)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Agent Info Footer ──────────────────────────────────────

function AgentInfoFooter({ activeAgentId }: { activeAgentId: string | null }) {
  return (
    <div className="px-4 py-3" style={{ background: 'hsl(30 40% 96%)', borderTop: '1px solid hsl(30 35% 88%)' }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: activeAgentId === GAME_GUIDE_AGENT_ID ? '#22C55E' : 'hsl(30 30% 90%)' }}
          />
          <span className="text-xs font-medium" style={{ color: 'hsl(20 40% 10%)' }}>Game Guide Agent</span>
        </div>
        <span className="text-xs" style={{ color: 'hsl(20 25% 45%)' }}>
          {activeAgentId === GAME_GUIDE_AGENT_ID ? 'Active' : 'Ready'}
        </span>
        <span className="text-xs ml-auto opacity-50" style={{ color: 'hsl(20 25% 45%)' }}>
          Hints, encouragement, and narration
        </span>
      </div>
    </div>
  )
}

// ─── ErrorBoundary ──────────────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(30 40% 98%)', color: 'hsl(20 40% 10%)' }}>
          <div className="text-center p-8 max-w-md">
            <GiDuck className="text-5xl mx-auto mb-4" style={{ color: '#F97316' }} />
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm mb-4" style={{ color: 'hsl(20 25% 45%)' }}>{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-6 py-2.5 rounded-xl text-sm font-medium shadow-md"
              style={{ background: 'hsl(24 95% 53%)', color: 'hsl(30 40% 98%)' }}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Main Page ──────────────────────────────────────────────

export default function Page() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [sampleData, setSampleData] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [ducksSaved, setDucksSaved] = useState(0)
  const [messagesCount, setMessagesCount] = useState(0)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  const handleNavigate = useCallback((newScreen: Screen) => {
    setScreen(newScreen)
  }, [])

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen relative font-sans" >
        <AnimationStyles />

        {/* Sample Data Toggle */}
        <div className="fixed top-3 right-3 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md" style={{ background: 'rgba(246,240,234,0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)' }}>
          <span className="text-xs font-medium" style={{ color: 'hsl(20 25% 45%)' }}>Sample Data</span>
          <button
            onClick={() => setSampleData((s) => !s)}
            className="w-10 h-5 rounded-full relative transition-all duration-300"
            style={{ background: sampleData ? 'hsl(24 95% 53%)' : 'hsl(30 30% 90%)' }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-all duration-300"
              style={{
                background: 'white',
                left: sampleData ? '22px' : '2px',
              }}
            />
          </button>
        </div>

        {/* Settings Modal */}
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

        {/* Screen Router */}
        {screen === 'menu' && (
          <MenuScreenWrapper
            onNavigate={(s) => {
              if (s === 'menu') {
                // Settings button in menu
                setShowSettings(true)
              } else {
                handleNavigate(s)
              }
            }}
          />
        )}

        {screen === 'game' && (
          <GameScreenWrapper
            onNavigate={handleNavigate}
            sampleData={sampleData}
            onDucksSavedChange={setDucksSaved}
            onMessagesCountChange={setMessagesCount}
            onActiveAgentChange={setActiveAgentId}
          />
        )}

        {screen === 'tutorial' && (
          <TutorialScreen onNavigate={handleNavigate} />
        )}

        {screen === 'gameover' && (
          <GameOverScreen
            ducksSaved={ducksSaved}
            messagesCount={messagesCount}
            onNavigate={handleNavigate}
          />
        )}

        {/* Agent Info Footer */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <AgentInfoFooter activeAgentId={activeAgentId} />
        </div>
      </div>
    </ErrorBoundary>
  )
}

// ─── Wrappers to lift state ─────────────────────────────────

function MenuScreenWrapper({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return <MenuScreen onNavigate={onNavigate} />
}

function GameScreenWrapper({
  onNavigate,
  sampleData,
  onDucksSavedChange,
  onMessagesCountChange,
  onActiveAgentChange,
}: {
  onNavigate: (screen: Screen) => void
  sampleData: boolean
  onDucksSavedChange: (count: number) => void
  onMessagesCountChange: (count: number) => void
  onActiveAgentChange: (id: string | null) => void
}) {
  const [messages, setMessages] = useState<GuideMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lives, setLives] = useState(4)
  const [ducksSaved, setDucksSaved] = useState(0)
  const [ducksOnGondola, setDucksOnGondola] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sampleData && messages.length === 0) {
      setMessages(SAMPLE_MESSAGES)
      setDucksSaved(3)
      setDucksOnGondola(1)
    }
  }, [sampleData, messages.length])

  useEffect(() => {
    onDucksSavedChange(ducksSaved)
  }, [ducksSaved, onDucksSavedChange])

  useEffect(() => {
    onMessagesCountChange(messages.filter((m) => m.role === 'guide').length)
  }, [messages, onMessagesCountChange])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSendMessage = useCallback(async (eventType: EventType, customMessage?: string) => {
    if (!eventType) return
    setLoading(true)
    setError(null)
    onActiveAgentChange(GAME_GUIDE_AGENT_ID)

    const userMsgText = `Event type: ${eventType}. ${customMessage || ''} Game state: Lives remaining: ${lives}, Ducks saved: ${ducksSaved}, Ducks on gondola: ${ducksOnGondola}`
    const userMsg: GuideMessage = {
      id: Date.now().toString(),
      role: 'user',
      eventType,
      message: userMsgText,
    }
    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setSelectedEvent(null)

    try {
      const result = await callAIAgent(userMsgText, GAME_GUIDE_AGENT_ID)

      if (result.success) {
        const data = result?.response?.result || {}
        const newMessage: GuideMessage = {
          id: (Date.now() + 1).toString(),
          role: 'guide',
          eventType,
          message: data?.message || result?.response?.message || 'Quack! Let me think about that...',
          emotion: (data?.emotion as Emotion) || 'happy',
          actionSuggestion: data?.action_suggestion || '',
        }
        setMessages((prev) => [...prev, newMessage])

        if (eventType === 'celebration') {
          setDucksSaved((prev) => prev + 1)
        }
      } else {
        setError(result?.error || 'Something went wrong. Try again!')
      }
    } catch {
      setError('Could not reach the guide. Please try again!')
    } finally {
      setLoading(false)
      onActiveAgentChange(null)
    }
  }, [lives, ducksSaved, ducksOnGondola, onActiveAgentChange])

  const handleSubmit = () => {
    if (!selectedEvent || loading) return
    handleSendMessage(selectedEvent, inputText)
  }

  return (
    <div className="min-h-screen flex flex-col relative pb-12" style={{ background: 'linear-gradient(to bottom, hsl(30 40% 98%), hsl(30 40% 96%))' }}>
      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-3 shadow-sm sticky top-0 z-30" style={{ background: 'rgba(246,240,234,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid hsl(30 35% 88%)' }}>
        <button onClick={() => onNavigate('menu')} className="p-2 rounded-xl transition-all hover:scale-110" style={{ color: 'hsl(20 25% 45%)' }}>
          <IoArrowBack className="text-xl" />
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <AiFillHeart key={`h-${i}`} className="text-lg" style={{ color: i < lives ? '#E63B17' : 'hsl(30 30% 90%)' }} />
            ))}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(249,115,22,0.1)' }}>
            <GiDuck className="text-base" style={{ color: '#F97316' }} />
            <span className="text-sm font-semibold" style={{ color: '#F97316' }}>{ducksSaved}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSendMessage('hint', 'I need help! What should I do next?')} className="da-pulse-anim p-2 rounded-xl transition-all hover:scale-110" style={{ color: '#F97316' }}>
            <IoHelpCircle className="text-xl" />
          </button>
          <button onClick={() => onNavigate('gameover')} className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-105" style={{ background: 'hsl(30 35% 92%)', color: 'hsl(20 25% 45%)' }}>
            End
          </button>
        </div>
      </div>

      {/* Settings overlay */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: '200px' }}>
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="da-float-anim">
              <GiDuck className="text-6xl" style={{ color: 'hsl(30 35% 88%)' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: 'hsl(20 40% 10%)' }}>Ready for adventure!</h3>
              <p className="text-sm max-w-xs" style={{ color: 'hsl(20 25% 45%)' }}>
                Choose an event type below and ask your game guide for help, hints, or celebrations.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <SpeechBubble key={msg.id} msg={msg} />
        ))}

        {loading && <LoadingDuck />}

        {error && (
          <div className="da-bubble-anim flex justify-start mb-3">
            <div className="max-w-xs rounded-2xl px-4 py-3 shadow-md" style={{ background: 'hsl(0 70% 96%)', border: '1px solid hsl(0 60% 90%)' }}>
              <p className="text-sm" style={{ color: 'hsl(0 60% 40%)' }}>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input area - fixed at bottom */}
      <div className="fixed bottom-12 left-0 right-0 border-t px-4 py-3 space-y-3 z-20" style={{ background: 'rgba(251,248,245,0.95)', backdropFilter: 'blur(16px)', borderColor: 'hsl(30 35% 88%)' }}>
        <EventTypePicker selected={selectedEvent} onSelect={setSelectedEvent} />

        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && selectedEvent && !loading) handleSubmit() }}
            placeholder={selectedEvent ? 'Describe your situation (optional)...' : 'Pick an event type first'}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'hsl(30 40% 98%)', border: '1.5px solid hsl(30 35% 88%)', color: 'hsl(20 40% 10%)' }}
            disabled={!selectedEvent || loading}
          />
          <button
            onClick={handleSubmit}
            disabled={!selectedEvent || loading}
            className="px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            style={{ background: selectedEvent ? 'hsl(24 95% 53%)' : 'hsl(30 30% 90%)', color: selectedEvent ? 'hsl(30 40% 98%)' : 'hsl(20 25% 45%)' }}
          >
            <FiSend className="text-lg" />
          </button>
        </div>

        {/* Game state controls */}
        <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(20 25% 45%)' }}>
          <div className="flex gap-2">
            <button onClick={() => setDucksOnGondola((p) => p + 1)} className="px-2 py-1 rounded-lg transition-all hover:scale-105" style={{ background: 'rgba(249,115,22,0.08)' }}>
              +Duck on boat
            </button>
            <button onClick={() => setDucksSaved((p) => p + 1)} className="px-2 py-1 rounded-lg transition-all hover:scale-105" style={{ background: 'rgba(249,115,22,0.08)' }}>
              +Duck saved
            </button>
            <button onClick={() => setLives((p) => Math.max(0, p - 1))} className="px-2 py-1 rounded-lg transition-all hover:scale-105" style={{ background: 'rgba(230,59,23,0.08)' }}>
              -Life
            </button>
          </div>
          <span className="opacity-70">Gondola: {ducksOnGondola}</span>
        </div>
      </div>
    </div>
  )
}

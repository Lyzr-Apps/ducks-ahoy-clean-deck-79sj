'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { GiDuck, GiSailboat, GiAnchor, GiWaves, GiLighthouse } from 'react-icons/gi'
import { AiFillHeart, AiFillStar, AiOutlineStar } from 'react-icons/ai'
import { IoSettingsSharp, IoHelpCircle, IoClose, IoArrowBack, IoPlay, IoVolumeHigh, IoVolumeMute } from 'react-icons/io5'
import { BsFillTrophyFill, BsHandThumbsUpFill, BsEmojiSmileFill, BsStars, BsLightbulb, BsExclamationTriangle } from 'react-icons/bs'
import { FiSend, FiArrowRight, FiChevronRight } from 'react-icons/fi'
import { MdWaves } from 'react-icons/md'

/* ─── Constants ──────────────────────────────────────────── */

const GAME_GUIDE_AGENT_ID = '699a08af5c51ba0c6ba1b0bb'

/* ─── Types ──────────────────────────────────────────────── */

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

/* ─── Color Palette (Sunset Theme) ───────────────────────── */

const C = {
  bg: '#FBF8F5',
  fg: '#1A1008',
  card: '#F6F0EA',
  cardFg: '#1A1008',
  primary: '#F97316',
  primaryFg: '#FBF8F5',
  secondary: '#EDE4DA',
  secondaryFg: '#1A1008',
  accent: '#E63B17',
  accentFg: '#FBF8F5',
  muted: '#E8E0D6',
  mutedFg: '#8A7260',
  border: '#E2D8CC',
  ring: '#F97316',
}

/* ─── Sample Data ────────────────────────────────────────── */

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

/* ─── Helpers ────────────────────────────────────────────── */

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

/* ─── Global CSS Keyframes ───────────────────────────────── */

const GLOBAL_STYLES = `
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
  25% { transform: translateX(25vw) rotate(5deg); }
  50% { transform: translateX(50vw) rotate(-5deg); }
  75% { transform: translateX(75vw) rotate(5deg); }
  90% { opacity: 1; }
  100% { transform: translateX(100vw) rotate(-5deg); opacity: 0; }
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
`

function AnimationStyles() {
  useEffect(() => {
    const id = 'ducks-ahoy-animations'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = GLOBAL_STYLES
    document.head.appendChild(style)
    return () => {
      const el = document.getElementById(id)
      if (el) el.remove()
    }
  }, [])
  return null
}

/* ─── Water Ripple Component ─────────────────────────────── */

function WaterRipples() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden pointer-events-none">
      <div
        className="absolute bottom-0 left-0 right-0 flex items-end"
        style={{ animation: 'da-wave 4s ease-in-out infinite' }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`w1-${i}`}
            className="flex-1 rounded-t-full"
            style={{
              height: `${14 + Math.sin(i * 0.8) * 8}px`,
              background: 'rgba(249, 115, 22, 0.15)',
              marginLeft: '-2px',
            }}
          />
        ))}
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 flex items-end"
        style={{ animation: 'da-wave2 5s ease-in-out infinite', transform: 'translateX(20px)' }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={`w2-${i}`}
            className="flex-1 rounded-t-full"
            style={{
              height: `${10 + Math.cos(i * 0.9) * 6}px`,
              background: 'rgba(230, 59, 23, 0.1)',
              marginLeft: '-2px',
            }}
          />
        ))}
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-8"
        style={{ background: 'linear-gradient(to top, rgba(249,115,22,0.08), transparent)' }}
      />
    </div>
  )
}

/* ─── Loading Duck Animation ─────────────────────────────── */

function LoadingDuck() {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-3">
      <div className="relative w-full h-10 overflow-hidden">
        <div className="absolute top-0 left-0" style={{ animation: 'da-waddle 2.5s ease-in-out infinite' }}>
          <GiDuck className="text-3xl" style={{ color: C.primary }} />
        </div>
      </div>
      <p className="text-sm" style={{ color: C.mutedFg }}>Your guide is thinking...</p>
    </div>
  )
}

/* ─── Confetti Burst ─────────────────────────────────────── */

function ConfettiBurst() {
  const colors = [C.primary, C.accent, '#FBBF24', '#FB923C', '#F59E0B']
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={`conf-${i}`}
          className="absolute rounded-full"
          style={{
            width: '8px',
            height: '8px',
            background: colors[i % colors.length],
            left: `${15 + (i * 6)}%`,
            top: `${30 + (i % 3) * 15}%`,
            animation: `da-confetti 1s ease-out ${i * 0.08}s forwards`,
          }}
        />
      ))}
    </div>
  )
}

/* ─── Speech Bubble ──────────────────────────────────────── */

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
      <div className="flex justify-end mb-3" style={{ animation: 'da-bubble-in 0.4s ease-out forwards' }}>
        <div
          className="max-w-xs sm:max-w-sm px-4 py-3 shadow-md"
          style={{
            background: C.primary,
            color: C.primaryFg,
            borderRadius: '0.875rem 0.875rem 0.25rem 0.875rem',
          }}
        >
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
    <div className="flex justify-start mb-3 relative" style={{ animation: 'da-bubble-in 0.4s ease-out forwards' }}>
      {showConfetti && <ConfettiBurst />}
      <div className="flex gap-2 max-w-xs sm:max-w-md">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
          style={{ background: C.secondary }}
        >
          <GiDuck className="text-lg" style={{ color: C.primary }} />
        </div>
        <div>
          <div
            className="px-4 py-3 shadow-md"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '0.875rem 0.875rem 0.875rem 0.25rem',
            }}
          >
            {msg.emotion && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">{getEmotionIcon(msg.emotion)}</span>
                <span className="text-xs font-medium" style={{ color: C.mutedFg }}>{getEmotionLabel(msg.emotion)}</span>
              </div>
            )}
            <div style={{ color: C.fg }}>
              {renderMarkdown(msg.message)}
            </div>
          </div>
          {msg.actionSuggestion && (
            <div
              className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(249,115,22,0.1)', color: C.primary }}
            >
              <FiArrowRight className="text-xs flex-shrink-0" />
              <span>{msg.actionSuggestion}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Event Type Picker ──────────────────────────────────── */

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
            background: selected === et ? colors[et] : C.secondary,
            color: selected === et ? 'white' : C.mutedFg,
            border: `1.5px solid ${selected === et ? colors[et] : C.border}`,
          }}
        >
          <span className="text-sm">{getEventTypeIcon(et)}</span>
          <span>{getEventTypeLabel(et)}</span>
        </button>
      ))}
    </div>
  )
}

/* ─── Settings Panel ─────────────────────────────────────── */

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,16,8,0.5)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: C.bg, border: `1px solid ${C.border}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <IoSettingsSharp className="text-lg" style={{ color: C.primary }} />
            <h3 className="text-lg font-semibold" style={{ color: C.fg }}>Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all hover:scale-110"
            style={{ color: C.mutedFg }}
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Difficulty */}
          <div>
            <label className="text-sm font-medium block mb-3" style={{ color: C.fg }}>Difficulty</label>
            <div className="flex gap-2">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200 hover:scale-105"
                  style={{
                    background: difficulty === d.value ? C.primary : C.secondary,
                    color: difficulty === d.value ? C.primaryFg : C.fg,
                    border: `1.5px solid ${difficulty === d.value ? C.primary : C.border}`,
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
                <IoVolumeHigh className="text-lg" style={{ color: C.primary }} />
              ) : (
                <IoVolumeMute className="text-lg" style={{ color: C.mutedFg }} />
              )}
              <span className="text-sm font-medium" style={{ color: C.fg }}>Sound</span>
            </div>
            <button
              onClick={() => setSoundOn((s) => !s)}
              className="w-12 h-6 rounded-full relative transition-all duration-300"
              style={{ background: soundOn ? C.primary : C.muted }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all duration-300"
                style={{ background: 'white', left: soundOn ? '26px' : '2px' }}
              />
            </button>
          </div>

          {/* Control mode */}
          <div>
            <label className="text-sm font-medium block mb-3" style={{ color: C.fg }}>Control Mode</label>
            <div className="flex gap-2">
              {(['swipe', 'tilt'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setControlMode(mode)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    background: controlMode === mode ? C.primary : C.secondary,
                    color: controlMode === mode ? C.primaryFg : C.fg,
                    border: `1.5px solid ${controlMode === mode ? C.primary : C.border}`,
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
            style={{ background: C.primary, color: C.primaryFg }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Tutorial Screen ────────────────────────────────────── */

function TutorialScreen({
  onNavigate,
  onActiveAgentChange,
}: {
  onNavigate: (screen: Screen) => void
  onActiveAgentChange: (id: string | null) => void
}) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [narration, setNarration] = useState('')
  const [emotion, setEmotion] = useState<Emotion>('happy')
  const [actionSuggestion, setActionSuggestion] = useState('')

  const steps = [
    {
      title: 'Steer the Gondola',
      description: 'Use the joystick to steer your gondola through the Venice canals.',
      icon: <GiSailboat className="text-5xl" style={{ color: C.primary }} />,
      agentMessage: 'Event type: tutorial. Step 1: The player is learning to steer the gondola through Venice canals for the first time.',
    },
    {
      title: 'Collect the Ducks',
      description: 'Float close to the ducks in the water to scoop them onto your gondola.',
      icon: <GiDuck className="text-5xl" style={{ color: C.primary }} />,
      agentMessage: 'Event type: tutorial. Step 2: The player is learning how to collect ducks from the water onto the gondola.',
    },
    {
      title: 'Deliver to Beach',
      description: 'Take the rescued ducks to the sandy beach at the end of the canal.',
      icon: <GiWaves className="text-5xl" style={{ color: C.accent }} />,
      agentMessage: 'Event type: tutorial. Step 3: The player is learning how to deliver collected ducks safely to the beach.',
    },
  ]

  const currentStep = steps[step]

  const fetchNarration = useCallback(async (stepIndex: number) => {
    setLoading(true)
    setNarration('')
    setActionSuggestion('')
    onActiveAgentChange(GAME_GUIDE_AGENT_ID)

    try {
      const result = await callAIAgent(steps[stepIndex]?.agentMessage || '', GAME_GUIDE_AGENT_ID)
      if (result.success) {
        const data = result?.response?.result || {}
        setNarration(data?.message || result?.response?.message || 'Let me tell you about this step...')
        setEmotion((data?.emotion as Emotion) || 'happy')
        setActionSuggestion(data?.action_suggestion || '')
      } else {
        setNarration('Oops, could not get narration right now. Try again!')
      }
    } catch {
      setNarration('Oops, could not get narration. Try again!')
    } finally {
      setLoading(false)
      onActiveAgentChange(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onActiveAgentChange])

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: `linear-gradient(to bottom, ${C.bg}, ${C.secondary})` }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => onNavigate('menu')} className="p-2 rounded-xl" style={{ color: C.mutedFg }}>
          <IoArrowBack className="text-xl" />
        </button>
        <h2 className="text-base font-semibold" style={{ color: C.fg }}>Tutorial</h2>
        <div className="w-8" />
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={`prog-${i}`}
              className="flex-1 h-1.5 rounded-full transition-all duration-500"
              style={{ background: i <= step ? C.primary : C.muted }}
            />
          ))}
        </div>
        <p className="text-xs mt-1.5 font-medium" style={{ color: C.mutedFg }}>
          Step {step + 1} of {steps.length}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="mb-6" style={{ animation: 'da-float 3s ease-in-out infinite' }}>
          {currentStep?.icon}
        </div>

        <h3 className="text-2xl font-bold mb-2 text-center" style={{ color: C.fg }}>
          {currentStep?.title}
        </h3>
        <p className="text-sm text-center mb-6 max-w-sm" style={{ color: C.mutedFg }}>
          {currentStep?.description}
        </p>

        {/* Hand pointer hint */}
        <div className="mb-6 flex items-center gap-2" style={{ color: C.mutedFg, animation: 'da-hand-point 1.5s ease-in-out infinite' }}>
          <FiChevronRight className="text-lg" />
          <span className="text-xs font-medium">Tap below to hear from your guide</span>
        </div>

        {/* Narration area */}
        <div className="w-full max-w-sm">
          {!narration && !loading && (
            <button
              onClick={() => fetchNarration(step)}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
              style={{ background: C.primary, color: C.primaryFg }}
            >
              Ask Guide for Tips
            </button>
          )}

          {loading && <LoadingDuck />}

          {narration && !loading && (
            <div
              className="rounded-2xl px-4 py-4 shadow-md"
              style={{ background: C.card, border: `1px solid ${C.border}`, animation: 'da-bubble-in 0.4s ease-out forwards' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <GiDuck style={{ color: C.primary }} />
                <span className="text-base">{getEmotionIcon(emotion)}</span>
                <span className="text-xs font-medium" style={{ color: C.mutedFg }}>{getEmotionLabel(emotion)}</span>
              </div>
              <div style={{ color: C.fg }}>
                {renderMarkdown(narration)}
              </div>
              {actionSuggestion && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: C.primary }}>
                  <FiArrowRight className="flex-shrink-0" />
                  <span>{actionSuggestion}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 px-6 pb-16">
        <button
          onClick={() => {
            if (step > 0) {
              setStep((s) => s - 1)
              setNarration('')
              setActionSuggestion('')
            }
          }}
          disabled={step === 0}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
          style={{ background: C.secondary, color: C.fg }}
        >
          Back
        </button>
        <button
          onClick={() => {
            if (step < steps.length - 1) {
              setStep((s) => s + 1)
              setNarration('')
              setActionSuggestion('')
            } else {
              onNavigate('game')
            }
          }}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
          style={{ background: C.primary, color: C.primaryFg }}
        >
          {step < steps.length - 1 ? 'Next' : 'Start Playing!'}
        </button>
      </div>
    </div>
  )
}

/* ─── Game Over Screen ───────────────────────────────────── */

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
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={{ background: `linear-gradient(to bottom, ${C.bg}, ${C.secondary}, ${C.muted})` }}
    >
      <ConfettiBurst />

      <div className="text-center z-10">
        <h1 className="text-4xl font-bold mb-2" style={{ color: C.fg }}>
          Great Job, Captain!
        </h1>
        <p className="text-base mb-6" style={{ color: C.mutedFg }}>
          What an amazing adventure!
        </p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: 3 }).map((_, i) =>
            i < stars ? (
              <AiFillStar key={`star-${i}`} className="text-4xl" style={{ color: '#FBBF24' }} />
            ) : (
              <AiOutlineStar key={`star-${i}`} className="text-4xl" style={{ color: C.muted }} />
            )
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 justify-center mb-8">
          <div
            className="flex flex-col items-center gap-1 px-5 py-4 rounded-2xl shadow-md"
            style={{ background: 'rgba(246,240,234,0.85)', backdropFilter: 'blur(16px)', border: `1px solid rgba(255,255,255,0.18)` }}
          >
            <GiDuck className="text-2xl" style={{ color: C.primary }} />
            <span className="text-2xl font-bold" style={{ color: C.fg }}>{ducksSaved}</span>
            <span className="text-xs font-medium" style={{ color: C.mutedFg }}>Ducks Saved</span>
          </div>
          <div
            className="flex flex-col items-center gap-1 px-5 py-4 rounded-2xl shadow-md"
            style={{ background: 'rgba(246,240,234,0.85)', backdropFilter: 'blur(16px)', border: `1px solid rgba(255,255,255,0.18)` }}
          >
            <BsFillTrophyFill className="text-2xl" style={{ color: '#FBBF24' }} />
            <span className="text-2xl font-bold" style={{ color: C.fg }}>{messagesCount}</span>
            <span className="text-xs font-medium" style={{ color: C.mutedFg }}>Interactions</span>
          </div>
        </div>

        {/* Duck parade */}
        {paradeStarted && (
          <div className="relative w-64 h-10 mx-auto mb-8 overflow-hidden">
            <div className="absolute top-0 left-0 flex gap-3" style={{ animation: 'da-duck-parade 6s linear infinite' }}>
              <GiDuck className="text-2xl" style={{ color: C.primary }} />
              <GiDuck className="text-xl" style={{ color: '#FB923C' }} />
              <GiDuck className="text-2xl" style={{ color: '#F59E0B' }} />
              <GiDuck className="text-lg" style={{ color: '#FBBF24' }} />
              <GiDuck className="text-2xl" style={{ color: C.primary }} />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-64 mx-auto">
          <button
            onClick={() => onNavigate('game')}
            className="py-3 rounded-2xl text-base font-semibold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: C.primary, color: C.primaryFg }}
          >
            Play Again
          </button>
          <button
            onClick={() => onNavigate('menu')}
            className="py-3 rounded-2xl text-base font-medium transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: C.secondary, color: C.fg, border: `1.5px solid ${C.border}` }}
          >
            Main Menu
          </button>
        </div>
      </div>

      <WaterRipples />
    </div>
  )
}

/* ─── Agent Info Footer ──────────────────────────────────── */

function AgentInfoFooter({ activeAgentId }: { activeAgentId: string | null }) {
  return (
    <div className="px-4 py-3" style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: activeAgentId === GAME_GUIDE_AGENT_ID ? '#22C55E' : C.muted }}
          />
          <span className="text-xs font-medium" style={{ color: C.fg }}>Game Guide Agent</span>
        </div>
        <span className="text-xs" style={{ color: C.mutedFg }}>
          {activeAgentId === GAME_GUIDE_AGENT_ID ? 'Active' : 'Ready'}
        </span>
        <span className="text-xs ml-auto opacity-50" style={{ color: C.mutedFg }}>
          Hints, encouragement, and narration
        </span>
      </div>
    </div>
  )
}

/* ─── Game Screen ────────────────────────────────────────── */

function GameScreen({
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
    const guideCount = Array.isArray(messages) ? messages.filter((m) => m.role === 'guide').length : 0
    onMessagesCountChange(guideCount)
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
    <div className="min-h-screen flex flex-col relative pb-12" style={{ background: `linear-gradient(to bottom, ${C.bg}, ${C.card})` }}>
      {/* HUD */}
      <div
        className="flex items-center justify-between px-4 py-3 shadow-sm sticky top-0 z-30"
        style={{ background: 'rgba(246,240,234,0.92)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}` }}
      >
        <button onClick={() => onNavigate('menu')} className="p-2 rounded-xl transition-all hover:scale-110" style={{ color: C.mutedFg }}>
          <IoArrowBack className="text-xl" />
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <AiFillHeart key={`h-${i}`} className="text-lg" style={{ color: i < lives ? C.accent : C.muted }} />
            ))}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(249,115,22,0.1)' }}>
            <GiDuck className="text-base" style={{ color: C.primary }} />
            <span className="text-sm font-semibold" style={{ color: C.primary }}>{ducksSaved}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSendMessage('hint', 'I need help! What should I do next?')}
            className="p-2 rounded-xl transition-all hover:scale-110"
            style={{ color: C.primary, animation: 'da-pulse-glow 2s ease-in-out infinite' }}
          >
            <IoHelpCircle className="text-xl" />
          </button>
          <button
            onClick={() => onNavigate('gameover')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-105"
            style={{ background: C.secondary, color: C.mutedFg }}
          >
            End
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: '220px' }}>
        {Array.isArray(messages) && messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div style={{ animation: 'da-float 3s ease-in-out infinite' }}>
              <GiDuck className="text-6xl" style={{ color: C.border }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: C.fg }}>Ready for adventure!</h3>
              <p className="text-sm max-w-xs" style={{ color: C.mutedFg }}>
                Choose an event type below and ask your game guide for help, hints, or celebrations.
              </p>
            </div>
          </div>
        )}

        {Array.isArray(messages) && messages.map((msg) => (
          <SpeechBubble key={msg.id} msg={msg} />
        ))}

        {loading && <LoadingDuck />}

        {error && (
          <div className="flex justify-start mb-3" style={{ animation: 'da-bubble-in 0.4s ease-out forwards' }}>
            <div
              className="max-w-xs rounded-2xl px-4 py-3 shadow-md"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
            >
              <p className="text-sm" style={{ color: '#991B1B' }}>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input area - fixed at bottom */}
      <div
        className="fixed bottom-12 left-0 right-0 border-t px-4 py-3 space-y-3 z-20"
        style={{ background: 'rgba(251,248,245,0.95)', backdropFilter: 'blur(16px)', borderColor: C.border }}
      >
        <EventTypePicker selected={selectedEvent} onSelect={setSelectedEvent} />

        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && selectedEvent && !loading) handleSubmit() }}
            placeholder={selectedEvent ? 'Describe your situation (optional)...' : 'Pick an event type first'}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: C.bg, border: `1.5px solid ${C.border}`, color: C.fg }}
            disabled={!selectedEvent || loading}
          />
          <button
            onClick={handleSubmit}
            disabled={!selectedEvent || loading}
            className="px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            style={{ background: selectedEvent ? C.primary : C.muted, color: selectedEvent ? C.primaryFg : C.mutedFg }}
          >
            <FiSend className="text-lg" />
          </button>
        </div>

        {/* Game state controls */}
        <div className="flex items-center justify-between text-xs" style={{ color: C.mutedFg }}>
          <div className="flex gap-2">
            <button
              onClick={() => setDucksOnGondola((p) => Math.min(p + 1, 2))}
              className="px-2 py-1 rounded-lg transition-all hover:scale-105"
              style={{ background: 'rgba(249,115,22,0.08)' }}
            >
              +Duck on boat
            </button>
            <button
              onClick={() => setDucksSaved((p) => p + 1)}
              className="px-2 py-1 rounded-lg transition-all hover:scale-105"
              style={{ background: 'rgba(249,115,22,0.08)' }}
            >
              +Duck saved
            </button>
            <button
              onClick={() => setLives((p) => Math.max(0, p - 1))}
              className="px-2 py-1 rounded-lg transition-all hover:scale-105"
              style={{ background: 'rgba(230,59,23,0.08)' }}
            >
              -Life
            </button>
          </div>
          <span className="opacity-70">Gondola: {ducksOnGondola}/2</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Menu Screen ────────────────────────────────────────── */

function MenuScreen({
  onPlay,
  onTutorial,
  onSettings,
}: {
  onPlay: () => void
  onTutorial: () => void
  onSettings: () => void
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
      style={{ background: `linear-gradient(to bottom, #F9F0E6, #F5D5B8, #F0C4AE)` }}
    >
      {/* Sun glow */}
      <div
        className="absolute top-8 right-8 w-20 h-20 rounded-full opacity-60"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.5), rgba(249,115,22,0.1), transparent)', filter: 'blur(10px)' }}
      />

      {/* Decorative icons */}
      <div className="absolute top-16 left-8 opacity-30" style={{ animation: 'da-float 3s ease-in-out infinite' }}>
        <GiLighthouse className="text-4xl" style={{ color: C.accent }} />
      </div>
      <div className="absolute top-24 right-16 opacity-30" style={{ animation: 'da-sparkle 2s ease-in-out infinite' }}>
        <BsStars className="text-2xl" style={{ color: C.primary }} />
      </div>

      {/* Main title */}
      <div className="text-center mb-2 z-10" style={{ animation: 'da-title-float 3s ease-in-out infinite' }}>
        <div className="flex items-center justify-center gap-3 mb-3">
          <GiDuck className="text-5xl" style={{ color: C.primary }} />
          <GiSailboat className="text-4xl" style={{ color: C.accent, animation: 'da-float 3s ease-in-out infinite' }} />
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight" style={{ color: C.fg, letterSpacing: '-0.02em' }}>
          Ducks Ahoy!
        </h1>
        <p className="text-lg sm:text-xl mt-2 font-medium" style={{ color: C.mutedFg }}>
          Venice Gondola Adventure
        </p>
      </div>

      {/* Gondola silhouette */}
      <div className="mt-4 mb-8 z-10" style={{ animation: 'da-float 3s ease-in-out infinite' }}>
        <div className="flex items-end gap-0">
          <MdWaves className="text-2xl" style={{ color: 'rgba(249,115,22,0.4)' }} />
          <GiSailboat className="text-5xl -mb-1" style={{ color: C.fg }} />
          <MdWaves className="text-2xl" style={{ color: 'rgba(249,115,22,0.4)' }} />
        </div>
      </div>

      {/* Menu buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs z-10">
        <button
          onClick={onPlay}
          className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: C.primary, color: C.primaryFg, animation: 'da-pulse-glow 2s ease-in-out infinite' }}
        >
          <IoPlay className="text-xl" />
          <span>Play</span>
        </button>
        <button
          onClick={onTutorial}
          className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-lg font-semibold shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: C.card, color: C.fg, border: `2px solid ${C.border}` }}
        >
          <GiSailboat className="text-xl" style={{ color: C.primary }} />
          <span>Tutorial</span>
        </button>
        <button
          onClick={onSettings}
          className="flex items-center justify-center gap-3 px-6 py-3 rounded-2xl text-base font-medium shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: C.secondary, color: C.mutedFg }}
        >
          <IoSettingsSharp className="text-lg" />
          <span>Settings</span>
        </button>
      </div>

      {/* Anchor decoration */}
      <div className="mt-8 z-10 opacity-20">
        <GiAnchor className="text-3xl" style={{ color: C.fg }} />
      </div>

      <WaterRipples />
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────── */

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

  const handleActiveAgentChange = useCallback((id: string | null) => {
    setActiveAgentId(id)
  }, [])

  return (
      <div className="min-h-screen relative font-sans" style={{ background: C.bg }}>
        <AnimationStyles />

        {/* Sample Data Toggle */}
        <div
          className="fixed top-3 right-3 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md"
          style={{ background: 'rgba(246,240,234,0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)' }}
        >
          <span className="text-xs font-medium" style={{ color: C.mutedFg }}>Sample Data</span>
          <button
            onClick={() => setSampleData((s) => !s)}
            className="w-10 h-5 rounded-full relative transition-all duration-300"
            style={{ background: sampleData ? C.primary : C.muted }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-all duration-300"
              style={{ background: 'white', left: sampleData ? '22px' : '2px' }}
            />
          </button>
        </div>

        {/* Settings Modal */}
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

        {/* Screen Router */}
        {screen === 'menu' && (
          <MenuScreen
            onPlay={() => handleNavigate('game')}
            onTutorial={() => handleNavigate('tutorial')}
            onSettings={() => setShowSettings(true)}
          />
        )}

        {screen === 'game' && (
          <GameScreen
            onNavigate={handleNavigate}
            sampleData={sampleData}
            onDucksSavedChange={setDucksSaved}
            onMessagesCountChange={setMessagesCount}
            onActiveAgentChange={handleActiveAgentChange}
          />
        )}

        {screen === 'tutorial' && (
          <TutorialScreen
            onNavigate={handleNavigate}
            onActiveAgentChange={handleActiveAgentChange}
          />
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
  )
}

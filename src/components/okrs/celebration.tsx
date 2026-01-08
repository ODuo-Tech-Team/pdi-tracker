'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  size: number
}

const COLORS = ['#22C55E', '#EAB308', '#3B82F6', '#EC4899', '#8B5CF6', '#F97316']

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    size: 8 + Math.random() * 8,
  }))
}

interface CelebrationProps {
  show: boolean
  onComplete?: () => void
  message?: string
}

export function Celebration({ show, onComplete, message = 'Meta Atingida!' }: CelebrationProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setConfetti(generateConfetti(50))
      setVisible(true)

      const timer = setTimeout(() => {
        setVisible(false)
        onComplete?.()
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!visible) return null

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${piece.x}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
            }}
          >
            <div
              className="animate-confetti-spin"
              style={{
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          </div>
        ))}
      </div>

      {/* Message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-celebration-message bg-white shadow-2xl rounded-2xl px-8 py-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">{message}</h2>
          <p className="text-gray-600 mt-1">Parabens pelo progresso!</p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes confetti-spin {
          0% {
            transform: rotateX(0deg) rotateY(0deg);
          }
          100% {
            transform: rotateX(360deg) rotateY(360deg);
          }
        }

        @keyframes celebration-message {
          0% {
            transform: scale(0) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }

        .animate-confetti-spin {
          animation: confetti-spin 1s linear infinite;
        }

        .animate-celebration-message {
          animation: celebration-message 0.5s ease-out forwards;
        }
      `}</style>
    </div>,
    document.body
  )
}

/**
 * Hook to trigger celebration
 */
export function useCelebration() {
  const [celebrating, setCelebrating] = useState(false)
  const [message, setMessage] = useState('Meta Atingida!')

  const celebrate = useCallback((customMessage?: string) => {
    if (customMessage) setMessage(customMessage)
    setCelebrating(true)
  }, [])

  const onComplete = useCallback(() => {
    setCelebrating(false)
  }, [])

  return {
    celebrating,
    message,
    celebrate,
    onComplete,
    CelebrationComponent: () => (
      <Celebration show={celebrating} onComplete={onComplete} message={message} />
    ),
  }
}

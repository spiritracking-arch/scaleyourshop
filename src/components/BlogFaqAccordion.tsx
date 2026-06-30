'use client'

import { useState } from 'react'

interface FaqItem { question: string; answer: string }

export default function BlogFaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)

  if (!items || items.length === 0) return null

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 16, overflow: 'hidden', transition: 'border-color 150ms ease',
          }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              style={{
                width: '100%', textAlign: 'left', padding: '16px 18px', background: 'transparent',
                border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              <span>{item.question}</span>
              <span style={{
                flexShrink: 0, color: '#006FEE', fontSize: 16, lineHeight: 1,
                transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 150ms ease',
              }}>+</span>
            </button>
            {isOpen && (
              <div style={{ padding: '0 18px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}>
                {item.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

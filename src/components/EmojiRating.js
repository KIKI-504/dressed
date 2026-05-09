import React from 'react'
import styles from './EmojiRating.module.css'

const RATINGS = [
  { emoji: '🤩', label: 'Exceptional', value: '🤩' },
  { emoji: '🙂', label: 'Good',        value: '🙂' },
  { emoji: '🤔', label: 'Interesting', value: '🤔' },
  { emoji: '😕', label: 'Disappointing', value: '😕' },
  { emoji: '🤮', label: 'Avoid',       value: '🤮' },
]

export { RATINGS }

export default function EmojiRating({ value, onChange, size = 'normal' }) {
  return (
    <div className={`${styles.row} ${size === 'large' ? styles.large : ''}`}>
      {RATINGS.map(r => (
        <button
          key={r.value}
          className={`${styles.btn} ${value === r.value ? styles.selected : ''}`}
          onClick={() => onChange(value === r.value ? '' : r.value)}
          title={r.label}
          type="button"
        >
          <span className={styles.emoji}>{r.emoji}</span>
          {value === r.value && (
            <span className={`${styles.label} mono`}>{r.label}</span>
          )}
        </button>
      ))}
    </div>
  )
}

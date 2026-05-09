import React from 'react'
import styles from './TopBar.module.css'

export default function TopBar({ onGoHome, right }) {
  return (
    <div className={styles.bar}>
      <button className={styles.wordmark} onClick={onGoHome}>
        <span className={styles.kiki}>Kiki</span>
        <span className={styles.carnet}>Carnet</span>
      </button>
      {right && <div className={styles.right}>{right}</div>}
    </div>
  )
}

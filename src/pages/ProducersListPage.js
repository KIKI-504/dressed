import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import styles from './ProducersListPage.module.css'
import TopBar from '../components/TopBar'

export default function ProducersListPage({ onNavigate, onGoHome }) {
  const [producers, setProducers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('producers')
        .select('id, name, region, sub_region, appellation, country, winemaker, organic_certified, biodynamic_certified, human_verified, auto_researched')
        .order('name')
      setProducers(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Group by region
  const grouped = producers.reduce((acc, p) => {
    const key = p.region || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  const regionOrder = ['Burgundy', 'Champagne', 'Rhône', 'Bordeaux', 'Loire', 'Alsace', 'California', 'Oregon', 'Other']

  return (
    <div className={styles.page}>
      <TopBar onGoHome={onGoHome} />
      <header className={styles.header}>
        <h1 className={styles.title}>Producers</h1>
        <span className={`${styles.count} mono`}>{producers.length} in archive</span>
      </header>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.dots}><span /><span /><span /></div>
        </div>
      ) : producers.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No producers yet. Search for one to add it.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {regionOrder.map(region => {
            if (!grouped[region]?.length) return null
            return (
              <section key={region} className={styles.group}>
                <div className={`${styles.regionLabel} mono`}>{region}</div>
                {grouped[region].map(p => (
                  <ProducerRow key={p.id} producer={p} onNavigate={onNavigate} />
                ))}
              </section>
            )
          })}
          {/* Any regions not in the order list */}
          {Object.keys(grouped)
            .filter(r => !regionOrder.includes(r))
            .map(region => (
              <section key={region} className={styles.group}>
                <div className={`${styles.regionLabel} mono`}>{region}</div>
                {grouped[region].map(p => (
                  <ProducerRow key={p.id} producer={p} onNavigate={onNavigate} />
                ))}
              </section>
            ))
          }
        </div>
      )}
    </div>
  )
}

function ProducerRow({ producer, onNavigate }) {
  return (
    <button className={styles.row} onClick={() => onNavigate('producer', producer.id)}>
      <div className={styles.rowBody}>
        <div className={styles.rowName}>{producer.name}</div>
        <div className={styles.rowMeta}>
          {[producer.sub_region, producer.appellation].filter(Boolean).join(' · ')}
          {producer.winemaker && (
            <span className={styles.rowWinemaker}> — {producer.winemaker}</span>
          )}
        </div>
      </div>
      <div className={styles.rowRight}>
        {!producer.human_verified && producer.auto_researched && (
          <span className={styles.unverifiedDot} title="Awaiting verification" />
        )}
        {(producer.biodynamic_certified || producer.organic_certified) && (
          <span className={styles.organicDot} title={producer.biodynamic_certified ? 'Biodynamic' : 'Organic'} />
        )}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  )
}

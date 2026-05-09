import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import BackButton from '../components/BackButton'
import VerifyBanner from '../components/VerifyBanner'
import TopBar from '../components/TopBar'
import DataRow from '../components/DataRow'
import WineList from '../components/WineList'
import styles from './ProducerPage.module.css'

export default function ProducerPage({ id, onBack, onNavigate, currentUser, onGoHome }) {
  const [producer, setProducer] = useState(null)
  const [wines, setWines] = useState([])
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: p }, { data: w }] = await Promise.all([
        supabase.from('producers').select('*').eq('id', id).single(),
        supabase.from('wines').select('*').eq('producer_id', id).order('classification').order('name'),
      ])
      setProducer(p)
        setVerified(p?.human_verified || false)
      setWines(w || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <LoadingState onBack={onBack} />
  if (!producer) return <ErrorState onBack={onBack} />

  const women = Array.isArray(producer.women_in_leadership) ? producer.women_in_leadership : []
  const evolution = Array.isArray(producer.evolution_log) ? producer.evolution_log : []

  // Group wines by classification
  const wineGroups = wines.reduce((acc, w) => {
    const key = w.classification || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(w)
    return acc
  }, {})

  const classOrder = ['Grand Cru', '1er Cru', 'Village', 'Regional', 'AVA', 'Other']

  return (
    <div className={styles.page}>
      <TopBar onGoHome={onGoHome} right={<BackButton onClick={onBack} />} />

      {/* Verification banner */}
      {producer && !verified && producer.auto_researched && (
        <VerifyBanner
          table="producers"
          id={producer.id}
          currentUser={currentUser}
          onVerified={() => setVerified(true)}
        />
      )}

      {/* Hero */}
      <header className={styles.hero}>
        <div className={`${styles.region} mono`}>
          {[producer.country, producer.region, producer.sub_region].filter(Boolean).join(' · ')}
        </div>
        <h1 className={styles.name}>{producer.name}</h1>
        {producer.appellation && (
          <div className={`${styles.appellation} mono`}>{producer.appellation}</div>
        )}

        {/* Certifications */}
        <div className={styles.badges}>
          {producer.biodynamic_certified && <span className={styles.badge}>Biodynamic</span>}
          {producer.organic_certified && !producer.biodynamic_certified && <span className={styles.badge}>Organic</span>}
        </div>
      </header>

      <div className={styles.body}>

        {/* Stylistic Profile */}
        {producer.stylistic_profile && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile</h2>
            <p className={styles.prose}>{producer.stylistic_profile}</p>
          </section>
        )}

        {/* Key People */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>People</h2>
          <div className={styles.dataBlock}>
            {producer.winemaker && <DataRow label="Winemaker" value={producer.winemaker} />}
            {producer.vineyard_director && producer.vineyard_director !== producer.winemaker && (
              <DataRow label="Vineyard Director" value={producer.vineyard_director} />
            )}
            {producer.commercial_lead && <DataRow label="Commercial" value={producer.commercial_lead} />}
            {producer.consultant && <DataRow label="Consultant" value={producer.consultant} />}
            {producer.importer_uk && <DataRow label="UK Importer" value={producer.importer_uk} />}
          </div>
        </section>

        {/* Women in Leadership */}
        {women.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Women in Leadership</h2>
            {women.map((person, i) => (
              <div key={i} className={styles.personCard}>
                <div className={styles.personName}>{person.name}</div>
                <div className={`${styles.personRole} mono`}>
                  {person.role}{person.since ? ` · from ${person.since}` : ''}
                </div>
                {person.notes && <p className={styles.personNotes}>{person.notes}</p>}
              </div>
            ))}
          </section>
        )}

        {/* Farming */}
        {producer.farming_notes && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Farming</h2>
            <p className={styles.prose}>{producer.farming_notes}</p>
          </section>
        )}

        {/* Succession */}
        {producer.succession_notes && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Succession</h2>
            <p className={styles.prose}>{producer.succession_notes}</p>
          </section>
        )}

        {/* Evolution Log */}
        {evolution.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Evolution</h2>
            <div className={styles.timeline}>
              {evolution.map((entry, i) => (
                <div key={i} className={styles.timelineEntry}>
                  <div className={`${styles.timelineDate} mono`}>{entry.date}</div>
                  <div className={styles.timelineNote}>{entry.note}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Wines */}
        {wines.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Wines ({wines.length})</h2>
            {classOrder.map(cls => {
              if (!wineGroups[cls]?.length) return null
              return (
                <WineList
                  key={cls}
                  classification={cls}
                  wines={wineGroups[cls]}
                  onSelect={wine => onNavigate('wine', wine.id)}
                />
              )
            })}
          </section>
        )}

        {/* Source */}
        {producer.source_quality && (
          <div className={styles.source}>
            <span className="mono">Sources: </span>{producer.source_quality}
          </div>
        )}

      </div>
    </div>
  )
}

function LoadingState({ onBack }) {
  return (
    <div style={{ padding: '2rem' }}>
      <BackButton onClick={onBack} />
      <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--parchment-ghost)', fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
        Loading…
      </div>
    </div>
  )
}

function ErrorState({ onBack }) {
  return (
    <div style={{ padding: '2rem' }}>
      <BackButton onClick={onBack} />
      <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--parchment-ghost)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
        Producer not found.
      </div>
    </div>
  )
}

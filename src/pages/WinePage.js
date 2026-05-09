import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import BackButton from '../components/BackButton'
import VerifyBanner from '../components/VerifyBanner'
import TopBar from '../components/TopBar'
import DataRow from '../components/DataRow'
import styles from './WinePage.module.css'

export default function WinePage({ id, onBack, onNavigate, currentUser, onGoHome }) {
  const [wine, setWine] = useState(null)
  const [producer, setProducer] = useState(null)
  const [photos, setPhotos] = useState([])
  const [photoOpen, setPhotoOpen] = useState(false)
  const [activePhoto, setActivePhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: w } = await supabase.from('wines').select('*').eq('id', id).single()
      if (w) {
        setWine(w)
        setVerified(w?.human_verified || false)
        const { data: p } = await supabase.from('producers')
          .select('id, name, region, appellation').eq('id', w.producer_id).single()
        setProducer(p)
        // Fetch tasting notes with photos for this wine
        const { data: notes } = await supabase.from('tasting_notes')
          .select('id, image_url, tasted_by, tasted_at')
          .eq('wine_id', id)
          .not('image_url', 'is', null)
          .order('tasted_at', { ascending: false })
        setPhotos(notes || [])
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div style={{ padding: '2rem' }}><BackButton onClick={onBack} /></div>
  if (!wine) return <div style={{ padding: '2rem' }}><BackButton onClick={onBack} /></div>

  const colourAccent = {
    Red: 'var(--burgundy-soft)',
    White: 'var(--white-wine)',
    Rosé: '#c8768a',
    Orange: '#c8903a',
    Sparkling: 'var(--parchment-dim)',
    Dessert: 'var(--gold)',
    Fortified: '#7a4a2a',
  }[wine.colour] || 'var(--parchment-dim)'

  return (
    <div className={styles.page}>
      <TopBar onGoHome={onGoHome} right={<BackButton onClick={onBack} />} />

      {/* Verification banner */}
      {wine && !verified && wine.auto_researched && (
        <VerifyBanner
          table="wines"
          id={wine.id}
          currentUser={currentUser}
          onVerified={() => setVerified(true)}
        />
      )}

      <header className={styles.hero}>
        {producer && (
          <button className={styles.producerLink} onClick={() => onNavigate('producer', producer.id)}>
            <span className="mono">{producer.name}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        <div className={styles.heroTop}>
          <h1 className={styles.wineName}>{wine.name}</h1>
          {/* Photo icon — only shown if photos exist */}
          {photos.length > 0 && (
            <button
              className={styles.photoIconBtn}
              onClick={() => { setActivePhoto(photos[0]); setPhotoOpen(true) }}
              title={`${photos.length} label photo${photos.length > 1 ? 's' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              {photos.length > 1 && (
                <span className={styles.photoCount}>{photos.length}</span>
              )}
            </button>
          )}
        </div>

        <div className={styles.metaRow}>
          {wine.appellation && <span className={`${styles.appellation} mono`}>{wine.appellation}</span>}
          {wine.classification && (
            <span className={styles.classification} style={{ color: colourAccent }}>{wine.classification}</span>
          )}
          {wine.colour && (
            <span className={`${styles.colour} mono`} style={{ color: colourAccent }}>{wine.colour}</span>
          )}
        </div>
      </header>

      <div className={styles.body}>
        {wine.vineyard_notes && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Vineyard</h2>
            <p className={styles.prose}>{wine.vineyard_notes}</p>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Winemaking</h2>
          <div className={styles.dataBlock}>
            {wine.grape_varieties?.length > 0 && (
              <DataRow label="Varieties" value={wine.grape_varieties.join(', ')} />
            )}
            {wine.oak_regime && <DataRow label="Oak" value={wine.oak_regime} />}
            {wine.whole_cluster_pct && <DataRow label="Whole Cluster" value={wine.whole_cluster_pct} />}
            {wine.avg_production && <DataRow label="Production" value={wine.avg_production} />}
          </div>
        </section>

        {wine.avg_drinking_window && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Drinking Window</h2>
            <div className={styles.drinkingWindow}>{wine.avg_drinking_window}</div>
          </section>
        )}

        {wine.search_tags?.length > 0 && (
          <div className={styles.tags}>
            {wine.search_tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Photo lightbox */}
      {photoOpen && activePhoto && (
        <div className={styles.lightbox} onClick={() => setPhotoOpen(false)}>
          <div className={styles.lightboxInner} onClick={e => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setPhotoOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <img src={activePhoto.image_url} alt="Label" className={styles.lightboxImg} />
            <div className={styles.lightboxMeta}>
              <span className="mono">
                {activePhoto.tasted_by} · {new Date(activePhoto.tasted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            {photos.length > 1 && (
              <div className={styles.lightboxNav}>
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    className={`${styles.navDot} ${p.id === activePhoto.id ? styles.navDotActive : ''}`}
                    onClick={() => setActivePhoto(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

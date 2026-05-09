import React, { useState, useRef } from 'react'
import { identifyLabel } from '../lib/labelIdentify'
import { researchWine } from '../lib/research'
import EmojiRating from './EmojiRating'
import { uploadLabelPhoto } from '../lib/storage'
import { supabase } from '../lib/supabase'
import styles from './LabelScanner.module.css'

const MODES = { PHOTO: 'photo', MANUAL: 'manual' }

const STAGES = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  IDENTIFIED: 'identified',
  NOTE: 'note',
  SAVING: 'saving',
  RESEARCHING: 'researching',
  RESEARCHED: 'researched',
  DONE: 'done',
  ERROR: 'error',
}

export default function LabelScanner({ currentUser, onClose, onNavigate }) {
  const [mode, setMode] = useState(MODES.PHOTO) // eslint-disable-line no-unused-vars
  const [stage, setStage] = useState(STAGES.IDLE)
  const [manualEntry, setManualEntry] = useState({ producer: '', wine_name: '', vintage: '', appellation: '', colour: 'Red', country: 'France' }) // eslint-disable-line no-unused-vars
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [identified, setIdentified] = useState(null)
  const [matchedWine, setMatchedWine] = useState(null)
  const [researchResult, setResearchResult] = useState(null)
  const [note, setNote] = useState({
    general_notes: '',
    event_context: '',
    nose: '',
    palate: '',
    structure_note: '',
    development_stage: '',
    drink_assessment: '',
    personal_rating: '',
    pairing_notes: '',
  })
  const [showDetail, setShowDetail] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      setImagePreview(dataUrl)
      await processImage(file, dataUrl)
    }
    reader.readAsDataURL(file)
  }

  async function processImage(file, dataUrl) {
    setStage(STAGES.SCANNING)
    setError(null)
    try {
      const base64 = dataUrl.split(',')[1]
      const mimeType = file.type || 'image/jpeg'
      const result = await identifyLabel(base64, mimeType)
      setIdentified(result)

      if (result.producer || result.wine_name) {
        const searchTerm = result.wine_name || result.producer
        const { data: wines } = await supabase
          .from('wines')
          .select('id, name, full_name, appellation, classification, producer_id')
          .ilike('name', `%${searchTerm}%`)
          .limit(3)
        if (wines?.length >= 1) setMatchedWine(wines[0])
      }

      setStage(STAGES.IDENTIFIED)
    } catch (e) {
      setError(e.message)
      setStage(STAGES.ERROR)
    }
  }

  async function handleResearch() {
    setStage(STAGES.RESEARCHING)
    try {
      const result = await researchWine({
        producer: identified?.producer,
        wine_name: identified?.wine_name,
        vintage: identified?.vintage,
        appellation: identified?.appellation,
        classification: identified?.classification,
        colour: identified?.colour,
        country: identified?.country,
      }, currentUser)
      setResearchResult(result)
      // Update matchedWine so note can link to it
      if (result.wine_id) {
        setMatchedWine({ id: result.wine_id, producer_id: result.producer_id })
      }
      setStage(STAGES.RESEARCHED)
    } catch (e) {
      setError(e.message)
      setStage(STAGES.ERROR)
    }
  }

  // eslint-disable-next-line no-unused-vars
  // eslint-disable-next-line no-unused-vars
  async function handleManualResearch() {
    if (!manualEntry.producer && !manualEntry.wine_name) return
    setIdentified({
      producer: manualEntry.producer,
      wine_name: manualEntry.wine_name,
      vintage: manualEntry.vintage,
      appellation: manualEntry.appellation,
      colour: manualEntry.colour,
      country: manualEntry.country,
      confidence: 'high',
    })
    // Check for existing match
    const searchTerm = manualEntry.wine_name || manualEntry.producer
    if (searchTerm) {
      const { data: wines } = await supabase
        .from('wines')
        .select('id, name, full_name, appellation, classification, producer_id')
        .ilike('name', `%${searchTerm}%`)
        .limit(3)
      if (wines?.length >= 1) setMatchedWine(wines[0])
    }
    setStage(STAGES.IDENTIFIED)
  }

  async function saveNote() {
    setStage(STAGES.SAVING)
    try {
      let imageUrl = null
      if (imageFile) {
        try { imageUrl = await uploadLabelPhoto(imageFile, currentUser) } catch {}
      }

      const noteData = {
        wine_id: matchedWine?.id || null,
        producer_id: matchedWine?.producer_id || null,
        tasted_by: currentUser,
        tasted_at: new Date().toISOString(),
        event_context: note.event_context || note.general_notes || null,
        nose: note.nose || null,
        palate: note.palate || note.general_notes || null,
        structure_note: note.structure_note || null,
        development_stage: note.development_stage || null,
        drink_assessment: note.drink_assessment || null,
        personal_rating: note.personal_rating || null,
        pairing_notes: note.pairing_notes || null,
        image_url: imageUrl,
        raw_ocr_text: identified ? JSON.stringify(identified) : null,
      }

      const { error: err } = await supabase.from('tasting_notes').insert(noteData)
      if (err) throw err
      setStage(STAGES.DONE)
    } catch (e) {
      setError(e.message)
      setStage(STAGES.ERROR)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <span className={`${styles.headerTitle} mono`}>Add Wine</span>
          <span className={`${styles.userName} mono`}>{currentUser}</span>
        </div>

        <div className={styles.body}>

          {stage === STAGES.IDLE && (
            <div className={styles.cameraPrompt}>
              {/* Photo option — primary */}
              <button className={styles.cameraIconBtn} onClick={() => fileInputRef.current?.click()}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              <p className={styles.cameraHint}>Tap to photograph a wine label</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {/* Divider */}
              <div className={styles.idleDivider}>
                <span className={styles.idleDividerLine} />
                <span className={`${styles.idleDividerText} mono`}>or</span>
                <span className={styles.idleDividerLine} />
              </div>

              {/* Manual entry — secondary */}
              <button
                className={styles.manualEntryBtn}
                onClick={() => setMode(MODES.MANUAL)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span className="mono">Add wine manually</span>
              </button>
            </div>
          )}

          {/* Manual entry form — shown when mode switches */}
          {stage === STAGES.IDLE && mode === MODES.MANUAL && (
            <div className={styles.manualOverlay}>
              <button className={styles.manualBack} onClick={() => setMode(MODES.PHOTO)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                <span className="mono">Back</span>
              </button>
              <div className={styles.manualForm}>
                <ManualField label="Producer" value={manualEntry.producer} onChange={v => setManualEntry(e => ({...e, producer: v}))} placeholder="e.g. Domaine Yvon Clerget" />
                <ManualField label="Wine" value={manualEntry.wine_name} onChange={v => setManualEntry(e => ({...e, wine_name: v}))} placeholder="e.g. Volnay 1er Cru Caillerets" />
                <ManualField label="Vintage" value={manualEntry.vintage} onChange={v => setManualEntry(e => ({...e, vintage: v}))} placeholder="e.g. 2019" />
                <ManualField label="Appellation" value={manualEntry.appellation} onChange={v => setManualEntry(e => ({...e, appellation: v}))} placeholder="e.g. Volnay" />
                <div className={styles.manualRow}>
                  <div className={styles.manualHalf}>
                    <label className={`${styles.manualLabel} mono`}>Colour</label>
                    <select className={styles.manualSelect} value={manualEntry.colour} onChange={e => setManualEntry(en => ({...en, colour: e.target.value}))}>
                      {['Red','White','Rosé','Orange','Sparkling','Dessert','Fortified'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.manualHalf}>
                    <label className={`${styles.manualLabel} mono`}>Country</label>
                    <input className={styles.manualInput} value={manualEntry.country} onChange={e => setManualEntry(en => ({...en, country: e.target.value}))} />
                  </div>
                </div>
                <button
                  className={styles.primaryBtn}
                  onClick={handleManualResearch}
                  disabled={!manualEntry.producer && !manualEntry.wine_name}
                >
                  Find or Research Wine
                </button>
              </div>
            </div>
          )}

          {stage === STAGES.SCANNING && (
            <div className={styles.scanning}>
              {imagePreview && <img src={imagePreview} alt="Label" className={styles.previewImg} />}
              <div className={styles.scanningText}>
                <div className={styles.loadingDots}><span /><span /><span /></div>
                <p className="mono">Identifying label…</p>
              </div>
            </div>
          )}

          {stage === STAGES.RESEARCHING && (
            <div className={styles.scanning}>
              <div className={styles.loadingDots}><span /><span /><span /></div>
              <p className="mono">Researching {identified?.producer || identified?.wine_name}…</p>
              <p style={{fontFamily:'var(--font-serif)',fontStyle:'italic',fontSize:'0.82rem',color:'var(--parchment-ghost)',marginTop:'0.5rem',textAlign:'center'}}>
                Checking sources, verifying details
              </p>
            </div>
          )}

          {stage === STAGES.RESEARCHED && researchResult && (
            <div className={styles.identified}>
              <div className={styles.identifiedInfo}>
                <div className={`${styles.confidence} mono`} data-level="medium">
                  Research complete · awaiting verification
                </div>
                {researchResult.research?.producer?.name && (
                  <div className={styles.identProducer}>{researchResult.research.producer.name}</div>
                )}
                {researchResult.research?.wine?.name && (
                  <div className={styles.identWine}>{researchResult.research.wine.name}</div>
                )}
                {researchResult.research?.producer?.uncertainty_notes && (
                  <p className={styles.identNotes}>
                    ⚠ {researchResult.research.producer.uncertainty_notes}
                  </p>
                )}
              </div>
              <div className={styles.identActions}>
                <button className={styles.primaryBtn} onClick={() => {
                  if (researchResult.wine_id) setMatchedWine({ id: researchResult.wine_id })
                  setStage(STAGES.NOTE)
                }}>
                  Add Tasting Note
                </button>
                {researchResult.wine_id && (
                  <button className={styles.ghostBtn} onClick={() => {
                    onNavigate('wine', researchResult.wine_id)
                    onClose()
                  }}>
                    View Research Notes
                  </button>
                )}
                <button className={styles.ghostBtn} onClick={onClose}>Done</button>
              </div>
            </div>
          )}

          {stage === STAGES.IDENTIFIED && identified && (
            <div className={styles.identified}>
              {imagePreview && <img src={imagePreview} alt="Label" className={styles.previewThumb} />}
              <div className={styles.identifiedInfo}>
                <div className={`${styles.confidence} mono`} data-level={identified.confidence}>
                  {identified.confidence} confidence
                </div>
                {identified.producer && <div className={styles.identProducer}>{identified.producer}</div>}
                {identified.wine_name && <div className={styles.identWine}>{identified.wine_name}</div>}
                <div className={styles.identMeta}>
                  {[identified.vintage, identified.appellation, identified.classification, identified.colour].filter(Boolean).join(' · ')}
                </div>
                {matchedWine && (
                  <div className={styles.matchedWine}>
                    <span className="mono">Matched: </span>
                    <button className={styles.matchLink} onClick={() => onNavigate('wine', matchedWine.id)}>
                      {matchedWine.full_name || matchedWine.name}
                    </button>
                  </div>
                )}
                {identified.notes && <p className={styles.identNotes}>{identified.notes}</p>}
              </div>
              <div className={styles.identActions}>
                <button className={styles.primaryBtn} onClick={() => setStage(STAGES.NOTE)}>
                  Add Tasting Note
                </button>
                {!matchedWine && (
                  <button className={styles.researchBtn} onClick={handleResearch}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    Research this wine
                  </button>
                )}
                <button className={styles.ghostBtn} onClick={onClose}>
                  Done — no note needed
                </button>
              </div>
            </div>
          )}

          {stage === STAGES.NOTE && (
            <div className={styles.noteForm}>
              <div className={styles.noteFormHeader}>
                {identified?.producer && <div className={styles.noteProducer}>{identified.producer}</div>}
                {identified?.wine_name && <div className={styles.noteWine}>{identified.wine_name}</div>}
                {identified?.vintage && <div className={`${styles.noteVintage} mono`}>{identified.vintage}</div>}
              </div>

              {/* PRIMARY: General notes — big, open, first */}
              <NoteField
                label="Notes"
                value={note.general_notes}
                onChange={v => setNote(n => ({...n, general_notes: v}))}
                multiline
                rows={5}
                placeholder="General impressions, thoughts, context… anything goes."
              />

              <NoteField
                label="Event / Context"
                value={note.event_context}
                onChange={v => setNote(n => ({...n, event_context: v}))}
                placeholder="e.g. Dinner at The Ledbury, blind tasting"
              />

              <div className={styles.fieldGroup}>
                <label className={`${styles.fieldLabel} mono`}>Development</label>
                <div className={styles.chipRow}>
                  {['Closed', 'Opening', 'Developing', 'Peak', 'Declining', 'Past peak'].map(s => (
                    <button
                      key={s}
                      className={`${styles.chip} ${note.development_stage === s ? styles.chipActive : ''}`}
                      onClick={() => setNote(n => ({...n, development_stage: s}))}
                    >{s}</button>
                  ))}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={`${styles.fieldLabel} mono`}>Rating</label>
                <EmojiRating
                  value={note.personal_rating}
                  onChange={v => setNote(n => ({...n, personal_rating: v}))}
                  size="large"
                />
              </div>

              {/* OPTIONAL: Structured detail toggle */}
              <button
                className={styles.detailToggle}
                onClick={() => setShowDetail(d => !d)}
              >
                <span className="mono">{showDetail ? 'Hide detail fields' : 'Add structured detail'}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  style={{ transform: showDetail ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showDetail && (
                <div className={styles.detailFields}>
                  <NoteField label="Nose" value={note.nose} onChange={v => setNote(n => ({...n, nose: v}))} multiline placeholder="Aromas…" />
                  <NoteField label="Palate" value={note.palate} onChange={v => setNote(n => ({...n, palate: v}))} multiline placeholder="Flavours, texture…" />
                  <NoteField label="Structure" value={note.structure_note} onChange={v => setNote(n => ({...n, structure_note: v}))} placeholder="Acidity, tannin, length…" />
                  <NoteField label="Drink" value={note.drink_assessment} onChange={v => setNote(n => ({...n, drink_assessment: v}))} placeholder="Drink now / Hold / Past peak…" />
                  <NoteField label="Pairing" value={note.pairing_notes} onChange={v => setNote(n => ({...n, pairing_notes: v}))} placeholder="What you ate…" />
                </div>
              )}

              <button className={styles.primaryBtn} onClick={saveNote}>Save Note</button>
              <button className={styles.ghostBtn} onClick={() => setStage(STAGES.IDENTIFIED)}>Back</button>
            </div>
          )}

          {stage === STAGES.SAVING && (
            <div className={styles.scanning}>
              <div className={styles.loadingDots}><span /><span /><span /></div>
              <p className="mono">Saving…</p>
            </div>
          )}

          {stage === STAGES.DONE && (
            <div className={styles.done}>
              <div className={styles.doneIcon}>✓</div>
              <p className={styles.doneText}>Note saved</p>
              <p className={`${styles.doneSub} mono`}>attributed to {currentUser}</p>
              <button className={styles.primaryBtn} onClick={onClose}>Done</button>
            </div>
          )}

          {stage === STAGES.ERROR && (
            <div className={styles.errorState}>
              <p className={`${styles.errorText} mono`}>{error}</p>
              <button className={styles.ghostBtn} onClick={() => { setStage(STAGES.IDLE); setError(null) }}>
                Try again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// eslint-disable-next-line no-unused-vars
// eslint-disable-next-line no-unused-vars
function ManualField({ label, value, onChange, placeholder, autoFocus }) {
  return (
    <div style={{ width: '100%', marginBottom: '0.75rem' }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: '0.3rem' }}>{label}</label>
      <input
        style={{ width: '100%', background: 'var(--ink)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', color: 'var(--parchment)', fontFamily: 'var(--font-serif)', fontSize: '0.95rem', padding: '0.6rem 0.75rem', outline: 'none', WebkitAppearance: 'none' }}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </div>
  )
}

function NoteField({ label, value, onChange, placeholder, multiline, rows = 3 }) {
  return (
    <div className={styles.fieldGroup}>
      <label className={`${styles.fieldLabel} mono`}>{label}</label>
      {multiline ? (
        <textarea
          className={styles.fieldTextarea}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          className={styles.fieldInput}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

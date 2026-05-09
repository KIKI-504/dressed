import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import styles from './MyNotesPage.module.css'
import TopBar from '../components/TopBar'
import EmojiRating from '../components/EmojiRating'

export default function MyNotesPage({ currentUser, onNavigate, onGoHome }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'mine'
  const [editingNote, setEditingNote] = useState(null)

  async function load() {
    setLoading(true)
    let q = supabase
      .from('tasting_notes')
      .select(`
        id, tasted_by, tasted_at, event_context, nose, palate,
        development_stage, drink_assessment, personal_rating,
        pairing_notes, structure_note, image_url, raw_ocr_text,
        wine_id, producer_id,
        wines (name, full_name, appellation, classification),
        producers (name)
      `)
      .order('tasted_at', { ascending: false })

    if (filter === 'mine') q = q.eq('tasted_by', currentUser)

    const { data } = await q
    setNotes(data || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [filter, currentUser])

  async function saveEdit(id, updated) {
    await supabase.from('tasting_notes').update(updated).eq('id', id)
    setEditingNote(null)
    load()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {filter === 'mine' ? currentUser : 'All Notes'}
        </h1>
        <div className={styles.filterRow}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
            onClick={() => setFilter('all')}
          >
            <span className="mono">Everyone</span>
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'mine' ? styles.filterActive : ''}`}
            onClick={() => setFilter('mine')}
          >
            <span className="mono">Mine</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.dots}><span /><span /><span /></div>
        </div>
      ) : notes.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyLine} />
          <p className={styles.emptyText}>
            No tasting notes yet.<br />
            Use the camera button to add one.
          </p>
        </div>
      ) : (
        <div className={styles.notes}>
          <div className={styles.count}>
            <span className="mono">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
          </div>
          {notes.map(note => (
            editingNote?.id === note.id ? (
              <NoteEditor
                key={note.id}
                note={editingNote}
                onChange={setEditingNote}
                onSave={() => saveEdit(note.id, {
                  event_context: editingNote.event_context,
                  nose: editingNote.nose,
                  palate: editingNote.palate,
                  structure_note: editingNote.structure_note,
                  development_stage: editingNote.development_stage,
                  drink_assessment: editingNote.drink_assessment,
                  personal_rating: editingNote.personal_rating,
                  pairing_notes: editingNote.pairing_notes,
                })}
                onCancel={() => setEditingNote(null)}
              />
            ) : (
              <NoteCard
                key={note.id}
                note={note}
                currentUser={currentUser}
                onNavigate={onNavigate}
                onEdit={() => setEditingNote({...note})}
              />
            )
          ))}
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, currentUser, onNavigate, onEdit }) {
  const wine = note.wines
  const producer = note.producers
  const date = new Date(note.tasted_at)
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const isOwn = note.tasted_by === currentUser

  let labelInfo = null
  if (!wine && note.raw_ocr_text) {
    try { labelInfo = JSON.parse(note.raw_ocr_text) } catch {}
  }

  const wineName = wine?.name || labelInfo?.wine_name || 'Unknown wine'
  const producerName = producer?.name || labelInfo?.producer || null
  const vintage = labelInfo?.vintage || null
  const displayNote = note.palate || note.nose || note.event_context

  return (
    <div className={styles.card}>
      {note.image_url && (
        <img src={note.image_url} alt="Label" className={styles.labelThumb} />
      )}
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <div className={`${styles.cardDate} mono`}>{dateStr}</div>
          <div className={styles.cardAuthor}>
            <span className={`${styles.authorName} mono`}
              style={{ color: isOwn ? 'var(--gold-dim)' : 'var(--sage)' }}>
              {note.tasted_by}
            </span>
            {isOwn && (
              <button className={styles.editBtn} onClick={onEdit}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Producer name — large and prominent */}
        {producerName && (
          <div className={styles.cardProducer}>{producerName}</div>
        )}

        {/* Wine name + vintage — hotlink to research page */}
        <button
          className={styles.cardWineLink}
          onClick={() => note.wine_id && onNavigate('wine', note.wine_id)}
          disabled={!note.wine_id}
        >
          <span className={styles.cardWineName}>{wineName}</span>
          {vintage && <span className={`${styles.cardVintage} mono`}>{vintage}</span>}
          {note.wine_id && (
            <svg className={styles.cardWineArrow} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>

        {displayNote && <p className={styles.cardNote}>{displayNote}</p>}
        <div className={styles.cardMeta}>
          {note.development_stage && <span className={styles.metaChip}>{note.development_stage}</span>}
          {note.personal_rating && (
            ['🤩','🙂','🤔','😕','🤮'].includes(note.personal_rating)
              ? <span className={styles.emojiRating}>{note.personal_rating}</span>
              : <span className={styles.metaChip}>{note.personal_rating}</span>
          )}
          {note.drink_assessment && <span className={styles.metaChip}>{note.drink_assessment}</span>}
        </div>
      </div>
    </div>
  )
}

function NoteEditor({ note, onChange, onSave, onCancel }) {
  const set = (field, val) => onChange(n => ({...n, [field]: val}))

  return (
    <div className={styles.editor}>
      <div className={`${styles.editorLabel} mono`}>Editing note</div>
      <textarea className={styles.editorField} rows={4}
        placeholder="General notes…"
        value={note.palate || ''}
        onChange={e => set('palate', e.target.value)} />
      <input className={styles.editorInput} type="text"
        placeholder="Event / Context"
        value={note.event_context || ''}
        onChange={e => set('event_context', e.target.value)} />
      <input className={styles.editorInput} type="text"
        placeholder="Nose"
        value={note.nose || ''}
        onChange={e => set('nose', e.target.value)} />
      <input className={styles.editorInput} type="text"
        placeholder="Structure"
        value={note.structure_note || ''}
        onChange={e => set('structure_note', e.target.value)} />
      <input className={styles.editorInput} type="text"
        placeholder="Drink assessment"
        value={note.drink_assessment || ''}
        onChange={e => set('drink_assessment', e.target.value)} />
      <div style={{marginBottom:'0.5rem'}}>
        <label style={{display:'block',fontFamily:'var(--font-mono)',fontSize:'0.62rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--gold-dim)',marginBottom:'0.4rem'}}>Rating</label>
        <EmojiRating value={note.personal_rating || ''} onChange={v => set('personal_rating', v)} size="large" />
      </div>
      <input className={styles.editorInput} type="text"
        placeholder="Pairing"
        value={note.pairing_notes || ''}
        onChange={e => set('pairing_notes', e.target.value)} />
      <div className={styles.editorActions}>
        <button className={styles.saveBtn} onClick={onSave}>Save</button>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

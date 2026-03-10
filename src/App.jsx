import { useState, useRef, useEffect } from 'react'
import { supabase, supabaseAdmin } from './supabase.js'

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
 
  :root {
    --cream: #F7F4EF;
    --ink: #1A1916;
    --warm-mid: #8C8072;
    --accent: #C9A96E;
    --soft: #E8E2D9;
    --love: #C47A6A;
    --unsure: #8C9BAF;
  }

  body { background: var(--cream); font-family: 'Montserrat', sans-serif; color: var(--ink); }
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 28px 48px 20px; border-bottom: 1px solid var(--soft);
    position: sticky; top: 0; background: var(--cream); z-index: 100;
  }
  .logo {
    font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 300;
    letter-spacing: 0.18em; font-style: italic; color: var(--ink);
  }
  .logo span { color: var(--accent); }
  .header-nav { display: flex; gap: 32px; align-items: center; }
  .nav-btn {
    background: none; border: none; cursor: pointer; font-family: 'Montserrat', sans-serif;
    font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-mid);
    padding: 4px 0; border-bottom: 1px solid transparent; transition: all 0.2s;
  }
  .nav-btn:hover, .nav-btn.active { color: var(--ink); border-bottom-color: var(--accent); }

  .main { flex: 1; padding: 0 48px 48px; }

  .upload-section { padding: 48px 0 32px; }
  .upload-intro {
    font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-style: italic;
    color: var(--warm-mid); margin-bottom: 28px; line-height: 1.6;
  }
  .upload-area {
    border: 1px dashed var(--warm-mid); border-radius: 2px; padding: 56px 32px;
    text-align: center; cursor: pointer; transition: all 0.25s; position: relative;
    overflow: hidden; background: transparent;
  }
  .upload-area:hover { border-color: var(--accent); background: rgba(201,169,110,0.03); }
  .upload-icon { font-size: 1.8rem; margin-bottom: 12px; opacity: 0.4; }
  .upload-label {
    font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-style: italic;
    color: var(--warm-mid); display: block; margin-bottom: 6px;
  }
  .upload-sub { font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-mid); opacity: 0.7; }
  .upload-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }

  .queue { margin-top: 32px; display: flex; flex-direction: column; gap: 12px; }
  .queue-item {
    display: flex; align-items: center; gap: 16px; background: white; padding: 12px 16px;
    border-radius: 2px; box-shadow: 0 1px 3px rgba(26,25,22,0.06);
  }
  .queue-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 1px; flex-shrink: 0; }
  .queue-name { font-size: 0.62rem; color: var(--ink); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .queue-status { font-size: 0.58rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--warm-mid); flex-shrink: 0; }
  .queue-status.done { color: var(--accent); }
  .queue-status.processing { animation: pulse 1.4s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }

  .filter-bar {
    display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
    padding: 24px 0 28px; border-bottom: 1px solid var(--soft); margin-bottom: 36px;
  }
  .filter-label { font-size: 0.58rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-mid); margin-right: 4px; }
  .filter-tag {
    padding: 5px 14px; border-radius: 20px; font-size: 0.58rem; letter-spacing: 0.12em;
    text-transform: uppercase; cursor: pointer; border: 1px solid var(--soft);
    background: transparent; font-family: 'Montserrat', sans-serif; transition: all 0.18s; color: var(--warm-mid);
  }
  .filter-tag:hover { border-color: var(--warm-mid); color: var(--ink); }
  .filter-tag.active { background: var(--ink); color: var(--cream); border-color: var(--ink); }
  .search-input {
    margin-left: auto; padding: 6px 16px; border: 1px solid var(--soft); background: transparent;
    font-family: 'Montserrat', sans-serif; font-size: 0.62rem; letter-spacing: 0.1em; color: var(--ink);
    outline: none; border-radius: 20px; transition: border-color 0.2s; width: 180px;
  }
  .search-input:focus { border-color: var(--warm-mid); }
  .search-input::placeholder { color: var(--warm-mid); opacity: 0.6; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 28px; }
  .card {
    background: white; border-radius: 2px; overflow: hidden; cursor: pointer;
    transition: transform 0.25s, box-shadow 0.25s; box-shadow: 0 1px 3px rgba(26,25,22,0.06);
  }
  .card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(26,25,22,0.1); }
  .card-img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; }
  .card-body { padding: 16px; }
  .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .card-date { font-size: 0.55rem; color: var(--warm-mid); opacity: 0.7; }
  .card-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; }
  .tag {
    font-size: 0.5rem; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 3px 8px; background: var(--soft); border-radius: 10px; color: var(--warm-mid);
  }
  .card-note { font-size: 0.65rem; color: var(--warm-mid); font-style: italic; line-height: 1.5; }

  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding-top: 36px; }
  .stat-card { background: white; padding: 28px; border-radius: 2px; box-shadow: 0 1px 3px rgba(26,25,22,0.06); }
  .stat-title { font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-mid); margin-bottom: 20px; }
  .stat-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .stat-bar-label { font-size: 0.62rem; color: var(--ink); width: 110px; flex-shrink: 0; text-transform: capitalize; }
  .stat-bar-track { flex: 1; height: 3px; background: var(--soft); border-radius: 2px; overflow: hidden; }
  .stat-bar-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.6s ease; }
  .stat-count { font-size: 0.6rem; color: var(--warm-mid); width: 24px; text-align: right; }
  .stat-big { font-family: 'Cormorant Garamond', serif; font-size: 3.5rem; font-weight: 300; color: var(--ink); }
  .stat-big-label { font-size: 0.58rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--warm-mid); margin-top: 4px; }

  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(26,25,22,0.6); z-index: 300;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(6px); padding: 24px; animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal {
    background: var(--cream); max-width: 800px; width: 100%; border-radius: 2px;
    overflow: hidden; max-height: 90vh; display: grid; grid-template-columns: 1fr 1fr;
    animation: slideUp 0.25s ease;
  }
  @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
  .modal-img { width: 100%; height: 100%; object-fit: cover; min-height: 400px; display: block; }
  .modal-body { padding: 36px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
  .modal-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .modal-date { font-size: 0.6rem; color: var(--warm-mid); opacity: 0.7; }
  .modal-close {
    background: none; border: none; cursor: pointer; font-size: 1.2rem;
    color: var(--warm-mid); line-height: 1; padding: 0; margin-left: auto; transition: color 0.2s;
  }
  .modal-close:hover { color: var(--ink); }
  .modal-section-label { font-size: 0.55rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-mid); margin-bottom: 8px; }
  .modal-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .reaction-row { display: flex; gap: 10px; }
  .reaction-btn {
    flex: 1; padding: 10px; border-radius: 2px; border: 1px solid var(--soft);
    background: transparent; cursor: pointer; font-family: 'Montserrat', sans-serif;
    font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; transition: all 0.18s;
    display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--warm-mid);
  }
  .reaction-btn.love.active { background: var(--love); color: white; border-color: var(--love); }
  .reaction-btn.unsure.active { background: var(--unsure); color: white; border-color: var(--unsure); }
  .reaction-btn:hover { border-color: var(--warm-mid); color: var(--ink); }
  .notes-input {
    width: 100%; border: 1px solid var(--soft); background: white; padding: 12px 14px;
    font-family: 'Montserrat', sans-serif; font-size: 0.65rem; color: var(--ink);
    resize: none; outline: none; border-radius: 2px; line-height: 1.6;
    transition: border-color 0.2s; min-height: 80px;
  }
  .notes-input:focus { border-color: var(--warm-mid); }
  .notes-input::placeholder { color: var(--warm-mid); opacity: 0.6; font-style: italic; }
  .save-btn {
    padding: 12px; background: var(--ink); color: var(--cream); border: none; cursor: pointer;
    font-family: 'Montserrat', sans-serif; font-size: 0.6rem; letter-spacing: 0.2em;
    text-transform: uppercase; border-radius: 2px; transition: background 0.2s; margin-top: auto;
  }
  .save-btn:hover { background: var(--warm-mid); }
  .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .empty { text-align: center; padding: 80px 32px; }
  .empty-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-style: italic; color: var(--warm-mid); margin-bottom: 8px; }
  .empty-sub { font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warm-mid); opacity: 0.6; }

  .page-title {
    font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 300;
    letter-spacing: 0.3em; text-transform: uppercase; color: var(--warm-mid); padding: 32px 0 0;
  }

  .loading { text-align: center; padding: 80px 32px; }
  .loading-text {
    font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-style: italic;
    color: var(--warm-mid); animation: pulse 1.8s ease-in-out infinite;
  }

  @media (max-width: 640px) {
    .header { padding: 20px 20px 16px; }
    .main { padding: 0 20px 40px; }
    .modal { grid-template-columns: 1fr; }
    .modal-img { min-height: 240px; }
    .stats-grid { grid-template-columns: 1fr; }
    .header-nav { gap: 16px; }
  }
`

function getTagFrequency(outfits) {
  const freq = {}
  outfits.forEach(o => (o.tags || []).forEach(t => { freq[t] = (freq[t] || 0) + 1 }))
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10)
}

export default function App() {
  const [view, setView] = useState('wardrobe')
  const [outfits, setOutfits] = useState([])
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState([])
  const [selected, setSelected] = useState(null)
  const [activeFilter, setActiveFilter] = useState(null)
  const [search, setSearch] = useState('')
  const [modalNote, setModalNote] = useState('')
  const [modalReaction, setModalReaction] = useState(null)
  const [saving, setSaving] = useState(false)
  const nextId = useRef(Date.now())
  const processingRef = useRef(false)

  // Load outfits from Supabase on mount
  useEffect(() => {
    loadOutfits()
  }, [])

  async function loadOutfits() {
    setLoading(true)
    const { data, error } = await supabase
      .from('outfits')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setOutfits(data)
    setLoading(false)
  }

  // Process upload queue one at a time
  useEffect(() => {
    const waiting = queue.find(q => q.status === 'waiting')
    if (!waiting || processingRef.current) return
    processItem(waiting)
  }, [queue])

  async function processItem(item) {
    processingRef.current = true
    setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'processing' } : i))

    try {
      // 1. Upload image to Supabase Storage
      const ext = item.file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('outfit-images')
        .upload(path, item.file, { contentType: item.file.type })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('outfit-images')
        .getPublicUrl(path)

      // 2. AI tagging
      const base64 = await new Promise(res => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result.split(',')[1])
        reader.readAsDataURL(item.file)
      })

      let tags = []
      const resp = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ imageUrl: publicUrl })

      const aiData = await resp.json()
      const parsed = aiData

      tags = parsed.tags || []

      // 3. Save to Supabase database
      const { data: newOutfit, error: dbError } = await supabase
        .from('outfits')
        .insert({
          date: new Date().toISOString().slice(0, 10),
          tags,
          reaction: null,
          note: '',
          image_url: publicUrl,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setOutfits(prev => [newOutfit, ...prev])
      setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'done' } : i))

    } catch (e) {
      console.error(e)
      setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'error' } : i))
    }

    processingRef.current = false
  }

  function handleFiles(files) {
    const images = Array.from(files).filter(f => f.type.startsWith('image/'))
    const newItems = images.map(file => ({
      id: nextId.current++,
      file,
      preview: URL.createObjectURL(file),
      status: 'waiting',
      name: file.name,
    }))
    setQueue(prev => [...prev, ...newItems])
    setView('upload')
  }

  const allTags = [...new Set(outfits.flatMap(o => o.tags || []))].sort()

  const filtered = outfits.filter(o => {
    if (activeFilter && !(o.tags || []).includes(activeFilter)) return false
    if (search) {
      const s = search.toLowerCase()
      if (!(o.tags || []).some(t => t.includes(s)) && !(o.note || '').toLowerCase().includes(s)) return false
    }
    return true
  })

  function openModal(outfit) {
    setSelected(outfit)
    setModalNote(outfit.note || '')
    setModalReaction(outfit.reaction || null)
  }

  async function saveModal() {
    setSaving(true)
    const { error } = await supabase
      .from('outfits')
      .update({ note: modalNote, reaction: modalReaction })
      .eq('id', selected.id)

    if (!error) {
      setOutfits(prev => prev.map(o =>
        o.id === selected.id ? { ...o, note: modalNote, reaction: modalReaction } : o
      ))
    }
    setSaving(false)
    setSelected(null)
  }

  const tagFreq = getTagFrequency(outfits)
  const maxFreq = tagFreq[0]?.[1] || 1
  const loveCount = outfits.filter(o => o.reaction === 'love').length
  const unsureCount = outfits.filter(o => o.reaction === 'unsure').length
  const pendingCount = queue.filter(q => q.status !== 'done' && q.status !== 'error').length

  return (
    <>
      <style>{STYLE}</style>
      <div className="app">
        <header className="header">
          <div className="logo">dr<span>e</span>ssed</div>
          <nav className="header-nav">
            <button className={`nav-btn ${view === 'wardrobe' ? 'active' : ''}`} onClick={() => setView('wardrobe')}>
              Wardrobe{outfits.length > 0 ? ` (${outfits.length})` : ''}
            </button>
            <button className={`nav-btn ${view === 'upload' ? 'active' : ''}`} onClick={() => setView('upload')}>
              Upload{pendingCount > 0 ? ` · ${pendingCount} left` : ''}
            </button>
            <button className={`nav-btn ${view === 'stats' ? 'active' : ''}`} onClick={() => setView('stats')}>Stats</button>
          </nav>
        </header>

        <main className="main">

          {/* UPLOAD */}
          {view === 'upload' && (
            <div className="upload-section">
              <div className="page-title" style={{ marginBottom: 16 }}>Add Looks</div>
              <p className="upload-intro">Drop in one photo or a whole batch — each will be analysed and tagged automatically.</p>
              <label className="upload-area">
                <input className="upload-input" type="file" accept="image/*" multiple
                  onChange={e => { if (e.target.files.length) handleFiles(e.target.files) }} />
                <div className="upload-icon">✦</div>
                <span className="upload-label">Drop your looks here</span>
                <span className="upload-sub">Select multiple · jpg, png, heic</span>
              </label>

              {queue.length > 0 && (
                <div className="queue">
                  {queue.map(item => (
                    <div key={item.id} className="queue-item">
                      <img className="queue-thumb" src={item.preview} alt="" />
                      <span className="queue-name">{item.name}</span>
                      <span className={`queue-status ${item.status === 'done' ? 'done' : item.status === 'processing' ? 'processing' : ''}`}>
                        {item.status === 'done' ? '✓ Saved' : item.status === 'processing' ? 'Analysing…' : item.status === 'error' ? '✕ Error' : 'Waiting'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WARDROBE */}
          {view === 'wardrobe' && (
            <>
              <div className="page-title">Emery's Looks</div>
              <div className="filter-bar">
                <span className="filter-label">Filter</span>
                {allTags.slice(0, 14).map(t => (
                  <button key={t} className={`filter-tag ${activeFilter === t ? 'active' : ''}`}
                    onClick={() => setActiveFilter(activeFilter === t ? null : t)}>{t}</button>
                ))}
                <input className="search-input" placeholder="Search tags, notes…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              {loading ? (
                <div className="loading"><div className="loading-text">Loading your wardrobe…</div></div>
              ) : filtered.length === 0 ? (
                <div className="empty">
                  <div className="empty-title">{outfits.length === 0 ? 'Nothing here yet' : 'No matches'}</div>
                  <div className="empty-sub">{outfits.length === 0 ? 'Upload a look to get started' : 'Try a different filter'}</div>
                </div>
              ) : (
                <div className="grid">
                  {filtered.map(outfit => (
                    <div key={outfit.id} className="card" onClick={() => openModal(outfit)}>
                      {outfit.image_url && <img className="card-img" src={outfit.image_url} alt="outfit" />}
                      <div className="card-body">
                        <div className="card-top">
                          <span className="card-date">{outfit.date}</span>
                          {outfit.reaction && (
                            <span style={{ fontSize: '1rem' }}>{outfit.reaction === 'love' ? '♥' : '?'}</span>
                          )}
                        </div>
                        <div className="card-tags">
                          {(outfit.tags || []).slice(0, 4).map(t => <span key={t} className="tag">{t}</span>)}
                          {(outfit.tags || []).length > 4 && <span className="tag">+{outfit.tags.length - 4}</span>}
                        </div>
                        {outfit.note && <div className="card-note">"{outfit.note}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STATS */}
          {view === 'stats' && (
            <>
              <div className="page-title">Style Stats</div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-title">Archive</div>
                  <div className="stat-big">{outfits.length}</div>
                  <div className="stat-big-label">looks saved</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Reactions</div>
                  <div style={{ display: 'flex', gap: 28 }}>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem', fontWeight: 300 }}>♥ {loveCount}</div>
                      <div style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--warm-mid)' }}>Loved it</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem', fontWeight: 300 }}>? {unsureCount}</div>
                      <div style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--warm-mid)' }}>Not sure</div>
                    </div>
                  </div>
                </div>
                <div className="stat-card" style={{ gridColumn: '1/-1' }}>
                  <div className="stat-title">Most Worn Tags</div>
                  {tagFreq.length === 0
                    ? <div style={{ fontSize: '0.65rem', color: 'var(--warm-mid)', fontStyle: 'italic' }}>Upload some looks to see your style patterns emerge.</div>
                    : tagFreq.map(([tag, count]) => (
                      <div key={tag} className="stat-row">
                        <span className="stat-bar-label">{tag}</span>
                        <div className="stat-bar-track">
                          <div className="stat-bar-fill" style={{ width: `${(count / maxFreq) * 100}%` }} />
                        </div>
                        <span className="stat-count">{count}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}
        </main>

        {/* MODAL */}
        {selected && (
          <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
            <div className="modal">
              {selected.image_url && <img className="modal-img" src={selected.image_url} alt="outfit" />}
              <div className="modal-body">
                <div className="modal-header">
                  <div className="modal-date">{selected.date}</div>
                  <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
                </div>
                <div>
                  <div className="modal-section-label">Tags</div>
                  <div className="modal-tags">
                    {(selected.tags || []).map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
                <div>
                  <div className="modal-section-label">Reaction</div>
                  <div className="reaction-row">
                    <button className={`reaction-btn love ${modalReaction === 'love' ? 'active' : ''}`}
                      onClick={() => setModalReaction(modalReaction === 'love' ? null : 'love')}>♥ Love it</button>
                    <button className={`reaction-btn unsure ${modalReaction === 'unsure' ? 'active' : ''}`}
                      onClick={() => setModalReaction(modalReaction === 'unsure' ? null : 'unsure')}>? Not sure</button>
                  </div>
                </div>
                <div>
                  <div className="modal-section-label">Notes</div>
                  <textarea className="notes-input"
                    placeholder="How did you feel in this? What worked, what didn't…"
                    value={modalNote} onChange={e => setModalNote(e.target.value)} />
                </div>
                <button className="save-btn" onClick={saveModal} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Look'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

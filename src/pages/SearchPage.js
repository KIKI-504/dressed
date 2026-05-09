import React, { useRef, useState, useEffect } from 'react'
import { useSearch } from '../hooks/useSearch'
import SearchResult from '../components/SearchResult'
import ResearchParameters from '../components/ResearchParameters'
import TopBar from '../components/TopBar'
import { researchWine } from '../lib/research'
import styles from './SearchPage.module.css'

const RECENT_KEY = 'kiki_recent_producers'

function getRecentProducers() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function addRecentProducer(name) {
  const existing = getRecentProducers().filter(n => n !== name)
  const updated = [name, ...existing].slice(0, 8)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

export default function SearchPage({ onNavigate, onOpenScanner, currentUser, onGoHome }) {
  const { query, setQuery, results, loading, error } = useSearch()
  const inputRef = useRef(null)
  const [recentProducers, setRecentProducers] = useState([])
  const [researchState, setResearchState] = useState('idle') // idle | researching | done | error
  const [researchResult, setResearchResult] = useState(null)
  const [researchError, setResearchError] = useState(null)

  useEffect(() => {
    setRecentProducers(getRecentProducers())
  }, [])

  useEffect(() => {
    setResearchState('idle')
    setResearchResult(null)
    setResearchError(null)
  }, [query])

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.result_type]) acc[r.result_type] = []
    acc[r.result_type].push(r)
    return acc
  }, {})

  const typeLabel = { producer: 'Producers', wine: 'Wines', tasting_note: 'Tasting Notes' }
  const typeOrder = ['producer', 'wine', 'tasting_note']

  function handleResultClick(result) {
    if (result.result_type === 'producer') {
      addRecentProducer(result.title)
      setRecentProducers(getRecentProducers())
    }
    onNavigate(result.result_type === 'tasting_note' ? 'wine' : result.result_type, result.id)
  }

  async function handleResearch() {
    setResearchState('researching')
    setResearchError(null)
    try {
      const result = await researchWine({ producer: query, wine_name: query }, currentUser)
      setResearchResult(result)
      setResearchState('done')
      // Add to recent producers
      const name = result.research?.producer?.name || query
      addRecentProducer(name)
      setRecentProducers(getRecentProducers())
    } catch (e) {
      setResearchError(e.message)
      setResearchState('error')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.wordmark} onClick={onGoHome}>
          <span className={styles.wordmarkKiki}>Kiki</span>
          <span className={styles.wordmarkCarnet}>Carnet</span>
        </button>
        <p className={styles.tagline}>Private Wine Archive</p>
        {currentUser && (
          <p className={styles.userGreeting}>
            <span className="mono">{currentUser}</span>
          </p>
        )}
      </header>

      <div className={styles.searchWrap}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="search"
            placeholder="Producer, wine, appellation, winemaker…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => { setQuery(''); inputRef.current?.focus() }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <main className={styles.main}>
        {!query && (
          <div className={styles.emptyState}>
            <div className={styles.emptyDivider} />
            <p className={styles.emptyText}>
              Search producers, wines, appellations,<br />
              winemakers, or tasting notes
            </p>

            {recentProducers.length > 0 ? (
              <>
                <div className={`${styles.recentLabel} mono`}>Recently searched</div>
                <div className={styles.quickLinks}>
                  {recentProducers.map(name => (
                    <button key={name} className={styles.quickLink} onClick={() => setQuery(name)}>
                      {name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className={`${styles.recentLabel} mono`}>Try searching</div>
                <div className={styles.quickLinks}>
                  {['Bize', 'Clerget', 'La Crema'].map(term => (
                    <button key={term} className={styles.quickLink} onClick={() => setQuery(term)}>
                      {term}
                    </button>
                  ))}
                </div>
              </>
            )}


            {/* Research Parameters */}
            <div style={{ marginTop: '1.5rem', width: '100%' }}>
              <ResearchParameters />
            </div>
          </div>
        )}

        {loading && (
          <div className={styles.loading}>
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <span className="mono">Error: {error}</span>
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && !error && (
          <div className={styles.noResults}>
            <p className={`${styles.noResultsText} mono`}>No entries found for "{query}"</p>

            {researchState === 'idle' && (
              <div className={styles.researchPrompt}>
                <p className={styles.researchQuestion}>
                  Would you like a research note?
                </p>
                <button className={styles.researchYesBtn} onClick={handleResearch}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <span>Research "{query}"</span>
                </button>
              </div>
            )}

            {researchState === 'researching' && (
              <div className={styles.researchingState}>
                <div className={styles.researchDots}>
                  <span /><span /><span />
                </div>
                <p className={`${styles.researchingText} mono`}>
                  Researching {query}…
                </p>
                <p className={styles.researchingSubtext}>
                  Checking sources, verifying details
                </p>
              </div>
            )}

            {researchState === 'done' && researchResult && (
              <div className={styles.researchDone}>
                <div className={styles.researchDoneIcon}>✓</div>
                <p className={styles.researchDoneName}>
                  {researchResult.research?.producer?.name || query}
                </p>
                <p className={`${styles.researchDoneSub} mono`}>
                  Research note created · awaiting verification
                </p>
                {researchResult.research?.producer?.uncertainty_notes && (
                  <p className={styles.researchUncertain}>
                    ⚠ {researchResult.research.producer.uncertainty_notes}
                  </p>
                )}
                <div className={styles.researchDoneActions}>
                  {researchResult.producer_id && (
                    <button
                      className={styles.viewResearchBtn}
                      onClick={() => onNavigate('producer', researchResult.producer_id)}
                    >
                      View Producer Notes
                    </button>
                  )}
                  {researchResult.wine_id && (
                    <button
                      className={styles.viewResearchBtn}
                      onClick={() => onNavigate('wine', researchResult.wine_id)}
                    >
                      View Wine Notes
                    </button>
                  )}
                  <button
                    className={styles.researchAgainBtn}
                    onClick={() => setQuery('')}
                  >
                    <span className="mono">Back to search</span>
                  </button>
                </div>
              </div>
            )}

            {researchState === 'error' && (
              <div className={styles.researchError}>
                <p className={`${styles.researchErrorText} mono`}>{researchError}</p>
                <button className={styles.researchYesBtn} onClick={handleResearch}>
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className={styles.results}>
            {typeOrder.map(type => {
              if (!grouped[type]?.length) return null
              return (
                <section key={type} className={styles.group}>
                  <div className={styles.groupHeader}>
                    <span className={`${styles.groupLabel} mono`}>{typeLabel[type]}</span>
                    <span className={`${styles.groupCount} mono`}>{grouped[type].length}</span>
                  </div>
                  {grouped[type].map(result => (
                    <SearchResult
                      key={result.id}
                      result={result}
                      query={query}
                      onClick={() => handleResultClick(result)}
                    />
                  ))}
                </section>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

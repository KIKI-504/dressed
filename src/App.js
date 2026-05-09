import React, { useState, useEffect } from 'react'
import { getCurrentUser } from './lib/user'
import UserPicker from './components/UserPicker'
import SearchPage from './pages/SearchPage'
import ProducerPage from './pages/ProducerPage'
import WinePage from './pages/WinePage'
import MyNotesPage from './pages/MyNotesPage'
import ProducersListPage from './pages/ProducersListPage'
import LabelScanner from './components/LabelScanner'
import NavBar from './components/NavBar'
import TopBar from './components/TopBar'

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const [tab, setTab] = useState('search')
  const [view, setView] = useState({ page: 'search', id: null })
  const [scannerOpen, setScannerOpen] = useState(false)

  useEffect(() => {
    const saved = getCurrentUser()
    if (saved) setCurrentUser(saved)
    setUserLoaded(true)
  }, [])

  if (!userLoaded) return null

  if (!currentUser) {
    return <UserPicker onSelect={name => setCurrentUser(name)} />
  }

  const navigate = (page, id = null) => setView({ page, id })

  const goHome = () => { setTab('search'); setView({ page: 'search', id: null }) }

  const goBack = () => setView({ page: tab, id: null })

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setView({ page: newTab, id: null })
  }

  // Detail pages sit on top of tabs
  if (view.page === 'producer' && view.id) {
    return (
      <>
        <ProducerPage id={view.id} onBack={goBack} onNavigate={navigate} currentUser={currentUser} onGoHome={goHome} />
        {scannerOpen && (
          <LabelScanner
            currentUser={currentUser}
            onClose={() => setScannerOpen(false)}
            onNavigate={(page, id) => { setScannerOpen(false); navigate(page, id) }}
          />
        )}
      </>
    )
  }

  if (view.page === 'wine' && view.id) {
    return (
      <>
        <WinePage id={view.id} onBack={goBack} onNavigate={navigate} currentUser={currentUser} onGoHome={goHome} />
        {scannerOpen && (
          <LabelScanner
            currentUser={currentUser}
            onClose={() => setScannerOpen(false)}
            onNavigate={(page, id) => { setScannerOpen(false); navigate(page, id) }}
          />
        )}
      </>
    )
  }

  return (
    <div style={{ paddingBottom: '4.5rem' }}>
      {tab === 'search' && (
        <SearchPage
          onNavigate={navigate}
          onOpenScanner={() => setScannerOpen(true)}
          currentUser={currentUser}
          onGoHome={goHome}
        />
      )}
      {tab === 'producers' && (
        <ProducersListPage onNavigate={navigate} onGoHome={goHome} />
      )}
      {tab === 'notes' && (
        <MyNotesPage
          currentUser={currentUser}
          onNavigate={navigate}
          onGoHome={goHome}
        />
      )}

      <NavBar
        tab={tab}
        onTabChange={handleTabChange}
        onCamera={() => setScannerOpen(true)}
        currentUser={currentUser}
        onSwitchUser={() => setCurrentUser(null)}
      />

      {scannerOpen && (
        <LabelScanner
          currentUser={currentUser}
          onClose={() => setScannerOpen(false)}
          onNavigate={(page, id) => { setScannerOpen(false); navigate(page, id) }}
        />
      )}
    </div>
  )
}

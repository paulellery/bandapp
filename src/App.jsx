import { useState, useEffect } from 'react'
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Drawer,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  useMediaQuery,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import LogoutIcon from '@mui/icons-material/Logout'
import LoginIcon from '@mui/icons-material/Login'
import SettingsIcon from '@mui/icons-material/Settings'
import CloudDoneIcon from '@mui/icons-material/CloudDone'
import CloudOffIcon from '@mui/icons-material/CloudOff'

import { useGoogleAuth } from './hooks/useGoogleAuth'
import { useDriveStorage } from './hooks/useDriveStorage'
import Sidebar from './components/Sidebar'
import SongList from './components/SongList'
import SetlistView from './components/SetlistView'
import SongViewer from './components/SongViewer'
import SettingsDialog from './components/SettingsDialog'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c4dff' },
    secondary: { main: '#ff4081' },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  shape: { borderRadius: 8 },
})

const SIDEBAR_WIDTH = 220
const FOLDER_KEY = 'setlist-app-folder-id'

export default function App() {
  const { user, accessToken, signIn, signOut, isSignedIn } = useGoogleAuth()
  const {
    songs,
    setlists,
    loaded,
    syncing,
    syncError,
    importFromDrive,
    addManualSong,
    removeSong,
    createSetlist,
    deleteSetlist,
    renameSetlist,
    addSongToSetlist,
    removeSongFromSetlist,
    moveSongInSetlist,
  } = useDriveStorage(accessToken)

  const [folderId, setFolderId] = useState(() => localStorage.getItem(FOLDER_KEY) || '')
  const [selectedSong, setSelectedSong] = useState(null)
  const [currentView, setCurrentView] = useState(null) // null = All Songs, or setlistId
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [snackbar, setSnackbar] = useState(null)

  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Surface Drive sync errors as a snackbar
  useEffect(() => {
    if (syncError) setSnackbar({ severity: 'error', message: syncError })
  }, [syncError])

  const handleFolderSet = (id) => {
    setFolderId(id)
    localStorage.setItem(FOLDER_KEY, id)
  }

  const handleImportFromDrive = async () => {
    if (!folderId || !isSignedIn) return
    setImporting(true)
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
        fields: 'files(id, name)',
        orderBy: 'name',
        pageSize: 200,
      })
      const driveSongs = response.result.files || []
      const added = importFromDrive(driveSongs)
      setSnackbar({
        severity: 'success',
        message:
          added > 0
            ? `Added ${added} new song${added !== 1 ? 's' : ''} from Drive`
            : 'All songs already imported',
      })
    } catch (err) {
      console.error('Drive import failed:', err)
      setSnackbar({ severity: 'error', message: 'Failed to import from Google Drive' })
    } finally {
      setImporting(false)
    }
  }

  const handleAddToSetlist = (song, setlistId) => {
    addSongToSetlist(setlistId, { id: song.id, name: song.name })
    const setlist = setlists.find((s) => s.id === setlistId)
    setSnackbar({
      severity: 'success',
      message: `"${song.name}" added to ${setlist?.name || 'setlist'}`,
    })
  }

  const handleSongSelect = (song) => {
    setSelectedSong(song)
    setSidebarOpen(false)
  }

  const handleBack = () => setSelectedSong(null)

  const currentSetlist = setlists.find((s) => s.id === currentView) || null

  const sidebarContent = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Sidebar
        setlists={setlists}
        currentView={currentView}
        onViewAll={() => {
          setCurrentView(null)
          setSidebarOpen(false)
        }}
        onViewSetlist={(id) => {
          setCurrentView(id)
          setSidebarOpen(false)
        }}
        onCreateSetlist={createSetlist}
        onDeleteSetlist={deleteSetlist}
        onRenameSetlist={renameSetlist}
      />
    </Box>
  )

  // Sync status shown in the app bar
  const SyncIndicator = () => {
    if (!isSignedIn || !loaded) return null
    if (syncing) {
      return (
        <Tooltip title="Saving to Drive…">
          <CircularProgress size={16} color="inherit" sx={{ opacity: 0.7, mr: 1 }} />
        </Tooltip>
      )
    }
    if (syncError) {
      return (
        <Tooltip title={syncError}>
          <CloudOffIcon fontSize="small" sx={{ opacity: 0.7, mr: 1, color: 'error.light' }} />
        </Tooltip>
      )
    }
    return (
      <Tooltip title="Saved to Drive">
        <CloudDoneIcon fontSize="small" sx={{ opacity: 0.35, mr: 1 }} />
      </Tooltip>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

        {/* App Bar — hidden while viewing a song */}
        {!selectedSong && (
          <AppBar position="static" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Toolbar variant="dense">
              {isMobile && (
                <IconButton
                  edge="start"
                  color="inherit"
                  onClick={() => setSidebarOpen(true)}
                  sx={{ mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}

              <QueueMusicIcon sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
                BandApp
              </Typography>

              <SyncIndicator />

              <Tooltip title="Settings">
                <IconButton
                  color="inherit"
                  onClick={() => setSettingsOpen(true)}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {isSignedIn ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {user?.picture && (
                    <Tooltip title={user.name || user.email || 'Signed in'}>
                      <Avatar src={user.picture} alt={user.name} sx={{ width: 28, height: 28 }} />
                    </Tooltip>
                  )}
                  {!isMobile && (
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {user?.name || user?.email}
                    </Typography>
                  )}
                  <Tooltip title="Sign out">
                    <IconButton color="inherit" onClick={signOut} size="small">
                      <LogoutIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                <Button
                  color="inherit"
                  variant="outlined"
                  size="small"
                  startIcon={<LoginIcon />}
                  onClick={signIn}
                  sx={{ borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  Sign in with Google
                </Button>
              )}
            </Toolbar>
          </AppBar>
        )}

        {/* Main layout */}
        {selectedSong ? (
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <SongViewer song={selectedSong} accessToken={accessToken} onBack={handleBack} />
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Left sidebar — desktop */}
            {!isMobile && (
              <Box
                sx={{
                  width: SIDEBAR_WIDTH,
                  flexShrink: 0,
                  borderRight: 1,
                  borderColor: 'divider',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {sidebarContent}
              </Box>
            )}

            {/* Main content */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                bgcolor: 'background.default',
              }}
            >
              {!isSignedIn ? (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                    color: 'text.disabled',
                  }}
                >
                  <Typography variant="body1">Sign in to get started</Typography>
                </Box>
              ) : !loaded ? (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    color: 'text.secondary',
                  }}
                >
                  <CircularProgress size={24} />
                  <Typography variant="body2">Loading from Drive…</Typography>
                </Box>
              ) : currentView === null ? (
                <SongList
                  songs={songs}
                  setlists={setlists}
                  folderId={folderId}
                  onSongSelect={handleSongSelect}
                  selectedSongId={selectedSong?.id}
                  onAddToSetlist={handleAddToSetlist}
                  onRemoveSong={removeSong}
                  onImportFromDrive={handleImportFromDrive}
                  onAddManualSong={addManualSong}
                  onOpenSettings={() => setSettingsOpen(true)}
                  importing={importing}
                />
              ) : (
                <SetlistView
                  setlist={currentSetlist}
                  allSongs={songs}
                  selectedSongId={selectedSong?.id}
                  onSongSelect={handleSongSelect}
                  onRemoveSong={removeSongFromSetlist}
                  onMoveSong={moveSongInSetlist}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Mobile sidebar drawer */}
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          PaperProps={{ sx: { width: SIDEBAR_WIDTH } }}
        >
          {sidebarContent}
        </Drawer>

        {/* Settings dialog */}
        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          folderId={folderId}
          onFolderSet={handleFolderSet}
          accessToken={accessToken}
        />

        {/* Snackbar feedback */}
        <Snackbar
          open={!!snackbar}
          autoHideDuration={4000}
          onClose={() => setSnackbar(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {snackbar && (
            <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)} variant="filled">
              {snackbar.message}
            </Alert>
          )}
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}

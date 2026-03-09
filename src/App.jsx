import { useState } from 'react'
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
  useMediaQuery,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import LogoutIcon from '@mui/icons-material/Logout'
import LoginIcon from '@mui/icons-material/Login'
import SettingsIcon from '@mui/icons-material/Settings'

import { useGoogleAuth } from './hooks/useGoogleAuth'
import { useSetlists } from './hooks/useSetlists'
import SongList from './components/SongList'
import SongViewer from './components/SongViewer'
import SetlistManager from './components/SetlistManager'
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

const SETLIST_WIDTH = 280
const FOLDER_KEY = 'setlist-app-folder-id'

export default function App() {
  const { user, accessToken, signIn, signOut, isSignedIn } = useGoogleAuth()
  const {
    setlists,
    createSetlist,
    deleteSetlist,
    renameSetlist,
    addSongToSetlist,
    removeSongFromSetlist,
    moveSongInSetlist,
  } = useSetlists()

  const [folderId, setFolderId] = useState(() => localStorage.getItem(FOLDER_KEY) || '')
  const [selectedSong, setSelectedSong] = useState(null)
  const [activeSetlistId, setActiveSetlistId] = useState(null)
  const [setlistDrawerOpen, setSetlistDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [snackbar, setSnackbar] = useState(null)

  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleFolderSet = (id) => {
    setFolderId(id)
    localStorage.setItem(FOLDER_KEY, id)
    setSelectedSong(null)
  }

  const handleAddToSetlist = (song) => {
    if (!activeSetlistId) {
      setSnackbar({ severity: 'warning', message: 'Select or create a setlist first' })
      return
    }
    addSongToSetlist(activeSetlistId, { id: song.id, name: song.name })
    const setlist = setlists.find((s) => s.id === activeSetlistId)
    setSnackbar({
      severity: 'success',
      message: `"${song.name}" added to ${setlist?.name || 'setlist'}`,
    })
  }

  const handleSongSelect = (song) => {
    setSelectedSong(song)
    setSetlistDrawerOpen(false)
  }

  const handleBack = () => {
    setSelectedSong(null)
  }

  const setlistPanel = (
    <Box
      sx={{
        width: SETLIST_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <SetlistManager
        setlists={setlists}
        activeSetlistId={activeSetlistId}
        onSetActiveSetlist={setActiveSetlistId}
        onCreateSetlist={createSetlist}
        onDeleteSetlist={deleteSetlist}
        onRenameSetlist={renameSetlist}
        onRemoveSong={removeSongFromSetlist}
        onMoveSong={moveSongInSetlist}
        onSongSelect={handleSongSelect}
      />
    </Box>
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* App Bar */}
        <AppBar position="static" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar variant="dense">
            {/* Setlist drawer toggle — only on mobile when not viewing a song */}
            {isMobile && !selectedSong && (
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setSetlistDrawerOpen(true)}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <QueueMusicIcon sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
              Setlist App
            </Typography>

            <Tooltip title="Settings">
              <IconButton color="inherit" onClick={() => setSettingsOpen(true)} size="small" sx={{ mr: 1 }}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {isSignedIn ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {user?.picture && (
                  <Tooltip title={user.name || user.email || 'Signed in'}>
                    <Avatar
                      src={user.picture}
                      alt={user.name}
                      sx={{ width: 28, height: 28 }}
                    />
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

        {/* Main layout */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {selectedSong ? (
            /* Full-page song viewer */
            <SongViewer
              song={selectedSong}
              accessToken={accessToken}
              activeSetlistId={activeSetlistId}
              onAddToSetlist={handleAddToSetlist}
              onBack={handleBack}
            />
          ) : (
            /* Song list + setlist sidebar */
            <>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.default' }}>
                {isSignedIn ? (
                  <SongList
                    folderId={folderId}
                    onSongSelect={handleSongSelect}
                    selectedSongId={selectedSong?.id}
                    activeSetlistId={activeSetlistId}
                    onAddToSetlist={handleAddToSetlist}
                    onOpenSettings={() => setSettingsOpen(true)}
                  />
                ) : (
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, color: 'text.disabled' }}>
                    <Typography variant="body1">Sign in to load songs</Typography>
                  </Box>
                )}
              </Box>

              {/* Setlist sidebar — desktop only */}
              {!isMobile && setlistPanel}
            </>
          )}
        </Box>

        {/* Mobile setlist drawer */}
        <Drawer
          anchor="right"
          open={setlistDrawerOpen}
          onClose={() => setSetlistDrawerOpen(false)}
          PaperProps={{ sx: { width: SETLIST_WIDTH } }}
        >
          {setlistPanel}
        </Drawer>

        {/* Settings dialog */}
        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          folderId={folderId}
          onFolderSet={handleFolderSet}
        />

        {/* Snackbar feedback */}
        <Snackbar
          open={!!snackbar}
          autoHideDuration={3000}
          onClose={() => setSnackbar(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {snackbar && (
            <Alert
              severity={snackbar.severity}
              onClose={() => setSnackbar(null)}
              variant="filled"
            >
              {snackbar.message}
            </Alert>
          )}
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}

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
  Divider,
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

import { useGoogleAuth } from './hooks/useGoogleAuth'
import { useSetlists } from './hooks/useSetlists'
import FolderPicker from './components/FolderPicker'
import SongList from './components/SongList'
import SongViewer from './components/SongViewer'
import SetlistManager from './components/SetlistManager'

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

const SONG_LIST_WIDTH = 260
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
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

  const songListPanel = (
    <Box
      sx={{
        width: SONG_LIST_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <FolderPicker folderId={folderId} onFolderSet={handleFolderSet} currentFolderId={folderId} />
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isSignedIn ? (
          <SongList
            folderId={folderId}
            onSongSelect={(song) => {
              setSelectedSong(song)
              if (isMobile) setMobileDrawerOpen(false)
            }}
            selectedSongId={selectedSong?.id}
            activeSetlistId={activeSetlistId}
            onAddToSetlist={handleAddToSetlist}
          />
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Sign in to load songs
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )

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
        onSongSelect={setSelectedSong}
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
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setMobileDrawerOpen(true)}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <QueueMusicIcon sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
              Setlist App
            </Typography>

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
          {/* Song list sidebar — hidden on mobile, use Drawer instead */}
          {!isMobile && songListPanel}

          {/* Central song viewer */}
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', bgcolor: 'background.default' }}>
            <SongViewer
              song={selectedSong}
              accessToken={accessToken}
              activeSetlistId={activeSetlistId}
              onAddToSetlist={handleAddToSetlist}
            />
          </Box>

          {/* Setlist panel — hidden on mobile */}
          {!isMobile && setlistPanel}
        </Box>

        {/* Mobile drawer */}
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          PaperProps={{ sx: { width: SONG_LIST_WIDTH + SETLIST_WIDTH, display: 'flex', flexDirection: 'row' } }}
        >
          {songListPanel}
          {setlistPanel}
        </Drawer>

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

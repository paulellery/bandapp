import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import MusicNoteIcon from '@mui/icons-material/MusicNote'

export default function SongViewer({ song, accessToken, activeSetlistId, onAddToSetlist }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!song || !accessToken) return

    const fetchContent = async () => {
      setLoading(true)
      setError(null)
      setContent(null)
      try {
        // Export Google Doc as plain text
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${song.id}/export?mimeType=text/plain`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error?.message || `HTTP ${response.status}`)
        }
        const text = await response.text()
        setContent(text)
      } catch (err) {
        console.error('Failed to load song:', err)
        setError(err.message || 'Failed to load song content')
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [song?.id, accessToken])

  if (!song) {
    return (
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
        <MusicNoteIcon sx={{ fontSize: 64 }} />
        <Typography variant="body1">Select a song to view its content</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Song header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MusicNoteIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            {song.name}
          </Typography>
        </Box>
        {activeSetlistId && (
          <Tooltip title="Add to current setlist">
            <IconButton color="primary" onClick={() => onAddToSetlist(song)}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Song content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {content !== null && !loading && (
          <Typography
            component="pre"
            variant="body1"
            sx={{
              fontFamily: 'inherit',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.8,
              fontSize: '0.95rem',
            }}
          >
            {content}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

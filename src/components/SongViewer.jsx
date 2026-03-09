import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Button,
  Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'

const MIN_SPEED = 5
const MAX_SPEED = 200
const SPEED_STEP = 10
const DEFAULT_SPEED = 30

export default function SongViewer({ song, accessToken, activeSetlistId, onAddToSetlist, onBack }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [autoscroll, setAutoscroll] = useState(false)
  const [speed, setSpeed] = useState(DEFAULT_SPEED)

  const contentRef = useRef(null)
  const animRef = useRef(null)
  const speedRef = useRef(speed)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  // Autoscroll animation loop
  useEffect(() => {
    if (!autoscroll) {
      cancelAnimationFrame(animRef.current)
      return
    }
    let last = null
    const step = (ts) => {
      if (last !== null && contentRef.current) {
        contentRef.current.scrollTop += (speedRef.current * (ts - last)) / 1000
      }
      last = ts
      animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animRef.current)
  }, [autoscroll])

  // Fetch song content and reset autoscroll on song change
  useEffect(() => {
    setAutoscroll(false)
    if (!song || !accessToken) return

    const fetchContent = async () => {
      setLoading(true)
      setError(null)
      setContent(null)
      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${song.id}/export?mimeType=text/plain`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error?.message || `HTTP ${response.status}`)
        }
        setContent(await response.text())
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
      {/* Static header — title stays pinned */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        {onBack && (
          <Tooltip title="Back to songs">
            <IconButton onClick={onBack} size="small" sx={{ mr: 0.5 }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        )}
        <MusicNoteIcon color="primary" />
        <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }} noWrap>
          {song.name}
        </Typography>
        {activeSetlistId && (
          <Tooltip title="Add to current setlist">
            <IconButton color="primary" onClick={() => onAddToSetlist(song)}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Scrollable content */}
      <Box ref={contentRef} sx={{ flex: 1, overflow: 'auto', p: 3 }}>
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

      {/* Autoscroll controls — shown once content is loaded */}
      {content && !loading && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            px: 3,
            py: 1.5,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setSpeed((s) => Math.max(MIN_SPEED, s - SPEED_STEP))}
            disabled={speed <= MIN_SPEED}
            sx={{ minWidth: 90, py: 1.25, fontSize: '0.9rem' }}
          >
            Slower
          </Button>

          <IconButton
            onClick={() => setAutoscroll((v) => !v)}
            color={autoscroll ? 'secondary' : 'primary'}
            sx={{
              border: 2,
              borderColor: autoscroll ? 'secondary.main' : 'primary.main',
              p: 1.5,
              '&:hover': { opacity: 0.85 },
            }}
          >
            {autoscroll ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
          </IconButton>

          <Button
            variant="outlined"
            onClick={() => setSpeed((s) => Math.min(MAX_SPEED, s + SPEED_STEP))}
            disabled={speed >= MAX_SPEED}
            sx={{ minWidth: 90, py: 1.25, fontSize: '0.9rem' }}
          >
            Faster
          </Button>

          <Chip
            label={`${speed} px/s`}
            size="small"
            sx={{ ml: 1, fontVariantNumeric: 'tabular-nums', minWidth: 70 }}
          />
        </Box>
      )}
    </Box>
  )
}

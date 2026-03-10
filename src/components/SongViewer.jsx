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
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import ArticleOffIcon from '@mui/icons-material/ArticleOutlined'

const MIN_SPEED = 5
const MAX_SPEED = 200
const SPEED_STEP = 10
const DEFAULT_SPEED = 30

export default function SongViewer({ song, accessToken, onBack }) {
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

  // Fetch song content on song change
  useEffect(() => {
    setAutoscroll(false)
    setContent(null)
    setError(null)

    // Manual songs have no driveId — nothing to fetch
    if (!song?.driveId && !song?.id) return
    // Skip fetch for manual songs (no drive file)
    const fileId = song.driveId || song.id
    if (!fileId || fileId.startsWith('manual-')) return
    if (!accessToken) return

    const fetchContent = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
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
  }, [song?.id, song?.driveId, accessToken])

  if (!song) return null

  const hasLyricSheet = song.driveId || (song.id && !song.id.startsWith('manual-'))

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100vh' }}>
      {/* Title bar — includes back button + autoscroll controls */}
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
          minHeight: 48,
        }}
      >
        {onBack && (
          <Tooltip title="Back">
            <IconButton onClick={onBack} size="small">
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        )}

        <MusicNoteIcon color="primary" sx={{ flexShrink: 0 }} />

        <Typography
          variant="h6"
          fontWeight={600}
          sx={{ flex: 1, minWidth: 0 }}
          noWrap
        >
          {song.name}
        </Typography>

        {/* Autoscroll controls — shown once content loads */}
        {content && !loading && (
          <>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSpeed((s) => Math.max(MIN_SPEED, s - SPEED_STEP))}
              disabled={speed <= MIN_SPEED}
              sx={{ minWidth: 72 }}
            >
              Slower
            </Button>

            <IconButton
              onClick={() => setAutoscroll((v) => !v)}
              color={autoscroll ? 'secondary' : 'primary'}
              sx={{
                border: 2,
                borderColor: autoscroll ? 'secondary.main' : 'primary.main',
                p: 0.75,
              }}
            >
              {autoscroll ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>

            <Button
              size="small"
              variant="outlined"
              onClick={() => setSpeed((s) => Math.min(MAX_SPEED, s + SPEED_STEP))}
              disabled={speed >= MAX_SPEED}
              sx={{ minWidth: 72 }}
            >
              Faster
            </Button>

            <Chip
              label={`${speed} px/s`}
              size="small"
              sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 64 }}
            />
          </>
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
        {!hasLyricSheet && !loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pt: 6,
              gap: 1,
              color: 'text.disabled',
            }}
          >
            <ArticleOffIcon sx={{ fontSize: 48, opacity: 0.4 }} />
            <Typography variant="body2" color="text.secondary">
              No lyric sheet available for this song.
            </Typography>
          </Box>
        )}
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

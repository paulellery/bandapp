import { useState, useEffect } from 'react'
import {
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Chip,
  Divider,
  Button,
} from '@mui/material'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import AddIcon from '@mui/icons-material/Add'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

export default function SongList({
  folderId,
  onSongSelect,
  selectedSongId,
  activeSetlistId,
  onAddToSetlist,
  onOpenSettings,
}) {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!folderId) return

    const fetchSongs = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await window.gapi.client.drive.files.list({
          q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
          fields: 'files(id, name, modifiedTime)',
          orderBy: 'name',
          pageSize: 200,
        })
        setSongs(response.result.files || [])
      } catch (err) {
        console.error('Failed to fetch songs:', err)
        setError(err.result?.error?.message || 'Failed to load songs. Check the folder ID and permissions.')
      } finally {
        setLoading(false)
      }
    }

    fetchSongs()
  }, [folderId])

  if (!folderId) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 4, color: 'text.disabled' }}>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          No folder configured yet.
        </Typography>
        {onOpenSettings && (
          <Button variant="outlined" size="small" onClick={onOpenSettings}>
            Open Settings
          </Button>
        )}
      </Box>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ fontSize: '0.75rem' }}>
          {error}
        </Alert>
      </Box>
    )
  }

  if (songs.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No Google Docs found in this folder
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          {songs.length} song{songs.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
      <Divider />
      <List dense disablePadding>
        {songs.map((song) => (
          <ListItemButton
            key={song.id}
            selected={song.id === selectedSongId}
            onClick={() => onSongSelect(song)}
            sx={{
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
                '& .MuiListItemIcon-root': { color: 'inherit' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <MusicNoteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={song.name}
              primaryTypographyProps={{ variant: 'body2', noWrap: true }}
            />
            {activeSetlistId && (
              <Tooltip title="Add to setlist">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddToSetlist(song)
                  }}
                  sx={{ ml: 0.5, opacity: 0.7, '&:hover': { opacity: 1 } }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}

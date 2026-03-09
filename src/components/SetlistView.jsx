import { useState } from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArticleIcon from '@mui/icons-material/Article'

export default function SetlistView({
  setlist,
  allSongs,       // full song objects to look up hasLyrics etc.
  selectedSongId,
  onSongSelect,
  onRemoveSong,   // (setlistId, songId) => void
  onMoveSong,     // (setlistId, fromIdx, toIdx) => void
}) {
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuIdx, setMenuIdx] = useState(null)

  if (!setlist) return null

  const songs = setlist.songs
  const songMap = Object.fromEntries((allSongs || []).map((s) => [s.id, s]))

  const openMenu = (e, idx) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
    setMenuIdx(idx)
  }

  const closeMenu = () => {
    setMenuAnchor(null)
    setMenuIdx(null)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {setlist.name}
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            ({songs.length} song{songs.length !== 1 ? 's' : ''})
          </Typography>
        </Typography>
      </Box>

      {/* Song list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {songs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>
            <Typography variant="body2">No songs in this setlist.</Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Use the "…" menu on a song to add it here.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {songs.map((song, idx) => {
              const fullSong = songMap[song.id] || song
              return (
                <ListItem
                  key={song.id}
                  disablePadding
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        disabled={idx === 0}
                        onClick={() => onMoveSong(setlist.id, idx, idx - 1)}
                      >
                        <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={idx === songs.length - 1}
                        onClick={() => onMoveSong(setlist.id, idx, idx + 1)}
                      >
                        <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <IconButton size="small" edge="end" onClick={(e) => openMenu(e, idx)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemButton
                    selected={song.id === selectedSongId}
                    onClick={() => onSongSelect(fullSong)}
                    sx={{
                      pr: 13,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '& .MuiListItemIcon-root': { color: 'inherit' },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ width: 18, textAlign: 'right' }}
                      >
                        {idx + 1}
                      </Typography>
                    </ListItemIcon>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <MusicNoteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={song.name}
                      primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                    />
                    {fullSong.hasLyrics && (
                      <Tooltip title="Lyric sheet available">
                        <ArticleIcon
                          fontSize="small"
                          color="primary"
                          sx={{ opacity: 0.7, ml: 1, flexShrink: 0 }}
                        />
                      </Tooltip>
                    )}
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        )}
      </Box>

      {/* Song context menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            const song = songs[menuIdx]
            if (song) onRemoveSong(setlist.id, song.id)
            closeMenu()
          }}
          sx={{ color: 'error.main' }}
        >
          Remove from setlist
        </MenuItem>
      </Menu>
    </Box>
  )
}

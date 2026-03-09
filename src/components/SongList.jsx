import { useState } from 'react'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  CircularProgress,
  Box,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
} from '@mui/material'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import ArticleIcon from '@mui/icons-material/Article'

export default function SongList({
  songs,
  setlists,
  folderId,
  onSongSelect,
  selectedSongId,
  onAddToSetlist,   // (song, setlistId) => void
  onRemoveSong,     // (songId) => void
  onImportFromDrive,
  onAddManualSong,  // (name) => void
  onOpenSettings,
  importing,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuSong, setMenuSong] = useState(null)
  const [setlistMenuAnchor, setSetlistMenuAnchor] = useState(null)
  const [addManualOpen, setAddManualOpen] = useState(false)
  const [newSongName, setNewSongName] = useState('')

  const openMenu = (e, song) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
    setMenuSong(song)
  }

  const closeMenu = () => {
    setMenuAnchor(null)
    setMenuSong(null)
    setSetlistMenuAnchor(null)
  }

  const handleAddManual = () => {
    if (!newSongName.trim()) return
    onAddManualSong(newSongName.trim())
    setNewSongName('')
    setAddManualOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
          All Songs
          {songs.length > 0 && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({songs.length})
            </Typography>
          )}
        </Typography>

        {folderId ? (
          <Tooltip title="Import from Google Drive folder">
            <span>
              <IconButton size="small" onClick={onImportFromDrive} disabled={importing}>
                {importing ? (
                  <CircularProgress size={16} />
                ) : (
                  <CloudDownloadIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        ) : (
          onOpenSettings && (
            <Button size="small" variant="outlined" onClick={onOpenSettings}>
              Configure Folder
            </Button>
          )
        )}

        <Tooltip title="Add song manually">
          <IconButton
            size="small"
            onClick={() => {
              setNewSongName('')
              setAddManualOpen(true)
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Song list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {songs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>
            <MusicNoteIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
            <Typography variant="body2" color="text.secondary">
              No songs yet
            </Typography>
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
              {folderId
                ? 'Import from Google Drive or add songs manually'
                : 'Configure a Google Drive folder or add songs manually'}
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {songs.map((song) => (
              <ListItem
                key={song.id}
                disablePadding
                secondaryAction={
                  <IconButton size="small" edge="end" onClick={(e) => openMenu(e, song)}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemButton
                  selected={song.id === selectedSongId}
                  onClick={() => onSongSelect(song)}
                  sx={{
                    pr: 5,
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
                  {song.hasLyrics && (
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
            ))}
          </List>
        )}
      </Box>

      {/* Song "..." context menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem
          onClick={(e) => {
            setSetlistMenuAnchor(e.currentTarget)
          }}
        >
          Add to setlist…
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            onRemoveSong(menuSong?.id)
            closeMenu()
          }}
          sx={{ color: 'error.main' }}
        >
          Remove
        </MenuItem>
      </Menu>

      {/* Setlist picker submenu */}
      <Menu
        anchorEl={setlistMenuAnchor}
        open={Boolean(setlistMenuAnchor)}
        onClose={() => setSetlistMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {setlists.length === 0 ? (
          <MenuItem disabled>No setlists — create one first</MenuItem>
        ) : (
          setlists.map((sl) => (
            <MenuItem
              key={sl.id}
              onClick={() => {
                onAddToSetlist(menuSong, sl.id)
                closeMenu()
              }}
            >
              {sl.name}
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Add manual song dialog */}
      <Dialog
        open={addManualOpen}
        onClose={() => setAddManualOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Song</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Song name"
            value={newSongName}
            onChange={(e) => setNewSongName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddManualOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddManual}
            disabled={!newSongName.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

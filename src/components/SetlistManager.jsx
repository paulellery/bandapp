import { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Collapse,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import EditIcon from '@mui/icons-material/Edit'
import MusicNoteIcon from '@mui/icons-material/MusicNote'

export default function SetlistManager({
  setlists,
  activeSetlistId,
  onSetActiveSetlist,
  onCreateSetlist,
  onDeleteSetlist,
  onRenameSetlist,
  onRemoveSong,
  onMoveSong,
  onSongSelect,
}) {
  const [expanded, setExpanded] = useState(activeSetlistId)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [newName, setNewName] = useState('')

  const handleCreate = () => {
    if (!newName.trim()) return
    const id = onCreateSetlist(newName.trim())
    onSetActiveSetlist(id)
    setExpanded(id)
    setNewName('')
    setCreateDialogOpen(false)
  }

  const handleRename = () => {
    if (!newName.trim() || !renamingId) return
    onRenameSetlist(renamingId, newName.trim())
    setNewName('')
    setRenamingId(null)
    setRenameDialogOpen(false)
  }

  const openRename = (e, setlist) => {
    e.stopPropagation()
    setRenamingId(setlist.id)
    setNewName(setlist.name)
    setRenameDialogOpen(true)
  }

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          Setlists
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            setNewName('')
            setCreateDialogOpen(true)
          }}
        >
          New
        </Button>
      </Box>

      {/* Setlist items */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {setlists.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <PlaylistPlayIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No setlists yet
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Create one to get started
            </Typography>
          </Box>
        )}

        <List dense disablePadding>
          {setlists.map((setlist) => {
            const isActive = setlist.id === activeSetlistId
            const isExpanded = expanded === setlist.id

            return (
              <Box key={setlist.id}>
                {/* Setlist header row */}
                <ListItemButton
                  onClick={() => {
                    toggleExpand(setlist.id)
                    onSetActiveSetlist(isActive ? null : setlist.id)
                  }}
                  sx={{
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'primary.contrastText' : 'inherit',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                    <PlaylistPlayIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={setlist.name}
                    secondary={
                      !isActive ? (
                        <Typography variant="caption" color="text.disabled">
                          {setlist.songs.length} song{setlist.songs.length !== 1 ? 's' : ''}
                        </Typography>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'primary.contrastText', opacity: 0.8 }}>
                          {setlist.songs.length} song{setlist.songs.length !== 1 ? 's' : ''} · active
                        </Typography>
                      )
                    }
                    primaryTypographyProps={{ variant: 'body2', fontWeight: isActive ? 600 : 400 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title="Rename">
                      <IconButton
                        size="small"
                        onClick={(e) => openRename(e, setlist)}
                        sx={{ color: 'inherit', opacity: 0.7 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete setlist">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSetlist(setlist.id)
                          if (isActive) onSetActiveSetlist(null)
                        }}
                        sx={{ color: 'inherit', opacity: 0.7 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {isExpanded ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )}
                  </Box>
                </ListItemButton>

                {/* Songs in setlist */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List dense disablePadding sx={{ bgcolor: 'action.hover' }}>
                    {setlist.songs.length === 0 && (
                      <ListItem sx={{ pl: 4 }}>
                        <ListItemText
                          primary={
                            <Typography variant="caption" color="text.disabled">
                              No songs — click + on a song to add
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                    {setlist.songs.map((song, idx) => (
                      <ListItem key={song.id} disablePadding>
                        <ListItemButton
                          dense
                          sx={{ pl: 3 }}
                          onClick={() => onSongSelect(song)}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <Typography variant="caption" color="text.disabled" sx={{ width: 16, textAlign: 'right' }}>
                              {idx + 1}
                            </Typography>
                          </ListItemIcon>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <MusicNoteIcon fontSize="small" color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary={song.name}
                            primaryTypographyProps={{ variant: 'caption', noWrap: true }}
                          />
                        </ListItemButton>
                        <Box sx={{ display: 'flex', pr: 0.5 }}>
                          <IconButton
                            size="small"
                            disabled={idx === 0}
                            onClick={() => onMoveSong(setlist.id, idx, idx - 1)}
                          >
                            <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            disabled={idx === setlist.songs.length - 1}
                            onClick={() => onMoveSong(setlist.id, idx, idx + 1)}
                          >
                            <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => onRemoveSong(setlist.id, song.id)}
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
                <Divider />
              </Box>
            )
          })}
        </List>
      </Box>

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>New Setlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Setlist name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Rename Setlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Setlist name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRename} disabled={!newName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

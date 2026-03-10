import { useState } from 'react'
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
} from '@mui/material'
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'

export default function Sidebar({
  setlists,
  currentView, // null = All Songs, or a setlistId
  onViewAll,
  onViewSetlist,
  onCreateSetlist,
  onDeleteSetlist,
  onRenameSetlist,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuSetlistId, setMenuSetlistId] = useState(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const openMenu = (e, setlistId) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
    setMenuSetlistId(setlistId)
  }

  const closeMenu = () => {
    setMenuAnchor(null)
    setMenuSetlistId(null)
  }

  const handleCreate = () => {
    if (!newName.trim()) return
    const id = onCreateSetlist(newName.trim())
    onViewSetlist(id)
    setNewName('')
    setCreateDialogOpen(false)
  }

  const handleRename = () => {
    if (!newName.trim() || !menuSetlistId) return
    onRenameSetlist(menuSetlistId, newName.trim())
    setNewName('')
    setRenameDialogOpen(false)
    closeMenu()
  }

  const menuSetlist = setlists.find((s) => s.id === menuSetlistId)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* All Songs */}
      <List disablePadding>
        <ListItemButton
          onClick={onViewAll}
          selected={currentView === null}
          sx={{
            py: 1.5,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' },
              '& .MuiListItemIcon-root': { color: 'inherit' },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
            <LibraryMusicIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="All Songs"
            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
          />
        </ListItemButton>
      </List>

      <Divider />

      {/* Setlists header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Setlists
        </Typography>
        <Tooltip title="New setlist">
          <IconButton
            size="small"
            onClick={() => {
              setNewName('')
              setCreateDialogOpen(true)
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Setlist list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {setlists.length === 0 && (
          <Box sx={{ px: 2, pb: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.disabled">
              No setlists yet
            </Typography>
          </Box>
        )}

        <List dense disablePadding>
          {setlists.map((setlist) => {
            const isActive = currentView === setlist.id
            return (
              <ListItemButton
                key={setlist.id}
                selected={isActive}
                onClick={() => onViewSetlist(setlist.id)}
                sx={{
                  pr: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'inherit' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <PlaylistPlayIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={setlist.name}
                  secondary={`${setlist.songs.length} song${setlist.songs.length !== 1 ? 's' : ''}`}
                  primaryTypographyProps={{
                    variant: 'body2',
                    noWrap: true,
                    fontWeight: isActive ? 600 : 400,
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    sx: {
                      color: isActive ? 'primary.contrastText' : undefined,
                      opacity: 0.7,
                    },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => openMenu(e, setlist.id)}
                  sx={{ color: 'inherit', opacity: 0.6, '&:hover': { opacity: 1 } }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            )
          })}
        </List>
      </Box>

      {/* Setlist context menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            setNewName(menuSetlist?.name || '')
            setRenameDialogOpen(true)
            setMenuAnchor(null)
          }}
        >
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDeleteSetlist(menuSetlistId)
            if (currentView === menuSetlistId) onViewAll()
            closeMenu()
          }}
          sx={{ color: 'error.main' }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* Create dialog */}
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

      {/* Rename dialog */}
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

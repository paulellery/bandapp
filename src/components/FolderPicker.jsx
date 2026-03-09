import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
} from '@mui/material'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'

export default function FolderPicker({ onFolderSet, currentFolderId }) {
  const [input, setInput] = useState(currentFolderId || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    // Accept either a folder ID or a full Drive URL
    let folderId = trimmed
    const urlMatch = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/)
    if (urlMatch) {
      folderId = urlMatch[1]
    }
    onFolderSet(folderId)
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Enter your Google Drive folder ID or URL containing your songs
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Folder ID or Drive URL"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FolderOpenIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button type="submit" variant="contained" size="small" sx={{ whiteSpace: 'nowrap' }}>
          Load Songs
        </Button>
      </Box>
      {currentFolderId && (
        <Alert severity="success" sx={{ mt: 1 }} icon={false}>
          <Typography variant="caption">Folder: {currentFolderId}</Typography>
        </Alert>
      )}
    </Box>
  )
}

import { useState, useCallback } from 'react'
import {
  Box,
  TextField,
  Button,
  Alert,
  InputAdornment,
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'

function loadPickerApi() {
  return new Promise((resolve) => {
    if (window.google?.picker) {
      resolve()
    } else {
      window.gapi.load('picker', resolve)
    }
  })
}

export default function FolderPicker({ onFolderSet, currentFolderId, accessToken }) {
  const [input, setInput] = useState(currentFolderId || '')
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerError, setPickerError] = useState(null)

  const openPicker = useCallback(async () => {
    if (!accessToken) return
    setPickerLoading(true)
    setPickerError(null)
    try {
      await loadPickerApi()

      const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)
        .setMimeTypes('application/vnd.google-apps.folder')

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setTitle('Select a folder containing your songs')
        .setCallback((data) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const folder = data.docs[0]
            setInput(folder.id)
            onFolderSet(folder.id)
          }
        })
        .build()

      picker.setVisible(true)
    } catch (err) {
      console.error('Picker failed:', err)
      setPickerError('Could not open folder browser. Paste a folder ID or URL below instead.')
    } finally {
      setPickerLoading(false)
    }
  }, [accessToken, onFolderSet])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    let folderId = trimmed
    const urlMatch = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/)
    if (urlMatch) folderId = urlMatch[1]
    onFolderSet(folderId)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Primary action — Drive picker */}
      <Button
        variant="contained"
        size="large"
        startIcon={
          pickerLoading ? <CircularProgress size={18} color="inherit" /> : <FolderOpenIcon />
        }
        onClick={openPicker}
        disabled={!accessToken || pickerLoading}
        fullWidth
      >
        {pickerLoading ? 'Opening…' : 'Browse Google Drive'}
      </Button>

      {!accessToken && (
        <Alert severity="info" icon={false}>
          <Typography variant="caption">Sign in first to browse your Drive folders.</Typography>
        </Alert>
      )}

      {pickerError && <Alert severity="warning">{pickerError}</Alert>}

      {currentFolderId && (
        <Alert severity="success" icon={false}>
          <Typography variant="caption">Folder: {currentFolderId}</Typography>
        </Alert>
      )}

      {/* Fallback — paste ID or URL */}
      <Divider>
        <Typography variant="caption" color="text.disabled">
          or paste a folder ID / URL
        </Typography>
      </Divider>

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
        <Button type="submit" variant="outlined" size="small" sx={{ whiteSpace: 'nowrap' }}>
          Use this
        </Button>
      </Box>
    </Box>
  )
}

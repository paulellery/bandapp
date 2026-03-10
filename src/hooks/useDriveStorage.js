import { useState, useEffect, useRef, useCallback } from 'react'

const FILE_NAME = 'bandapp.json'
const FILE_ID_KEY = 'bandapp-drive-file-id'
const DEBOUNCE_MS = 1500

// --- Drive API helpers ---

async function apiFetch(method, url, accessToken, { body, contentType } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(contentType && { 'Content-Type': contentType }),
    },
    ...(body !== undefined && { body }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `HTTP ${res.status}`)
  }
  return res
}

async function findFile(accessToken) {
  // Try cached ID first (fast path)
  const cached = localStorage.getItem(FILE_ID_KEY)
  if (cached) {
    try {
      await apiFetch(
        'GET',
        `https://www.googleapis.com/drive/v3/files/${cached}?fields=id`,
        accessToken
      )
      return cached
    } catch {
      localStorage.removeItem(FILE_ID_KEY)
    }
  }
  // Search by name
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`)
  const res = await apiFetch(
    'GET',
    `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id)`,
    accessToken
  )
  const data = await res.json()
  const id = data.files?.[0]?.id || null
  if (id) localStorage.setItem(FILE_ID_KEY, id)
  return id
}

async function readFile(fileId, accessToken) {
  const res = await apiFetch(
    'GET',
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    accessToken
  )
  return res.json()
}

async function createFile(accessToken, content) {
  const boundary = `bandapp${Date.now()}`
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify({ name: FILE_NAME, mimeType: 'application/json' }),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    JSON.stringify(content),
    `--${boundary}--`,
  ].join('\r\n')
  const res = await apiFetch(
    'POST',
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    accessToken,
    { body, contentType: `multipart/related; boundary=${boundary}` }
  )
  const data = await res.json()
  localStorage.setItem(FILE_ID_KEY, data.id)
  return data.id
}

async function updateFile(fileId, accessToken, content) {
  await apiFetch(
    'PATCH',
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    accessToken,
    { body: JSON.stringify(content), contentType: 'application/json' }
  )
}

// Migrate any existing localStorage data on first Drive run
function loadFromLocalStorage() {
  try {
    const songs = JSON.parse(localStorage.getItem('bandapp-songs') || '[]')
    const setlists = JSON.parse(localStorage.getItem('setlist-app-setlists') || '[]')
    return { songs, setlists }
  } catch {
    return { songs: [], setlists: [] }
  }
}

// --- Hook ---

export function useDriveStorage(accessToken) {
  const [songs, setSongs] = useState([])
  const [setlists, setSetlists] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState(null)

  const fileIdRef = useRef(null)
  const dataRef = useRef({ songs: [], setlists: [] })
  const saveTimerRef = useRef(null)
  const loadedRef = useRef(false)

  // Keep dataRef current so the debounced save always reads latest state
  useEffect(() => {
    dataRef.current = { songs, setlists }
  }, [songs, setlists])

  const saveToDrive = useCallback(async () => {
    if (!accessToken || !fileIdRef.current) return
    setSyncing(true)
    setSyncError(null)
    try {
      await updateFile(fileIdRef.current, accessToken, dataRef.current)
    } catch (err) {
      console.error('Drive save failed:', err)
      setSyncError('Failed to save — check your connection')
    } finally {
      setSyncing(false)
    }
  }, [accessToken])

  const scheduleSave = useCallback(() => {
    if (!loadedRef.current) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(saveToDrive, DEBOUNCE_MS)
  }, [saveToDrive])

  // Load (or create) bandapp.json when we get an access token
  useEffect(() => {
    if (!accessToken) return
    let cancelled = false

    const load = async () => {
      try {
        let fileId = await findFile(accessToken)
        if (cancelled) return

        let data
        if (fileId) {
          data = await readFile(fileId, accessToken)
        } else {
          // First run: migrate localStorage then create Drive file
          data = loadFromLocalStorage()
          fileId = await createFile(accessToken, data)
        }

        if (cancelled) return
        fileIdRef.current = fileId
        setSongs(data.songs || [])
        setSetlists(data.setlists || [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load from Drive, falling back to localStorage:', err)
        // Degrade gracefully — still functional offline
        const data = loadFromLocalStorage()
        setSongs(data.songs)
        setSetlists(data.setlists)
        setSyncError('Could not load from Drive — showing local data')
      } finally {
        if (!cancelled) {
          loadedRef.current = true
          setLoaded(true)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [accessToken])

  // --- Songs ---

  const importFromDrive = useCallback((driveSongs) => {
    const existingIds = new Set(dataRef.current.songs.map((s) => s.id))
    const newOnes = driveSongs
      .filter((s) => !existingIds.has(s.id))
      .map((s) => ({ id: s.id, name: s.name, driveId: s.id, hasLyrics: true }))
    if (newOnes.length > 0) {
      setSongs((prev) => [...prev, ...newOnes])
    }
    scheduleSave()
    return newOnes.length
  }, [scheduleSave])

  const addManualSong = useCallback((name) => {
    setSongs((prev) => [
      ...prev,
      { id: 'manual-' + Date.now(), name, driveId: null, hasLyrics: false },
    ])
    scheduleSave()
  }, [scheduleSave])

  const removeSong = useCallback((id) => {
    setSongs((prev) => prev.filter((s) => s.id !== id))
    // Remove from all setlists too
    setSetlists((prev) =>
      prev.map((sl) => ({ ...sl, songs: sl.songs.filter((s) => s.id !== id) }))
    )
    scheduleSave()
  }, [scheduleSave])

  // --- Setlists ---

  const createSetlist = useCallback((name) => {
    const id = Date.now().toString()
    setSetlists((prev) => [
      ...prev,
      { id, name, songs: [], createdAt: new Date().toISOString() },
    ])
    scheduleSave()
    return id
  }, [scheduleSave])

  const deleteSetlist = useCallback((id) => {
    setSetlists((prev) => prev.filter((sl) => sl.id !== id))
    scheduleSave()
  }, [scheduleSave])

  const renameSetlist = useCallback((id, name) => {
    setSetlists((prev) => prev.map((sl) => (sl.id === id ? { ...sl, name } : sl)))
    scheduleSave()
  }, [scheduleSave])

  const addSongToSetlist = useCallback((setlistId, song) => {
    setSetlists((prev) =>
      prev.map((sl) => {
        if (sl.id !== setlistId) return sl
        if (sl.songs.find((x) => x.id === song.id)) return sl
        return { ...sl, songs: [...sl.songs, song] }
      })
    )
    scheduleSave()
  }, [scheduleSave])

  const removeSongFromSetlist = useCallback((setlistId, songId) => {
    setSetlists((prev) =>
      prev.map((sl) =>
        sl.id === setlistId
          ? { ...sl, songs: sl.songs.filter((x) => x.id !== songId) }
          : sl
      )
    )
    scheduleSave()
  }, [scheduleSave])

  const moveSongInSetlist = useCallback((setlistId, from, to) => {
    setSetlists((prev) =>
      prev.map((sl) => {
        if (sl.id !== setlistId) return sl
        const songs = [...sl.songs]
        const [moved] = songs.splice(from, 1)
        songs.splice(to, 0, moved)
        return { ...sl, songs }
      })
    )
    scheduleSave()
  }, [scheduleSave])

  return {
    songs,
    setlists,
    loaded,
    syncing,
    syncError,
    importFromDrive,
    addManualSong,
    removeSong,
    createSetlist,
    deleteSetlist,
    renameSetlist,
    addSongToSetlist,
    removeSongFromSetlist,
    moveSongInSetlist,
  }
}

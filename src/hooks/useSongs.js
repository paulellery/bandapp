import { useState, useEffect } from 'react'

const SONGS_KEY = 'bandapp-songs'

export function useSongs() {
  const [songs, setSongs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SONGS_KEY) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(SONGS_KEY, JSON.stringify(songs))
  }, [songs])

  // Returns count of newly added songs
  const importFromDrive = (driveSongs) => {
    const existingIds = new Set(songs.map((s) => s.id))
    const newOnes = driveSongs
      .filter((s) => !existingIds.has(s.id))
      .map((s) => ({ id: s.id, name: s.name, driveId: s.id, hasLyrics: true }))
    if (newOnes.length > 0) {
      setSongs((prev) => [...prev, ...newOnes])
    }
    return newOnes.length
  }

  const addManualSong = (name) => {
    const id = 'manual-' + Date.now()
    setSongs((prev) => [...prev, { id, name, driveId: null, hasLyrics: false }])
  }

  const removeSong = (id) => {
    setSongs((prev) => prev.filter((s) => s.id !== id))
  }

  return { songs, importFromDrive, addManualSong, removeSong }
}

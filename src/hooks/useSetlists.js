import { useState, useEffect } from 'react'

const STORAGE_KEY = 'setlist-app-setlists'

export function useSetlists() {
  const [setlists, setSetlists] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(setlists))
  }, [setlists])

  const createSetlist = (name) => {
    const newSetlist = {
      id: Date.now().toString(),
      name,
      songs: [],
      createdAt: new Date().toISOString(),
    }
    setSetlists((prev) => [...prev, newSetlist])
    return newSetlist.id
  }

  const deleteSetlist = (id) => {
    setSetlists((prev) => prev.filter((s) => s.id !== id))
  }

  const renameSetlist = (id, name) => {
    setSetlists((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
  }

  const addSongToSetlist = (setlistId, song) => {
    setSetlists((prev) =>
      prev.map((s) => {
        if (s.id !== setlistId) return s
        if (s.songs.find((x) => x.id === song.id)) return s
        return { ...s, songs: [...s.songs, song] }
      })
    )
  }

  const removeSongFromSetlist = (setlistId, songId) => {
    setSetlists((prev) =>
      prev.map((s) =>
        s.id === setlistId ? { ...s, songs: s.songs.filter((x) => x.id !== songId) } : s
      )
    )
  }

  const moveSongInSetlist = (setlistId, fromIndex, toIndex) => {
    setSetlists((prev) =>
      prev.map((s) => {
        if (s.id !== setlistId) return s
        const songs = [...s.songs]
        const [moved] = songs.splice(fromIndex, 1)
        songs.splice(toIndex, 0, moved)
        return { ...s, songs }
      })
    )
  }

  return {
    setlists,
    createSetlist,
    deleteSetlist,
    renameSetlist,
    addSongToSetlist,
    removeSongFromSetlist,
    moveSongInSetlist,
  }
}

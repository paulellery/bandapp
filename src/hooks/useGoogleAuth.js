import { useState, useEffect, useCallback, useRef } from 'react'

const CLIENT_ID = '310622956672-ck8fgpad6pombgb8vobd5fdh67kqbfka.apps.googleusercontent.com'
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly'
const STORAGE_KEY = 'bandapp_auth'

function saveAuth(user, token) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    user,
    token,
    expiry: Date.now() + 55 * 60 * 1000, // 55 min (tokens last 1hr)
  }))
}

function loadAuth() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (stored && stored.expiry > Date.now()) return stored
  } catch {}
  return null
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY)
}

export function useGoogleAuth() {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [gapiReady, setGapiReady] = useState(false)
  const [tokenClient, setTokenClient] = useState(null)
  const tokenClientRef = useRef(null)

  const applyToken = useCallback((token, userInfo) => {
    setAccessToken(token)
    setUser(userInfo)
    window.gapi.client.setToken({ access_token: token })
    saveAuth(userInfo, token)
  }, [])

  useEffect(() => {
    const initGapi = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        })
        setGapiReady(true)
      })
    }

    if (window.gapi) {
      initGapi()
    } else {
      const script = document.querySelector('script[src="https://apis.google.com/js/api.js"]')
      if (script) script.addEventListener('load', initGapi)
    }
  }, [])

  useEffect(() => {
    const initGis = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            console.error('Token error:', response.error)
            clearAuth()
            return
          }
          const token = response.access_token
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((info) => applyToken(token, info))
            .catch(console.error)
        },
      })
      tokenClientRef.current = client
      setTokenClient(client)
    }

    if (window.google?.accounts?.oauth2) {
      initGis()
    } else {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (script) {
        script.addEventListener('load', initGis)
      } else {
        const interval = setInterval(() => {
          if (window.google?.accounts?.oauth2) {
            clearInterval(interval)
            initGis()
          }
        }, 200)
        return () => clearInterval(interval)
      }
    }
  }, [applyToken])

  // Restore session on load once both gapi and token client are ready
  useEffect(() => {
    if (!gapiReady || !tokenClient) return

    const stored = loadAuth()
    if (stored) {
      // Token still valid — restore immediately without prompting
      applyToken(stored.token, stored.user)
    } else if (localStorage.getItem(STORAGE_KEY + '_hint')) {
      // Token expired but user previously signed in — silent refresh
      tokenClient.requestAccessToken({ prompt: '' })
    }
  }, [gapiReady, tokenClient, applyToken])

  const signIn = useCallback(() => {
    if (!tokenClient) return
    localStorage.setItem(STORAGE_KEY + '_hint', '1')
    tokenClient.requestAccessToken({ prompt: '' })
  }, [tokenClient])

  const signOut = useCallback(() => {
    if (accessToken) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        setAccessToken(null)
        setUser(null)
        window.gapi.client.setToken(null)
        clearAuth()
        localStorage.removeItem(STORAGE_KEY + '_hint')
      })
    }
  }, [accessToken])

  return { user, accessToken, gapiReady, signIn, signOut, isSignedIn: !!accessToken }
}

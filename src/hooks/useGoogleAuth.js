import { useState, useEffect, useCallback } from 'react'

const CLIENT_ID = '310622956672-ck8fgpad6pombgb8vobd5fdh67kqbfka.apps.googleusercontent.com'
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly'

export function useGoogleAuth() {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [gapiReady, setGapiReady] = useState(false)
  const [tokenClient, setTokenClient] = useState(null)

  useEffect(() => {
    // Load gapi and initialize the Drive client
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
      if (script) {
        script.addEventListener('load', initGapi)
      }
    }
  }, [])

  useEffect(() => {
    // Initialize Google Identity Services token client
    const initGis = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            console.error('Token error:', response.error)
            return
          }
          const token = response.access_token
          setAccessToken(token)
          window.gapi.client.setToken({ access_token: token })

          // Fetch user info
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((info) => setUser(info))
            .catch(console.error)
        },
      })
      setTokenClient(client)
    }

    if (window.google?.accounts?.oauth2) {
      initGis()
    } else {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (script) {
        script.addEventListener('load', initGis)
      } else {
        // Poll until gsi client loads
        const interval = setInterval(() => {
          if (window.google?.accounts?.oauth2) {
            clearInterval(interval)
            initGis()
          }
        }, 200)
        return () => clearInterval(interval)
      }
    }
  }, [])

  const signIn = useCallback(() => {
    if (!tokenClient) return
    tokenClient.requestAccessToken({ prompt: 'consent' })
  }, [tokenClient])

  const signOut = useCallback(() => {
    if (accessToken) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        setAccessToken(null)
        setUser(null)
        window.gapi.client.setToken(null)
      })
    }
  }, [accessToken])

  return { user, accessToken, gapiReady, signIn, signOut, isSignedIn: !!accessToken }
}

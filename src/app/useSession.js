import { useEffect, useState } from 'react'
import { getSession, subscribeSession } from '../utils/storage'

export function useSession() {
  const [session, setSessionState] = useState(() => getSession())

  useEffect(() => {
    return subscribeSession(() => setSessionState(getSession()))
  }, [])

  return session
}


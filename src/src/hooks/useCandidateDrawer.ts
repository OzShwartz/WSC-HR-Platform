import { useState } from 'react'
import { api } from '../api/client'
import type { ScoredCandidate } from '../types'

/** Shared by any page that only has a hubspot_id handy (Dashboard's top
 * candidates, WSC Team's reverse connection view) and needs to open the same
 * Candidate Drawer the Candidate Pool / Job Detail pages use. */
export function useCandidateDrawer() {
  const [selected, setSelected] = useState<ScoredCandidate | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function open(hubspotId: string) {
    setLoadingId(hubspotId)
    try {
      const candidate = await api.candidate(hubspotId)
      setSelected(candidate)
    } finally {
      setLoadingId(null)
    }
  }

  return { selected, loadingId, open, close: () => setSelected(null) }
}

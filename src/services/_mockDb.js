import { mockUsers } from '../data/mockUsers'
import { mockProperties } from '../data/mockProperties'
import { mockDocuments } from '../data/mockDocuments'
import { mockRequests } from '../data/mockRequests'
import { mockReviews } from '../data/mockReviews'
import { readJson, writeJson } from '../utils/storage'

const KEYS = {
  users: 'leaseflow_mock_users',
  properties: 'leaseflow_mock_properties',
  documents: 'leaseflow_mock_documents',
  requests: 'leaseflow_mock_requests',
  reviews: 'leaseflow_mock_reviews',
  contacts: 'leaseflow_mock_contacts',
}

function initKey(key, seedValue) {
  const existing = readJson(key, null)
  if (existing) return
  writeJson(key, seedValue)
}

export function ensureDb() {
  initKey(KEYS.users, mockUsers)
  initKey(KEYS.properties, mockProperties)
  initKey(KEYS.documents, mockDocuments)
  initKey(KEYS.requests, mockRequests)
  initKey(KEYS.reviews, mockReviews)
  initKey(KEYS.contacts, [])
}

export function readCollection(name) {
  ensureDb()
  return readJson(KEYS[name], [])
}

export function writeCollection(name, items) {
  ensureDb()
  writeJson(KEYS[name], items)
}

export function nextId(name) {
  const items = readCollection(name)
  const max = items.reduce((acc, item) => Math.max(acc, item.id ?? 0), 0)
  return max + 1
}


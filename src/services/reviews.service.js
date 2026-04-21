import { delay } from './_sim'
import { nextId, readCollection, writeCollection } from './_mockDb'
import { todayISO } from '../utils/formatters'

export async function listReviews() {
  await delay()
  return readCollection('reviews')
}

export async function createReview({ rating, comentario }) {
  await delay()
  const reviews = readCollection('reviews')
  const next = {
    id: nextId('reviews'),
    rating: Number(rating),
    comentario: comentario || '',
    fecha: todayISO(),
  }
  writeCollection('reviews', [next, ...reviews])
  return next
}


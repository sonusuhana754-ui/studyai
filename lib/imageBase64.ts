/**
 * Ensure we have raw base64 for vision APIs (web gallery sometimes omits it).
 */

export function stripBase64Prefix(data: string): string {
  return data.replace(/^data:image\/\w+;base64,/, '').trim()
}

export function detectImageMimeType(base64: string, uri?: string): 'image/png' | 'image/jpeg' | 'image/webp' {
  const raw = stripBase64Prefix(base64)
  if (raw.startsWith('iVBORw0KGgo')) return 'image/png'
  if (raw.startsWith('UklGR')) return 'image/webp'
  const lower = (uri ?? '').toLowerCase()
  if (lower.includes('.png')) return 'image/png'
  if (lower.includes('.webp')) return 'image/webp'
  return 'image/jpeg'
}

export async function ensureImageBase64(
  base64?: string | null,
  uri?: string | null
): Promise<string> {
  const cleaned = base64 ? stripBase64Prefix(base64) : ''
  if (cleaned.length > 200) return cleaned

  if (!uri) {
    throw new Error('No image data from camera. Please retake the photo.')
  }

  const response = await fetch(uri)
  if (!response.ok) {
    throw new Error('Could not load the photo. Please try again.')
  }
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result
      if (typeof dataUrl !== 'string') {
        reject(new Error('Failed to encode image'))
        return
      }
      const parts = dataUrl.split(',')
      const encoded = parts[1]
      if (!encoded || encoded.length < 200) {
        reject(new Error('Photo encoding failed. Please retake the picture.'))
        return
      }
      resolve(encoded)
    }
    reader.onerror = () => reject(new Error('Failed to read photo file'))
    reader.readAsDataURL(blob)
  })
}

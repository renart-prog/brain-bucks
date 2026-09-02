// Downscales an uploaded image file to a small square-ish JPEG data URL so a
// profile picture doesn't blow up localStorage with a multi-megabyte photo.
export function resizeImageToDataUrl(file, maxSize = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not load image'))
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// Plain base64 encode with no re-encoding — for files where forcing a JPEG
// re-encode is wrong (PDFs, audio) or unnecessary (small text attachments).
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

// Client-side guard called before either encoder runs, so an oversized file
// never gets base64-encoded (which would just inflate it further) before
// being rejected.
export function assertFileSize(file, maxBytes = MAX_UPLOAD_BYTES) {
  return file.size <= maxBytes
}

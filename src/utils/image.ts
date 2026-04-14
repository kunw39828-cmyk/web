/** 将图片压缩为 JPEG base64，避免过长超出数据库/请求限制 */
export async function fileToCompressedDataUrl(
  file: File,
  maxWidth = 960,
  quality = 0.82,
  depth = 0,
): Promise<string> {
  if (depth > 8) throw new Error('图片仍过大，请换一张更小的图片。')
  let bitmap: ImageBitmap | null = null
  try {
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(file)
    }
  } catch {
    bitmap = null
  }

  let w = 0
  let h = 0
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法处理图片。')

  if (bitmap) {
    const scale = Math.min(1, maxWidth / bitmap.width)
    w = Math.round(bitmap.width * scale)
    h = Math.round(bitmap.height * scale)
    canvas.width = w
    canvas.height = h
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
  } else {
    await new Promise<void>((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.naturalWidth)
        w = Math.round(img.naturalWidth * scale)
        h = Math.round(img.naturalHeight * scale)
        canvas.width = w
        canvas.height = h
        const c = canvas.getContext('2d')
        if (!c) {
          URL.revokeObjectURL(url)
          reject(new Error('无法处理图片。'))
          return
        }
        c.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        resolve()
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('无法读取图片，请换一张或换浏览器试试。'))
      }
      img.src = url
    })
  }

  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  if (dataUrl.length > 1_200_000) {
    return fileToCompressedDataUrl(file, Math.floor(maxWidth * 0.75), quality * 0.9, depth + 1)
  }
  return dataUrl
}

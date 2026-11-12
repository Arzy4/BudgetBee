import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Download } from '@/plugins/download'

export type ExportAction = 'download' | 'share'

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to convert file to Base64.'))
        return
      }

      const base64 = reader.result.split(',')[1]

      if (!base64) {
        reject(new Error('Invalid Base64 file content.'))
        return
      }

      resolve(base64)
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function downloadInBrowser(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  link.remove()

  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function saveExportFile(
  blob: Blob,
  filename: string,
  action: ExportAction = 'download',
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    if (action === 'share' && navigator.share) {
      const file = new File([blob], filename, {
        type: blob.type || 'application/octet-stream',
      })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'BudgetBee Financial Report',
          files: [file],
        })
        return
      }
    }

    downloadInBrowser(blob, filename)
    return
  }

  const base64 = await blobToBase64(blob)

  if (action === 'download') {
    console.log('Download plugin registered:', Capacitor.isPluginAvailable('Download'))
    const result = await Download.saveFile({
      filename,
      base64,
      mimeType: blob.type || 'application/octet-stream',
    })

    console.log('Report downloaded:', result.uri)
    return
  }

  const savedFile = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  })

  await Share.share({
    title: 'BudgetBee Financial Report',
    text: 'Your exported financial report',
    url: savedFile.uri,
    dialogTitle: 'Share Financial Report',
  })
}

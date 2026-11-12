import { registerPlugin } from '@capacitor/core'

interface DownloadPlugin {
  saveFile(options: {
    filename: string
    base64: string
    mimeType: string
  }): Promise<{
    filename: string
    uri: string
    success: boolean
  }>
}

export const Download = registerPlugin<DownloadPlugin>('Download')
import { api } from './client'

export type ExportFormat = 'json' | 'csv'

export async function getWorkspaceExport(format: ExportFormat): Promise<Blob> {
  const response = await api.get<Blob>(`/export/${format}`, {
    responseType: 'blob',
  })
  return response.data
}

export function saveWorkspaceExport(blob: Blob, format: ExportFormat): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)

  link.href = url
  link.download = `cyberlab-export-${date}.${format}`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  window.setTimeout(() => {
    link.remove()
    URL.revokeObjectURL(url)
  }, 1_000)
}

import { requestJson } from './client'

export type FrontendVersionInfo = {
  service?: string
  environment?: string
  branch?: string
  commit?: string
  shortCommit?: string
  repository?: string
  runId?: string
  builtAt?: string
}

export type BackendServiceInfo = {
  enabled?: boolean
  image?: string
  tag?: string
}

export type BackendDeploymentInfo = {
  environment?: string
  branch?: string
  commit?: string
  repository?: string
  runId?: string
  tier?: string
  tenantId?: string
  services?: Record<string, BackendServiceInfo>
}

export async function getFrontendVersionInfo(): Promise<FrontendVersionInfo> {
  const response = await fetch('/version.json', {
    cache: 'no-store',
    credentials: 'omit',
  })
  if (!response.ok) {
    throw new Error(response.statusText || 'Frontend version unavailable')
  }
  return response.json() as Promise<FrontendVersionInfo>
}

export function getBackendDeploymentInfo(): Promise<BackendDeploymentInfo> {
  return requestJson<BackendDeploymentInfo>('/deployment-info', undefined, { anonymous: true })
}

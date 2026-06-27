const HOST_BASE = import.meta.env.VITE_PLATFORM_HOST_BASE ?? 'k8s.tbd-htwg.de'
const ENTERPRISE_HOST_BASE =
  import.meta.env.VITE_PLATFORM_ENTERPRISE_HOST_BASE ?? 'enterprise.k8s.tbd-htwg.de'

export const DEVELOP_SLUG = 'develop'

function isLocalDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

export function resolveTenantSlugFromHost(host = window.location.host): string {
  const hostname = host.split(':')[0].toLowerCase()
  if (isLocalDevHost(hostname)) return DEVELOP_SLUG
  const base = HOST_BASE.toLowerCase()
  if (hostname === base) return 'free'

  const entBase = ENTERPRISE_HOST_BASE.toLowerCase()
  const entSuffix = `.${entBase}`
  if (hostname.endsWith(entSuffix)) {
    const slug = hostname.slice(0, hostname.length - entSuffix.length)
    if (slug && !slug.includes('.')) return slug
  }

  const suffix = `.${base}`
  if (hostname.endsWith(suffix)) {
    const slug = hostname.slice(0, hostname.length - suffix.length)
    if (slug && !slug.includes('.')) return slug
  }
  return 'free'
}

export function isEnterpriseHost(host = window.location.host): boolean {
  const hostname = host.split(':')[0].toLowerCase()
  if (isLocalDevHost(hostname)) return true
  return hostname.endsWith(`.${ENTERPRISE_HOST_BASE.toLowerCase()}`)
}

/** Custom field trip values are only served on enterprise (and local develop) hosts. */
export function hostSupportsTripCustomFields(host = window.location.host): boolean {
  return isEnterpriseHost(host)
}

const HOST_BASE = import.meta.env.VITE_PLATFORM_HOST_BASE ?? 'k8s.tbd-htwg.de'

export function resolveTenantSlugFromHost(host = window.location.host): string {
  const hostname = host.split(':')[0].toLowerCase()
  const base = HOST_BASE.toLowerCase()
  if (hostname === base) return 'free'
  const suffix = `.${base}`
  if (hostname.endsWith(suffix)) {
    const slug = hostname.slice(0, hostname.length - suffix.length)
    if (slug && !slug.includes('.')) return slug
  }
  return 'free'
}

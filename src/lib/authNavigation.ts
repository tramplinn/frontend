export function authNextPath(currentPath: string, requested: unknown): string {
  return typeof requested === 'string' && requested.startsWith('/') && !requested.startsWith('//')
    ? requested
    : currentPath
}

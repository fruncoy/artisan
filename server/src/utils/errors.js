export function apiError(message, status = 500) {
  return { message, status }
}

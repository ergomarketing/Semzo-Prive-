// The middleware was competing with useAuth hook and causing constant redirections
// We'll handle auth redirections in components instead

export const config = {
  matcher: [],
}

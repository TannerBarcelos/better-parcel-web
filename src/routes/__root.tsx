import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { queryClient } from '@/lib/query-client'
import '../styles.css'

export type RouterAppContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'bpw_theme'
const THEME_SYSTEM_KEY = 'bpw_theme_system'

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

function resolveInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'

  const systemTheme = getSystemTheme()
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  const storedSystemTheme = window.localStorage.getItem(THEME_SYSTEM_KEY)

  if (
    (storedTheme === 'light' || storedTheme === 'dark') &&
    storedSystemTheme === systemTheme
  ) {
    return storedTheme
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, systemTheme)
  window.localStorage.setItem(THEME_SYSTEM_KEY, systemTheme)
  return systemTheme
}

function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('dark')

  useEffect(() => {
    const initialTheme = resolveInitialTheme()
    setTheme(initialTheme)
    applyTheme(initialTheme)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => {
      const nextSystemTheme = media.matches ? 'dark' : 'light'
      setTheme(nextSystemTheme)
      applyTheme(nextSystemTheme)
      window.localStorage.setItem(THEME_STORAGE_KEY, nextSystemTheme)
      window.localStorage.setItem(THEME_SYSTEM_KEY, nextSystemTheme)
    }

    media.addEventListener('change', onSystemChange)
    return () => media.removeEventListener('change', onSystemChange)
  }, [])

  function onToggleTheme() {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    const systemTheme = getSystemTheme()

    setTheme(nextTheme)
    applyTheme(nextTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    window.localStorage.setItem(THEME_SYSTEM_KEY, systemTheme)
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}

function RootComponent() {
  const themeBootScript = `
    (function () {
      var THEME_STORAGE_KEY = '${THEME_STORAGE_KEY}';
      var THEME_SYSTEM_KEY = '${THEME_SYSTEM_KEY}';
      var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      var storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      var storedSystemTheme = localStorage.getItem(THEME_SYSTEM_KEY);
      var theme = (storedTheme === 'light' || storedTheme === 'dark') && storedSystemTheme === systemTheme
        ? storedTheme
        : systemTheme;
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      localStorage.setItem(THEME_SYSTEM_KEY, systemTheme);
    })();
  `

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Better Parcel Web</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeToggle />
          <Outlet />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}

function NotFoundPage() {
  return (
    <main className="shell">
      <section className="card auth-card">
        <h1>Page not found</h1>
        <p>The page you requested does not exist.</p>
        <Link to="/" className="button primary">
          Go to home
        </Link>
      </section>
    </main>
  )
}

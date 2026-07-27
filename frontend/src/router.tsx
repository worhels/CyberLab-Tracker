import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react'

export interface AppLocation {
  pathname: string
  search: string
  hash: string
  state: unknown
}

interface NavigateOptions {
  replace?: boolean
  state?: unknown
}

interface RouterContextValue {
  location: AppLocation
  navigate: (to: string, options?: NavigateOptions) => void
}

type NavLinkState = { isActive: boolean }
type SearchParamsSetter = (
  next: URLSearchParams | ((current: URLSearchParams) => URLSearchParams),
  options?: NavigateOptions,
) => void

const RouterContext = createContext<RouterContextValue | null>(null)

function readHistoryState(): unknown {
  const historyState: unknown = window.history.state
  if (typeof historyState !== 'object' || historyState === null || !('usr' in historyState)) {
    return null
  }
  return historyState.usr
}

function readLocation(): AppLocation {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    state: readHistoryState(),
  }
}

function internalPath(to: string): string {
  const url = new URL(to, window.location.href)
  if (url.origin !== window.location.origin) {
    throw new Error('Router navigation must stay on the current origin')
  }
  return `${url.pathname}${url.search}${url.hash}`
}

export function BrowserRouter({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(readLocation)

  useEffect(() => {
    const onPopState = () => setLocation(readLocation())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((to: string, options: NavigateOptions = {}) => {
    const path = internalPath(to)
    const nextState = { usr: options.state ?? null }
    if (options.replace) {
      window.history.replaceState(nextState, '', path)
    } else {
      window.history.pushState(nextState, '', path)
    }
    setLocation(readLocation())
  }, [])

  const value = useMemo<RouterContextValue>(
    () => ({ location, navigate }),
    [location, navigate],
  )

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

function useRouter(): RouterContextValue {
  const context = useContext(RouterContext)
  if (!context) throw new Error('Router hooks must be used inside BrowserRouter')
  return context
}

export function useLocation(): AppLocation {
  return useRouter().location
}

export function useNavigate(): RouterContextValue['navigate'] {
  return useRouter().navigate
}

export function Navigate({
  replace = false,
  state,
  to,
}: NavigateOptions & { to: string }) {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(to, { replace, state })
  }, [navigate, replace, state, to])

  return null
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
}

export function Link({ children, onClick, target, to, ...props }: LinkProps) {
  const navigate = useNavigate()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || target === '_blank'
    ) {
      return
    }

    event.preventDefault()
    navigate(to)
  }

  return (
    <a {...props} href={to} target={target} onClick={handleClick}>
      {children}
    </a>
  )
}

interface NavLinkProps extends Omit<LinkProps, 'className' | 'style'> {
  className?: string | ((state: NavLinkState) => string)
  style?: CSSProperties | ((state: NavLinkState) => CSSProperties)
}

export function NavLink({ className, style, to, ...props }: NavLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`)
  const state = { isActive }

  return (
    <Link
      {...props}
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={typeof className === 'function' ? className(state) : className}
      style={typeof style === 'function' ? style(state) : style}
    />
  )
}

export function useSearchParams(): [URLSearchParams, SearchParamsSetter] {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const setSearchParams = useCallback<SearchParamsSetter>(
    (next, options = {}) => {
      const resolved = typeof next === 'function'
        ? next(new URLSearchParams(location.search))
        : next
      const query = resolved.toString()
      navigate(`${location.pathname}${query ? `?${query}` : ''}${location.hash}`, options)
    },
    [location.hash, location.pathname, location.search, navigate],
  )

  return [searchParams, setSearchParams]
}

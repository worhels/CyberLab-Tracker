import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  BrowserRouter,
  Link,
  useLocation,
  useSearchParams,
} from '../router'

function LocationProbe() {
  const location = useLocation()
  return <output>{`${location.pathname}${location.search}`}</output>
}

function SearchParamsProbe() {
  const [searchParams, setSearchParams] = useSearchParams()
  return (
    <>
      <output>{searchParams.get('task_id') ?? 'none'}</output>
      <button
        type="button"
        onClick={() => setSearchParams(new URLSearchParams({ task_id: '42' }))}
      >
        Select task
      </button>
    </>
  )
}

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('local browser router', () => {
  it('navigates same-origin links without reloading the document', () => {
    window.history.replaceState(null, '', '/dashboard')
    render(
      <BrowserRouter>
        <Link to="/tasks?status=active">Tasks</Link>
        <LocationProbe />
      </BrowserRouter>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Tasks' }))

    expect(screen.getByRole('status')).toHaveTextContent('/tasks?status=active')
    expect(window.location.pathname).toBe('/tasks')
  })

  it('updates search parameters while preserving the current path', () => {
    window.history.replaceState(null, '', '/subjects')
    render(
      <BrowserRouter>
        <SearchParamsProbe />
      </BrowserRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Select task' }))

    expect(screen.getByRole('status')).toHaveTextContent('42')
    expect(window.location.pathname).toBe('/subjects')
    expect(window.location.search).toBe('?task_id=42')
  })
})

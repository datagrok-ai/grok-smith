import { render } from '@testing-library/react'
import { createElement } from 'react'

import { DatagrokProvider, createMockAdapter } from '@datagrok/app-core'
import type { DatagrokContext } from '@datagrok/app-core'
import type { ReactElement } from 'react'
import type { RenderOptions } from '@testing-library/react'

/**
 * Renders a React element wrapped in DatagrokProvider with a mock context.
 * Use this for component tests that depend on the Datagrok context.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const mockContext = createMockAdapter() as DatagrokContext

  function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(DatagrokProvider, { context: mockContext }, children)
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

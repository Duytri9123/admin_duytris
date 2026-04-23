// MSW v2 Node server for Admin Jest integration tests
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

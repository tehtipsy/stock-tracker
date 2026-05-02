import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import Header from './routes/__root'
import MultiplesPanel from './routes/index'
import FinancialsPanel from './routes/financials'

const rootRoute = createRootRoute({ component: Header })

export const multiplesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MultiplesPanel,
})

export const financialsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/financials',
  component: FinancialsPanel,
})

const routeTree = rootRoute.addChildren([multiplesRoute, financialsRoute])

export const router = createRouter({ routeTree })

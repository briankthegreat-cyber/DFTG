import { lazy } from 'react';
import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router-dom';
import { SiteLayout } from './components/SiteLayout';

// Route-level code splitting keeps the first load small; the 3D scene loads separately on demand.
const Home = lazy(() => import('./pages/Home'));
const Learn = lazy(() => import('./pages/Learn'));
const UnderstandIbd = lazy(() => import('./pages/UnderstandIbd'));
const UnderstandIbs = lazy(() => import('./pages/UnderstandIbs'));
const Community = lazy(() => import('./pages/Community'));
const GetInvolved = lazy(() => import('./pages/GetInvolved'));
const Shop = lazy(() => import('./pages/Shop'));
const NotFound = lazy(() => import('./pages/NotFound'));

const routes = [
  {
    path: '/',
    element: <SiteLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'learn', element: <Learn /> },
      { path: 'learn/ibd', element: <UnderstandIbd /> },
      { path: 'learn/ibs', element: <UnderstandIbs /> },
      { path: 'community', element: <Community /> },
      { path: 'get-involved', element: <GetInvolved /> },
      { path: 'shop', element: <Shop /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

// VITE_ROUTER=hash is used for single-file previews; the GitHub Pages build uses BASE_URL as basename.
const base = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');
const router = import.meta.env.VITE_ROUTER === 'hash' ? createHashRouter(routes) : createBrowserRouter(routes, { basename: base });

export function App() {
  return <RouterProvider router={router} />;
}

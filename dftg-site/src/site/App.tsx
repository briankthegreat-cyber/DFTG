import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router-dom';
import { SiteLayout } from './components/SiteLayout';
import Community from './pages/Community';
import GetInvolved from './pages/GetInvolved';
import Home from './pages/Home';
import Learn from './pages/Learn';
import NotFound from './pages/NotFound';
import Shop from './pages/Shop';
import UnderstandIbd from './pages/UnderstandIbd';
import UnderstandIbs from './pages/UnderstandIbs';

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

import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import SiteLayout from './sites/bhh/components/SiteLayout';

const Home = lazy(() => import('./sites/bhh/pages/Home'));
const Services = lazy(() => import('./sites/bhh/pages/Services'));
const ServiceDetail = lazy(() => import('./sites/bhh/pages/ServiceDetail'));
const About = lazy(() => import('./sites/bhh/pages/About'));
const Contact = lazy(() => import('./sites/bhh/pages/Contact'));
const Careers = lazy(() => import('./sites/bhh/pages/Careers'));
const NotFound = lazy(() => import('./sites/bhh/pages/NotFound'));
const Demo = lazy(() => import('./pages/Home'));

function Loading() {
  return <div className="min-h-screen bg-ink" />;
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/demo" element={<Demo />} />
      </Routes>
    </Suspense>
  );
}

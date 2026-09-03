import { seo } from '../data';
import { useSeo } from '../seo';
import { ButtonLink, Display, Eyebrow } from '../components/ui';

export default function NotFound() {
  useSeo({ title: seo.notFound.title, description: seo.notFound.description, path: '/404', noindex: true });
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-10">
      <Eyebrow rule>Page not found</Eyebrow>
      <Display as="h1" lead="That page has" accent="moved on." size="xl" className="mt-6" animate={false} />
      <p className="mt-6 max-w-md text-muted">The link may be old or mistyped. Everything on the site is one click from the menu.</p>
      <div className="mt-8">
        <ButtonLink to="/">Back to the start</ButtonLink>
      </div>
    </section>
  );
}

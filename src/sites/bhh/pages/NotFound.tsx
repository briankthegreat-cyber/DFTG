import { Button, Section, Title } from '../components/ui';

export default function NotFound() {
  return (
    <main>
      <Section className="pt-48 text-center">
        <Title text="That page has moved." as="h1" align="center" className="text-5xl md:text-7xl" />
        <p className="mt-6 text-ink/60">Try the services page or head back home.</p>
        <Button to="/" className="mt-8">
          Back to home
        </Button>
      </Section>
    </main>
  );
}

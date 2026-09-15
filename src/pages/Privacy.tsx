import Seo from '../components/Seo';
import PageHeader from '../components/PageHeader';

export default function Privacy() {
  return (
    <>
      <Seo title="Privacy policy" canonical="/privacy" />
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        description="What we collect, why we collect it, and what we never do with it."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-20 text-sm leading-7 text-slate-300 sm:px-6 lg:px-8">
        <Section title="What we collect">
          <p>
            Aivora collects only the data needed to operate the directory: the
            tools you browse, the articles you read, and aggregated, hashed
            click analytics for outbound tool links. When you submit a tool or
            contact us, we collect the fields you fill in.
          </p>
        </Section>
        <Section title="Cookies & local storage">
          <p>
            We use Supabase Auth for admin sessions. We don't run third-party
            advertising trackers on the public site.
          </p>
        </Section>
        <Section title="How we use data">
          <p>
            Tool submissions are reviewed by editors. Contact messages go to
            our inbox. We use click analytics to rank popular tools.
          </p>
        </Section>
        <Section title="Your rights">
          <p>
            You can request deletion of submissions or contact messages by
            emailing us. We honor verified requests within 30 days.
          </p>
        </Section>
        <Section title="Contact">
          <p>Questions about privacy? Email hello@aivora.io.</p>
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

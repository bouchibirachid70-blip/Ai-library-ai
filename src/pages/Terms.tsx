import Seo from '../components/Seo';
import PageHeader from '../components/PageHeader';

export default function Terms() {
  return (
    <>
      <Seo title="Terms of service" canonical="/terms" />
      <PageHeader
        eyebrow="Legal"
        title="Terms of service"
        description="The rules of the road for using Aivora."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-20 text-sm leading-7 text-slate-300 sm:px-6 lg:px-8">
        <Section title="Acceptable use">
          <p>
            Don't try to break the directory, scrape it at unreasonable rates,
            or use it to host or distribute malicious content. Be reasonable.
          </p>
        </Section>
        <Section title="Submissions">
          <p>
            By submitting a tool, you confirm you have the right to share the
            information you send. We reserve the right to edit or reject any
            submission.
          </p>
        </Section>
        <Section title="Third-party tools">
          <p>
            Aivora lists third-party tools for discovery. We are not responsible
            for those tools' content, pricing, or behavior. Always review a
            tool's own terms before using it.
          </p>
        </Section>
        <Section title="Disclaimer">
          <p>
            The directory is provided as-is, without warranties of any kind.
            Listings do not constitute endorsement.
          </p>
        </Section>
        <Section title="Contact">
          <p>Questions about these terms? Email hello@aivora.io.</p>
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

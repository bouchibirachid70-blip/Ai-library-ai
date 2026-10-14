import { buildMetadata } from "@/components/seo";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "The terms that govern your use of Aivora. Tool listings are provided 'as is' and we are not responsible for third-party tool content.",
  path: "/terms",
});

export const revalidate = 3600;

export default function TermsPage() {
  return (
    <div className="bg-grid pb-12">
      <section className="border-b border-border/40">
        <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </section>

      <article className="container mx-auto max-w-3xl px-4 py-10">
        <div className="article-content">
          <section>
            <p>
              By using Aivora, you agree to these terms. If you don&apos;t agree
              to them, please don&apos;t use the site.
            </p>
          </section>

          <section>
            <h2>The directory</h2>
            <p>
              Aivora is a curated directory of AI tools and related articles.
              Listings are provided for informational purposes only and do not
              constitute an endorsement or recommendation. We do not guarantee
              that any listed tool will continue to be available, work as
              described, or be free of defects.
            </p>
          </section>

          <section>
            <h2>Third-party tools</h2>
            <p>
              Tool listings link to third-party websites that we do not control.
              We are not responsible for the content, quality, accuracy, or
              practices of third-party tools or their websites. Your use of any
              third-party tool is governed by that tool&apos;s own terms and
              policies. Always do your own research before signing up for or
              paying for a tool.
            </p>
          </section>

          <section>
            <h2>Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the site in any way that breaches applicable laws or regulations.</li>
              <li>
                Attempt to gain unauthorized access to any part of the site, its
                systems, or its data.
              </li>
              <li>
                Abuse, overload, or otherwise interfere with the site or its
                APIs (including automated scraping at high volume).
              </li>
              <li>
                Submit content that is unlawful, misleading, infringes on
                others&apos; rights, or that you do not have permission to share.
              </li>
              <li>
                Submit tools whose primary purpose is malware, phishing, fraud,
                or other malicious activity.
              </li>
            </ul>
          </section>

          <section>
            <h2>Submissions</h2>
            <p>
              Submissions become subject to review by our team. We may edit a
              submission for clarity or fit, reject it for any reason, or remove
              a previously approved listing at our discretion. You confirm that
              you have the rights to submit the tool and that the information you
              provide is accurate to the best of your knowledge.
            </p>
          </section>

          <section>
            <h2>Listings are provided &ldquo;as is&rdquo;</h2>
            <p>
              The site and all listings are provided &ldquo;as is&rdquo; and
              &ldquo;as available,&rdquo; without warranties of any kind, either
              express or implied. To the maximum extent permitted by law, we
              disclaim all warranties, including implied warranties of
              merchantability, fitness for a particular purpose, and
              non-infringement.
            </p>
          </section>

          <section>
            <h2>Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Aivora shall not be liable
              for any indirect, incidental, or consequential damages, or any
              loss of data, profits, or business arising from your use of the
              site or reliance on any listing. You use the site and listed tools
              at your own risk.
            </p>
          </section>

          <section>
            <h2>Changes to these terms</h2>
            <p>
              We may revise these terms from time to time. The &ldquo;Last
              updated&rdquo; date reflects when they were last revised. Your
              continued use of the site after changes take effect constitutes
              acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Questions or reports about a listing or these terms? Use our{" "}
              <a href="/contact">contact form</a> to reach us.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}

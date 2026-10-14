import { buildMetadata } from "@/components/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How Aivora handles your data. We don't track you with analytics, we don't sell your data, and ad units are placed by our team.",
  path: "/privacy",
});

export const revalidate = 3600;

export default function PrivacyPage() {
  return (
    <div className="bg-grid pb-12">
      <section className="border-b border-border/40">
        <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Privacy Policy
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
              Aivora is a curated directory of AI tools. We aim to keep things
              simple and respectful of your privacy. This policy explains what we
              do — and importantly what we don&apos;t do — when you visit the
              site.
            </p>
          </section>

          <section>
            <h2>What we don&apos;t collect</h2>
            <p>
              We do not run analytics trackers on visitors. We do not place
              tracking pixels, build visitor profiles, sell your browsing data,
              or share it with advertising networks for personalization.
            </p>
          </section>

          <section>
            <h2>Advertising</h2>
            <p>
              Aivora is supported by ad units placed by the site admin. These ad
              units may include third-party ad network scripts (for example,
              Google AdSense) that have their own privacy practices and may set
              cookies on your device. The ad networks — not Aivora — control
              what data those scripts collect and how they use it.
            </p>
            <p>
              If you would like to opt out of third-party advertising cookies,
              you can usually do so in your browser settings or via the
              network&apos;s own opt-out tools (e.g. Google&apos;s Ads Settings).
            </p>
          </section>

          <section>
            <h2>What you send us</h2>
            <p>
              If you submit a tool, the information you provide (tool name,
              website URL, description, your email, and the selected category) is
              stored so our team can review the submission. We use the email you
              provide only to follow up about that submission.
            </p>
            <p>
              If you contact us via the contact form, your name, email, and
              message are stored for admin follow-up. We do not add contact-form
              submitters to marketing lists.
            </p>
          </section>

          <section>
            <h2>Tool listings</h2>
            <p>
              Tool listings on Aivora link out to third-party websites. Once you
              click through to a tool&apos;s website, you are subject to that
              site&apos;s own privacy policy — not ours.
            </p>
          </section>

          <section>
            <h2>Data retention</h2>
            <p>
              Submissions and contact messages are kept for as long as needed to
              process them and for reasonable record-keeping afterwards. Click
              counts (an aggregate metric used to rank tools) do not contain
              personal identifiers.
            </p>
          </section>

          <section>
            <h2>Your choices</h2>
            <ul>
              <li>You can use ad-blocking tools to limit third-party ad scripts.</li>
              <li>You can contact us to request deletion of a submission or message you sent.</li>
              <li>You can browse the directory without submitting any information.</li>
            </ul>
          </section>

          <section>
            <h2>Children&apos;s privacy</h2>
            <p>
              Aivora is not directed at children under 13 and we do not
              knowingly collect their personal information.
            </p>
          </section>

          <section>
            <h2>Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Any changes will be
              posted on this page with a new &ldquo;Last updated&rdquo; date.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Questions about this policy? Use our{" "}
              <a href="/contact">contact form</a> and we&apos;ll get back to you.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}

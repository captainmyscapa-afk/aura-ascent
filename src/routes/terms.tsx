import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection, LegalNote } from "@/components/aurum/LegalLayout";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="[date of publication]">
      <LegalNote>
        This is a working draft prepared to cover Aurum OS's actual functionality. It has not been
        reviewed by a lawyer. Have qualified counsel review this before it governs real signups or
        payments — particularly the billing, liability, and governing-law sections.
      </LegalNote>

      <LegalSection id="acceptance" title="1. Acceptance of these terms">
        <p>
          These Terms of Service ("Terms") govern your access to and use of Aurum OS, including our
          website, dashboard, and related AI-powered tools (together, the "Service"), operated by{" "}
          <strong>[Legal entity name]</strong>, a company registered in{" "}
          <strong>[jurisdiction, registration number]</strong> ("Aurum OS", "we", "us"). By creating
          an account or otherwise using the Service, you agree to be bound by these Terms and by our{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          . If you don't agree, don't use the Service.
        </p>
      </LegalSection>

      <LegalSection id="service" title="2. What Aurum OS is">
        <p>
          Aurum OS is a career-acceleration platform for professionals entering luxury industries —
          superyachts, private aviation, ultra-prime real estate, and collector cars. The Service
          includes an AI mentor and tutor, a structured 30-day roadmap with AI-assisted task help,
          an academy of learning content, a content generation studio, a live intelligence feed, a
          progress and event calendar with reminders, and networking tools. Features vary by plan
          (see Section 5).
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="3. Eligibility">
        <p>
          You must be at least 18 years old and able to form a binding contract to use Aurum OS. The
          Service is intended for professional and business use. By registering, you confirm you
          meet these requirements.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="4. Your account">
        <ul>
          <li>
            You're responsible for the accuracy of the information you provide at signup and in
            onboarding.
          </li>
          <li>
            You're responsible for keeping your login credentials confidential and for all activity
            under your account.
          </li>
          <li>One account per person. Don't share credentials or let others use your account.</li>
          <li>
            Tell us immediately if you suspect unauthorized access —{" "}
            <a href="mailto:hello@aurumos.com" className="text-primary hover:underline">
              hello@aurumos.com
            </a>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="billing" title="5. Plans, billing, and cancellation">
        <p>
          Aurum OS offers a free plan ("Initiate") with limited usage, and a paid plan ("Operator")
          billed monthly. Prices are shown on our pricing page and may change with notice. Paid
          subscriptions are processed by our payment provider, Stripe — we don't store your card
          details.
        </p>
        <ul>
          <li>Subscriptions renew automatically each billing period until cancelled.</li>
          <li>
            You can cancel anytime from your account settings; you'll keep access through the end of
            the paid period.
          </li>
          <li>
            <strong>[Refund policy]</strong> — e.g. fees are non-refundable except where required by
            law. Confirm and state your actual policy here.
          </li>
          <li>
            Free-plan usage limits (message counts, generation credits, etc.) are described
            in-product and may change.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="acceptable-use" title="6. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>
            Use the Service for anything illegal, fraudulent, or that infringes someone else's
            rights.
          </li>
          <li>
            Attempt to reverse-engineer, scrape, or resell the Service or its underlying data.
          </li>
          <li>Circumvent usage limits, security measures, or access controls.</li>
          <li>
            Submit content that is abusive, discriminatory, or that attempts to misuse the AI
            features (e.g. to generate harmful or deceptive content).
          </li>
          <li>
            Impersonate another person or misrepresent your affiliation with any company or
            individual.
          </li>
        </ul>
        <p>We may suspend or terminate accounts that violate this section.</p>
      </LegalSection>

      <LegalSection id="content" title="7. Your content and AI-generated output">
        <p>
          You retain ownership of the content you submit (chat messages, profile details, network
          contacts, uploaded material). By submitting it, you grant Aurum OS a license to process it
          in order to operate and improve the Service, including sending it to the third-party AI
          providers described in our{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </p>
        <p>
          Content generated by Aurum OS's AI features (mentor replies, roadmap task help, studio
          content, academy material) is produced automatically and may contain errors, outdated
          information, or inaccuracies. It is provided for informational and productivity purposes
          only and is <strong>not</strong> professional, legal, financial, immigration, or
          investment advice, and is not a guarantee of any outcome (a job, a deal, a client, a
          specific view count, and so on). You're responsible for reviewing and verifying
          AI-generated output before relying on it or publishing it.
        </p>
      </LegalSection>

      <LegalSection id="third-party" title="8. Third-party services">
        <p>
          Aurum OS relies on third-party providers to operate: Supabase (database, authentication,
          storage), Stripe (payments), Resend (transactional email and reminders), and AI model
          providers including Google (Gemini) and Groq (used to power chat and content features).
          These providers process data on our behalf as described in our{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          . We aren't responsible for outages or issues originating from these third parties, but
          we'll work to resolve them.
        </p>
      </LegalSection>

      <LegalSection id="ip" title="9. Our intellectual property">
        <p>
          The Service, including its software, design, branding, and non-user-submitted content, is
          owned by Aurum OS and protected by intellectual property law. These Terms don't grant you
          any rights to our trademarks, logos, or brand assets beyond what's needed to use the
          Service normally.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="10. Termination">
        <p>
          You may stop using the Service and delete your account at any time from settings, or by
          emailing us. We may suspend or terminate your access if you violate these Terms, or for
          non-payment on a paid plan. On termination, your right to use the Service ends
          immediately; some data may be retained as described in our Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="11. Disclaimers and limitation of liability">
        <p>
          The Service is provided "as is" and "as available," without warranties of any kind,
          express or implied. We don't guarantee the Service will be uninterrupted, error-free, or
          that it will lead to any particular career or business outcome.
        </p>
        <p>
          To the maximum extent permitted by law, Aurum OS won't be liable for indirect, incidental,
          special, or consequential damages, or for lost profits, opportunities, or data, arising
          from your use of the Service. Our total liability for any claim relating to the Service is
          limited to the amount you paid us in the 12 months before the claim arose.{" "}
          <strong>
            [Confirm this limitation is enforceable in your governing jurisdiction — some
            consumer-protection regimes restrict liability caps.]
          </strong>
        </p>
      </LegalSection>

      <LegalSection id="indemnity" title="12. Indemnification">
        <p>
          You agree to indemnify and hold Aurum OS harmless from claims, damages, and expenses
          arising from your misuse of the Service or violation of these Terms.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="13. Changes to these terms">
        <p>
          We may update these Terms from time to time. If we make material changes, we'll notify you
          by email or an in-product notice before they take effect. Continuing to use the Service
          after changes take effect means you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection id="law" title="14. Governing law">
        <p>
          These Terms are governed by the laws of <strong>[governing jurisdiction]</strong>, without
          regard to conflict-of-law principles. Disputes will be resolved in the courts of{" "}
          <strong>[jurisdiction]</strong>, except where local consumer-protection law gives you the
          right to bring a claim in your own country of residence.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="15. Contact">
        <p>
          Questions about these Terms? Reach us at{" "}
          <a href="mailto:hello@aurumos.com" className="text-primary hover:underline">
            hello@aurumos.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

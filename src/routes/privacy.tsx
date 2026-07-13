import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection, LegalNote } from "@/components/aurum/LegalLayout";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="[date of publication]">
      <LegalNote>
        This is a working draft prepared to match Aurum OS's actual data practices. It has not been
        reviewed by a lawyer. Have qualified counsel review this before it governs real user data —
        especially the GDPR sections, since Aurum OS serves EU/UK users and fines for non-compliance
        are real.
      </LegalNote>

      <LegalSection id="overview" title="1. Overview">
        <p>
          This Privacy Policy explains what personal data Aurum OS collects, how we use it, who we
          share it with, and the rights you have over it. It applies to everyone who uses
          aurumos.com and the Aurum OS product.
        </p>
      </LegalSection>

      <LegalSection id="data-we-collect" title="2. Information we collect">
        <p>
          We collect information in three ways: what you give us, what the product creates as you
          use it, and basic technical data.
        </p>
        <ul>
          <li>
            <strong>Account data:</strong> name, email address, and password (stored securely by our
            authentication provider, Supabase — we never see your raw password).
          </li>
          <li>
            <strong>Onboarding and profile data:</strong> your target industry, experience level,
            and career ambitions, used to personalize the roadmap, academy, and mentor.
          </li>
          <li>
            <strong>Product activity:</strong> tasks and roadmap progress, calendar entries and
            reminders you set, academy progress, and network contacts you add.
          </li>
          <li>
            <strong>Content you create:</strong> messages you send to the AI mentor and tutor,
            prompts and drafts generated in the content studio, and any text or files you submit.
          </li>
          <li>
            <strong>Billing data:</strong> if you subscribe to a paid plan, payment is handled by
            Stripe. We receive confirmation of your subscription status, not your full card number.
          </li>
          <li>
            <strong>Technical data:</strong> IP address, browser and device type, and basic usage
            logs, collected automatically for security and reliability.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="how-we-use" title="3. How we use your information">
        <ul>
          <li>
            To provide, personalize, and maintain the Service (the mentor, roadmap, academy, studio,
            intelligence feed, and calendar).
          </li>
          <li>
            To send transactional and reminder emails you've requested (e.g. task reminders, account
            notices) via our email provider, Resend.
          </li>
          <li>To process payments and manage subscriptions via Stripe.</li>
          <li>To maintain security, prevent abuse, and enforce our Terms of Service.</li>
          <li>To understand product usage and improve the Service.</li>
          <li>To comply with legal obligations.</li>
        </ul>
        <p>We do not sell your personal data.</p>
      </LegalSection>

      <LegalSection id="ai-processing" title="4. How AI features process your data">
        <p>
          When you use the AI mentor, tutor, roadmap task help, or content studio, the text you
          submit is sent to third-party AI model providers — currently Google (Gemini) and/or Groq —
          to generate a response. These providers process your input to return the AI output and may
          retain it briefly for abuse-monitoring purposes under their own policies; we don't control
          their retention independently of what their terms specify.
        </p>
        <p>
          Please don't submit sensitive personal data (health information, government ID numbers,
          financial account details, etc.) in chat messages or prompts unless you're comfortable
          with it being processed by these providers to generate your response.
        </p>
      </LegalSection>

      <LegalSection id="legal-basis" title="5. Legal basis for processing (EU/UK users)">
        <p>If you're in the EU or UK, we process your data on these legal bases under GDPR:</p>
        <ul>
          <li>
            <strong>Contract:</strong> processing needed to provide the Service you signed up for.
          </li>
          <li>
            <strong>Legitimate interest:</strong> for security, fraud prevention, and improving the
            product.
          </li>
          <li>
            <strong>Consent:</strong> for optional communications you opt into (e.g. marketing
            emails), which you can withdraw at any time.
          </li>
          <li>
            <strong>Legal obligation:</strong> where we need to retain or disclose data to comply
            with the law.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="sharing" title="6. Who we share data with">
        <p>
          We share personal data only with the service providers needed to run Aurum OS, and only to
          the extent needed:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — database, authentication, and file storage.
          </li>
          <li>
            <strong>Stripe</strong> — payment processing and subscription management.
          </li>
          <li>
            <strong>Resend</strong> — transactional and reminder emails.
          </li>
          <li>
            <strong>Google (Gemini) and Groq</strong> — AI processing for chat and content
            generation, as described in Section 4.
          </li>
          <li>
            Legal authorities, if required by law or to protect our rights, users, or the public.
          </li>
          <li>
            A successor entity, if Aurum OS is involved in a merger, acquisition, or asset sale —
            you'd be notified.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="retention" title="7. How long we keep your data">
        <p>
          We keep your account and product data for as long as your account is active. If you delete
          your account, we delete or anonymize your personal data within{" "}
          <strong>[retention period, e.g. 30 days]</strong>, except where we're required to keep
          certain records for longer (for example, billing records for tax purposes).
        </p>
      </LegalSection>

      <LegalSection id="rights" title="8. Your rights">
        <p>Depending on where you live, you may have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate data.</li>
          <li>Delete your data ("right to be forgotten").</li>
          <li>Export your data in a portable format.</li>
          <li>Object to or restrict certain processing.</li>
          <li>Withdraw consent at any time, where processing is based on consent.</li>
        </ul>
        <p>
          To exercise any of these rights, email{" "}
          <a href="mailto:hello@aurumos.com" className="text-primary hover:underline">
            hello@aurumos.com
          </a>
          . EU/UK users also have the right to lodge a complaint with their local data protection
          authority.
        </p>
      </LegalSection>

      <LegalSection id="security" title="9. Security">
        <p>
          We rely on Supabase's managed Postgres infrastructure with row-level security, so your
          data is only accessible to your own account. Data is encrypted in transit. No system is
          completely secure, so while we take reasonable precautions, we can't guarantee absolute
          security.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="10. International data transfers">
        <p>
          Our service providers may process data outside your home country. Where that involves a
          transfer out of the EU/UK, we rely on appropriate safeguards (such as Standard Contractual
          Clauses) as required by GDPR.{" "}
          <strong>
            [Confirm the actual hosting regions used by Supabase/Stripe/Resend/AI providers for your
            account and state them here.]
          </strong>
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="11. Cookies and local storage">
        <p>
          Aurum OS uses essential browser storage to keep you signed in (an authentication session
          token) and to remember basic preferences. We don't currently use third-party advertising
          or tracking cookies.
        </p>
      </LegalSection>

      <LegalSection id="children" title="12. Children's privacy">
        <p>
          Aurum OS is intended for professional use by adults. We don't knowingly collect personal
          data from anyone under 18. If you believe a minor has provided us data, contact us and
          we'll delete it.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="13. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be communicated
          by email or an in-product notice before they take effect.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="14. Contact">
        <p>
          For any privacy question or request, contact{" "}
          <a href="mailto:hello@aurumos.com" className="text-primary hover:underline">
            hello@aurumos.com
          </a>
          .{" "}
          <strong>
            [Add a dedicated Data Protection Officer contact here if one is appointed.]
          </strong>
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

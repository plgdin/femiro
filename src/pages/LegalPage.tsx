export function LegalPage({ kind }: { kind: 'terms' | 'refund' | 'privacy' }) {
  const content = {
    terms: {
      title: 'Terms of Service',
      intro: 'These terms govern use of the Femiro Designs website and purchase of our products.',
      sections: [
        ['Orders', 'Orders are accepted only after payment is successfully verified. We may cancel an order if an item is unavailable, pricing is incorrect, or fraud is suspected.'],
        ['Products and pricing', 'Product details, availability, and prices may change. We make reasonable efforts to keep listings accurate.'],
        ['Payments', 'Payments are processed securely by Razorpay. Femiro does not store full card or UPI credentials.'],
        ['Account use', 'You must provide accurate account and delivery details and keep your login credentials private.'],
        ['Contact', 'For support, contact femirodesigns@gmail.com.']
      ]
    },
    refund: {
      title: 'Refund and Returns Policy',
      intro: 'We want every Femiro purchase to feel right. Contact us before returning an item.',
      sections: [
        ['Eligibility', 'Request a return within 7 days of delivery. Items must be unused, unwashed, unaltered, and returned with original tags and packaging.'],
        ['Non-returnable items', 'Customized, altered, worn, damaged, or hygiene-sensitive items may not be eligible for return.'],
        ['Inspection and refund', 'We inspect returned items before approval. Approved refunds go to the original payment method after inspection, less any disclosed non-refundable charges.'],
        ['Damaged or incorrect items', 'Send clear photos within 48 hours of delivery so we can arrange a replacement or refund.'],
        ['Contact', 'Start a request at femirodesigns@gmail.com with your order ID and issue details.']
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      intro: 'Femiro collects only the information needed to provide accounts, delivery, support, and secure payments.',
      sections: [
        ['Information we use', 'We may use your name, email, phone number, delivery address, order details, and support messages to fulfil orders and support you.'],
        ['Payments', 'Payment details are handled by Razorpay. We receive payment and transaction identifiers, not full payment credentials.'],
        ['Storage and access', 'Account, catalog, address, and order data are stored in Supabase with row-level access rules. Staff access is limited by role.'],
        ['Your choices', 'You may request correction or deletion of personal information, subject to legal and order-record requirements.'],
        ['Contact', 'For privacy requests, contact femirodesigns@gmail.com.']
      ]
    }
  }[kind]

  return (
    <main className="page-shell legal-page">
      <div className="page-heading">
        <p className="eyebrow">FEMIRO DESIGNS</p>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
      </div>
      <div className="legal-content">
        {content.sections.map(([heading, text]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            <p>{text}</p>
          </section>
        ))}
        <p className="legal-updated">Last updated: August 2026</p>
      </div>
    </main>
  )
}

export const metadata = {
  title: 'Terms of Service — FLEX',
  description: 'FLEX terms of service. Terms and conditions for using our gym laundry service.',
  openGraph: { title: 'Terms of Service — FLEX', url: 'https://www.flexlaundry.co.uk/terms' },
};

export default function TermsPage() {
  return (
    <section className="section-padding">
      <div className="container-narrow pt-16 md:pt-20">
        <span className="label-tag">Legal</span>
        <h1 className="heading-1 mt-3 mb-1">Terms of Service</h1>
        <p className="text-flex-muted text-[0.72rem] mb-8">Last updated: 1 April 2026</p>

        <div className="space-y-6 text-[0.88rem] text-flex-text leading-relaxed">
          <div>
            <h2 className="heading-3 mb-2">1. Agreement to Terms</h2>
            <p>These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you and FLEX Active Group Ltd (Company No. 12345678), trading as &ldquo;FLEX&rdquo; (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By creating a FLEX account, making a drop, or otherwise using the FLEX service, you agree to be bound by these Terms. If you do not agree, do not use our service.</p>
            <p className="mt-2">We may update these Terms from time to time. We will notify you of material changes at least 30 days in advance via email or WhatsApp. Your continued use of FLEX after changes take effect constitutes acceptance of the revised Terms.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">2. Service Description</h2>
            <p>FLEX provides a gym clothes laundry collection, cleaning, and return service operating through partner gym locations in London. The service works as follows:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>You sign up for a FLEX account and choose a pricing plan.</li>
              <li>You place your gym clothes in a numbered FLEX bag at a partner gym&apos;s reception.</li>
              <li>We collect bags from partner gyms on a regular schedule.</li>
              <li>Your clothes are professionally washed using sport-specific, fabric-safe detergent, with lights and darks separated, and performance fabrics air-dried.</li>
              <li>Clean, folded clothes are returned to your gym within 48 hours of collection.</li>
              <li>You receive WhatsApp notifications at each stage of the process.</li>
            </ul>
            <p className="mt-2">We aim to return all items within 48 hours, but this is a target and not a guarantee. Occasional delays may occur due to operational circumstances, public holidays, or gym closures. We will notify you via WhatsApp of any expected delays.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">3. Eligibility</h2>
            <p>To use FLEX, you must:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Be at least 18 years of age</li>
              <li>Be a member of, or have access to, a FLEX partner gym</li>
              <li>Provide a valid mobile phone number capable of receiving WhatsApp messages</li>
              <li>Provide a valid email address</li>
              <li>Provide a valid payment method (debit or credit card)</li>
            </ul>
            <p className="mt-2">You are responsible for ensuring that all information you provide is accurate and up to date. You must notify us promptly of any changes to your contact details or payment method.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">4. Plans and Pricing</h2>
            <p className="font-semibold mt-2 mb-1">4.1 Pay As You Go</p>
            <p>£5 per drop. No subscription or commitment required. Payment is charged at the time you submit a drop via the member portal or WhatsApp. Each drop covers one FLEX bag of gym clothes.</p>

            <p className="font-semibold mt-3 mb-1">4.2 Essential Plan</p>
            <p>£42 per month, billed automatically on a recurring monthly basis. Includes up to 12 drops per billing period at an effective rate of £3.50 per drop. Additional drops beyond the included 12 can be purchased as add-ons for £4 each.</p>

            <p className="font-semibold mt-3 mb-1">4.3 General Pricing Terms</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>All prices are in British Pounds (GBP) and include VAT where applicable.</li>
              <li>Unused drops do not roll over to the next billing period.</li>
              <li>We reserve the right to change our pricing with at least 30 days&apos; notice. Price changes will not affect your current billing period.</li>
              <li>All payments are processed securely by Stripe. We do not store your full payment card details.</li>
            </ul>
          </div>

          <div>
            <h2 className="heading-3 mb-2">5. Subscription Management</h2>
            <p className="font-semibold mt-2 mb-1">5.1 Cancellation</p>
            <p>You may cancel your Essential subscription at any time via the member portal at flexlaundry.co.uk/portal or by contacting us on WhatsApp. Upon cancellation, your subscription remains active until the end of your current billing period. No refunds are provided for partial months or unused drops within the current period.</p>

            <p className="font-semibold mt-3 mb-1">5.2 Pausing</p>
            <p>You may pause your Essential subscription via the member portal. During a pause, you will not be charged and cannot make drops. You may resume at any time. Paused subscriptions will automatically resume on the date you selected when pausing, and billing will restart from that date.</p>

            <p className="font-semibold mt-3 mb-1">5.3 Failed Payments</p>
            <p>If a recurring payment fails, we will notify you via WhatsApp and email. You will have 7 days to update your payment method. If payment is not resolved within this period, your subscription may be suspended until the outstanding amount is settled.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">6. Acceptable Items</h2>
            <p className="mb-2">Each FLEX bag should contain one workout&apos;s worth of gym clothes. The following items are accepted:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>T-shirts, tank tops, and vests</li>
              <li>Shorts and leggings</li>
              <li>Sports bras</li>
              <li>Socks and underwear</li>
              <li>Hoodies and joggers</li>
            </ul>
            <p className="mt-3 mb-2">The following items must <strong>not</strong> be included:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Shoes, trainers, or any footwear</li>
              <li>Swimwear</li>
              <li>Towels</li>
              <li>Delicate fabrics or formal clothing</li>
              <li>Items with excessive mud, paint, or other heavy soiling</li>
              <li>Non-clothing items (water bottles, electronics, valuables, etc.)</li>
            </ul>
            <p className="mt-2">FLEX is not responsible for damage to items that are not suitable for standard sports laundry washing. If prohibited items are found in your bag, we will return them unwashed and may contact you via WhatsApp.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">7. Drop and Pickup Process</h2>
            <p className="font-semibold mt-2 mb-1">7.1 Making a Drop</p>
            <p>To make a drop, place your gym clothes in a FLEX bag, note the bag number, and leave the bag at your gym&apos;s reception or designated FLEX drop-off point. You must register the drop via WhatsApp (by sending the bag number) or through the member portal. Drops should be made before 6pm for next-day collection.</p>

            <p className="font-semibold mt-3 mb-1">7.2 Pickup Window</p>
            <p>Once your clothes are ready, you will receive a WhatsApp notification. You have <strong>7 calendar days</strong> from the ready notification to collect your bag from the gym. We will send a reminder before your pickup window expires.</p>

            <p className="font-semibold mt-3 mb-1">7.3 Uncollected Items</p>
            <p>Items not collected within 7 days of the ready notification may, at our discretion, be donated to charity or disposed of. FLEX accepts no liability for items left beyond the 7-day pickup window. In exceptional circumstances, please contact us to arrange an extension.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">8. Care and Quality</h2>
            <p>We take reasonable care of your clothes throughout the laundry process. Our standard process involves:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Sorting items by colour (lights and darks separated)</li>
              <li>Washing with sport-specific, fabric-safe detergent at appropriate temperatures</li>
              <li>Air-drying performance fabrics to preserve elasticity and moisture-wicking properties</li>
              <li>Folding and returning items in your numbered FLEX bag</li>
            </ul>
            <p className="mt-2">While we strive to maintain the highest standards of care, we cannot guarantee that all stains will be removed or that repeated washing will not cause gradual wear to fabrics over time (this is normal for any laundering process).</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">9. Liability for Loss or Damage</h2>
            <p className="font-semibold mt-2 mb-1">9.1 Reporting Issues</p>
            <p>If any item is lost, damaged, or returned in an unsatisfactory condition, you must report the issue within <strong>48 hours of collecting your bag</strong> via WhatsApp or the member portal. We will investigate all reports promptly.</p>

            <p className="font-semibold mt-3 mb-1">9.2 Compensation</p>
            <p>Where we are at fault, we will offer fair compensation. Our liability for any single item is capped at <strong>£50</strong>. Our total liability for any single drop (one bag) is capped at <strong>£200</strong>. Compensation may take the form of a refund, account credit, or replacement at our discretion.</p>

            <p className="font-semibold mt-3 mb-1">9.3 Exclusions</p>
            <p>We are not liable for:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Damage to items that are not suitable for standard machine washing</li>
              <li>Pre-existing damage, wear, or defects</li>
              <li>Items with care labels indicating specialist cleaning requirements</li>
              <li>Items left in pockets (please empty all pockets before dropping)</li>
              <li>Loss or damage to prohibited items placed in the bag</li>
              <li>Items not collected within the 7-day pickup window</li>
              <li>Normal wear and tear from the laundering process</li>
            </ul>
          </div>

          <div>
            <h2 className="heading-3 mb-2">10. Your Responsibilities</h2>
            <p>As a FLEX member, you agree to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Only include acceptable items as described in Section 6</li>
              <li>Empty all pockets before placing items in the bag</li>
              <li>Provide accurate bag numbers when registering a drop</li>
              <li>Collect your clean clothes within the 7-day pickup window</li>
              <li>Treat gym staff and FLEX bags with respect</li>
              <li>Not attempt to include more items than the FLEX bag can reasonably hold</li>
              <li>Keep your account details and payment method up to date</li>
            </ul>
          </div>

          <div>
            <h2 className="heading-3 mb-2">11. Intellectual Property</h2>
            <p>The FLEX name, logo, website design, and all associated content are the intellectual property of FLEX Active Group Ltd. You may not reproduce, distribute, or create derivative works from our content without prior written permission.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">12. Service Availability</h2>
            <p>FLEX is available only at designated partner gym locations. We may add or remove partner gyms at any time. If your gym is removed from the FLEX network, we will provide at least 14 days&apos; notice and assist you with any transition.</p>
            <p className="mt-2">We may temporarily suspend the service for maintenance, operational reasons, or circumstances beyond our control (including but not limited to severe weather, public health emergencies, or partner gym closures). We will provide as much notice as reasonably possible.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">13. Termination</h2>
            <p>We reserve the right to suspend or terminate your account if you:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Breach these Terms</li>
              <li>Repeatedly include prohibited items in your bag</li>
              <li>Fail to collect items within the pickup window on multiple occasions</li>
              <li>Engage in abusive or threatening behaviour towards our staff or gym partners</li>
              <li>Fail to resolve outstanding payment issues</li>
            </ul>
            <p className="mt-2">If we terminate your account, any remaining subscription period will be refunded on a pro-rata basis, unless termination is due to a material breach of these Terms.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">14. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Our total liability to you in any 12-month period shall not exceed the total fees you paid to FLEX during that period.</li>
              <li>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</li>
              <li>We shall not be liable for any loss of profit, revenue, data, or business opportunity.</li>
            </ul>
            <p className="mt-2">Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be excluded or limited by applicable law.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">15. Dispute Resolution</h2>
            <p>If you have a complaint or dispute, please contact us first at hello@flexlaundry.co.uk. We will endeavour to resolve all complaints within 14 days. If we cannot resolve a dispute to your satisfaction, you may refer the matter to an alternative dispute resolution (ADR) provider or pursue your statutory rights through the courts.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">16. Governing Law and Jurisdiction</h2>
            <p>These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising from or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales. Nothing in these Terms affects your statutory rights as a consumer.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">17. Severability</h2>
            <p>If any provision of these Terms is found to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">18. Contact</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <ul className="list-none mt-2 space-y-1">
              <li><strong>Email:</strong> hello@flexlaundry.co.uk</li>
              <li><strong>WhatsApp:</strong> +44 7366 907286</li>
              <li><strong>Post:</strong> FLEX Active Group Ltd, London, United Kingdom</li>
              <li><strong>Company Number:</strong> 12345678 (registered in England &amp; Wales)</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

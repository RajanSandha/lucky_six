
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">Terms of Service</CardTitle>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </CardHeader>
        <CardContent className="space-y-6 prose prose-lg max-w-none">
          <p>
            Welcome to Lucky Six! These Terms of Service ("Terms") govern your use of the Lucky Six mobile application and website (collectively, the "Service"), operated by us. By accessing or using our Service, you agree to be bound by these Terms.
          </p>

          <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 rounded-md">
            <p className="font-bold">Disclaimer:</p>
            <p className="text-sm">The following terms are a template and do not constitute legal advice. It is highly recommended that you consult with a qualified legal professional to ensure full compliance with all applicable Indian laws and regulations.</p>
          </div>

          <section>
            <h2 className="font-headline text-2xl">1. Nature of the Service</h2>
            <p>
              Lucky Six is a promotional platform that offers users the chance to participate in prize draws. The Service is designed for entertainment purposes. We are not a betting or gambling company. The outcome of each draw is determined by a random selection process, ensuring fairness and transparency.
            </p>
          </section>

          <section>
            <h2 className="font-headline text-2xl">2. Eligibility</h2>
            <p>
              To use our Service, you must be at least 18 years old and a resident of India. By using the Service, you represent and warrant that you meet these eligibility requirements.
            </p>
          </section>

          <section>
            <h2 className="font-headline text-2xl">3. How Prize Draws Work</h2>
            <ul className="list-disc pl-6">
              <li>Users can acquire tickets for draws either by purchasing them or through promotional activities such as referrals.</li>
              <li>Each ticket has a unique number for a specific draw.</li>
              <li>Winners are selected through a systematic, computer-operated random process in multiple rounds.</li>
              <li>The results of the draws are final and binding.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline text-2xl">4. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account information, including your phone number and OTP verification process. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="font-headline text-2xl">5. User Conduct</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6">
              <li>Engage in any activity that is illegal, fraudulent, or harmful.</li>
              <li>Use any automated means (e.g., bots, scripts) to acquire tickets or otherwise interact with the Service.</li>
              <li>Create multiple accounts for a single individual to gain an unfair advantage.</li>
              <li>Post or transmit any content that is offensive, obscene, or otherwise objectionable.</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts found to be in violation of these terms.</p>
          </section>
          
          <section>
            <h2 className="font-headline text-2xl">6. Intellectual Property</h2>
            <p>
                The Service and its original content, features, and functionality are and will remain the exclusive property of Lucky Six and its licensors. The Service is protected by copyright, trademark, and other laws of India.
            </p>
          </section>

          <section>
            <h2 className="font-headline text-2xl">7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, Lucky Six shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>
          
           <section>
            <h2 className="font-headline text-2xl">8. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from these Terms will be subject to the exclusive jurisdiction of the courts located in [Your City/State, e.g., Mumbai, Maharashtra].
            </p>
          </section>

          <section>
            <h2 className="font-headline text-2xl">9. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms of Service on this page. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
            </p>
          </section>
          
           <section>
            <h2 className="font-headline text-2xl">10. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at [Your Contact Email/Page].
            </p>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}

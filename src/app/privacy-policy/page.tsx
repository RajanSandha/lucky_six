
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">Privacy Policy</CardTitle>
           <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </CardHeader>
        <CardContent className="space-y-6 prose prose-lg max-w-none">
          <p>
            Lucky Six ("us", "we", or "our") operates the Lucky Six mobile application and website (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
          </p>

           <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 rounded-md">
            <p className="font-bold">Disclaimer:</p>
            <p className="text-sm">The following policy is a template and does not constitute legal advice. It is highly recommended that you consult with a qualified legal professional to ensure full compliance with Indian data protection laws, such as the Digital Personal Data Protection Act (DPDPA), 2023.</p>
          </div>

          <section>
            <h2 className="font-headline text-2xl">1. Information Collection and Use</h2>
            <p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>
            <h3 className="font-headline text-xl">Types of Data Collected</h3>
            <h4 className="font-semibold">Personal Data</h4>
            <p>While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:</p>
            <ul className="list-disc pl-6">
              <li>Full Name</li>
              <li>Phone Number</li>
              <li>Shipping Address (only collected from winners to deliver prizes)</li>
            </ul>
            <h4 className="font-semibold">Usage Data</h4>
            <p>We may also collect information that your browser sends whenever you visit our Service or when you access the Service by or through a mobile device ("Usage Data"). This may include information such as your device's IP address, browser type, pages of our Service that you visit, the time and date of your visit, and other diagnostic data.</p>
          </section>

          <section>
            <h2 className="font-headline text-2xl">2. Use of Data</h2>
            <p>Lucky Six uses the collected data for various purposes:</p>
            <ul className="list-disc pl-6">
              <li>To provide and maintain the Service</li>
              <li>To manage your account and registration</li>
              <li>To facilitate participation in draws</li>
              <li>To contact winners and arrange for prize delivery</li>
              <li>To provide customer support</li>
              <li>To monitor the usage of the Service and prevent fraudulent activity</li>
              <li>To comply with legal obligations under Indian law</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline text-2xl">3. Data Sharing and Disclosure</h2>
            <p>We do not sell or rent your Personal Data to third parties. We may disclose your Personal Data in the good faith belief that such action is necessary to:</p>
             <ul className="list-disc pl-6">
              <li>To comply with a legal obligation</li>
              <li>To protect and defend the rights or property of Lucky Six</li>
              <li>To prevent or investigate possible wrongdoing in connection with the Service</li>
              <li>To protect the personal safety of users of the Service or the public</li>
            </ul>
             <p>Winners' names may be published as part of our promotional activities.</p>
          </section>

          <section>
            <h2 className="font-headline text-2xl">4. Data Retention and Security</h2>
            <p>We will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. The security of your data is important to us, and we use commercially acceptable means to protect your Personal Data, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure.</p>
          </section>
          
           <section>
            <h2 className="font-headline text-2xl">5. Your Data Protection Rights</h2>
            <p>Under Indian law, you have certain data protection rights. You have the right to access, update, or delete the information we have on you. You can do this by contacting us. You also have the right to withdraw your consent at any time where Lucky Six relied on your consent to process your personal information.</p>
          </section>

          <section>
            <h2 className="font-headline text-2xl">6. Children's Privacy</h2>
            <p>Our Service does not address anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your Children has provided us with Personal Data, please contact us.</p>
          </section>
          
          <section>
            <h2 className="font-headline text-2xl">7. Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
          </section>

          <section>
            <h2 className="font-headline text-2xl">8. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at [Your Contact Email/Page].</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

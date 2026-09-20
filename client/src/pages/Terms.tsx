import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/layout/Footer";

export default function Terms() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container px-4 py-8 mx-auto flex-grow">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: April 23, {currentYear}</p>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <p>
              These Terms of Service ("Terms") govern your access to and use of savyfunds.com and its related services (collectively, the "Service").
              Please read these Terms carefully, and contact us if you have any questions.
            </p>

            <h2>Agreement to Terms</h2>
            <p>
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, 
              you may not access the Service.
            </p>

            <h2>Educational Content Only</h2>
            <p>
              <strong>Savyfunds provides educational content only, not financial or legal advice.</strong> The information provided 
              through our Service is for general educational and informational purposes only and is not intended to be a substitute 
              for professional financial, legal, or tax advice. 
            </p>
            <p>
              Before making any financial decisions, you should consult with qualified professionals, such as financial advisors, 
              accountants, attorneys, or other professionals who can provide advice tailored to your specific circumstances.
            </p>

            <h2>Disclaimer of Liability</h2>
            <p>
              <strong>We are not liable for decisions based on our content.</strong> Your use of any information or materials 
              on this Service is entirely at your own risk. It is your responsibility to evaluate the accuracy, completeness, 
              or usefulness of any information or content available through the Service.
            </p>
            <p>
              In no event will savyfunds or its operators, affiliates, suppliers, or licensors be liable for any damages 
              (including, without limitation, damages for loss of data or profit, or due to business interruption) arising 
              out of the use or inability to use the materials on the Service, even if savyfunds or its representatives 
              have been notified orally or in writing of the possibility of such damage.
            </p>

            <h2>Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
              Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>
            <p>
              You are responsible for safeguarding the password that you use to access the Service and for any activities or 
              actions under your password. You agree not to disclose your password to any third party.
            </p>

            <h2>Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive property of savyfunds. 
              The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
            </p>
            <p>
              Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of savyfunds.
            </p>

            <h2>Links To Other Web Sites</h2>
            <p>
              Our Service may contain links to third-party websites or services that are not owned or controlled by savyfunds.
            </p>
            <p>
              Savyfunds has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any 
              third-party websites or services. You further acknowledge and agree that savyfunds shall not be responsible or liable, 
              directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or 
              reliance on any such content, goods, or services available on or through any such websites or services.
            </p>

            <h2>Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, 
              including without limitation if you breach the Terms.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, 
              you may simply discontinue using the Service.
            </p>

            <h2>Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the United States, without regard 
              to its conflict of law provisions.
            </p>
            <p>
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. 
              If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of 
              these Terms will remain in effect.
            </p>

            <h2>Changes</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a 
              material change will be determined at our sole discretion.
            </p>
            <p>
              By continuing to access or use our Service after those revisions become effective, you agree to be bound by the 
              revised terms. If you do not agree to the new terms, please stop using the Service.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at legal@savyfunds.com.
            </p>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button variant="outline" asChild>
              <Link href="/">Return to Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/privacy-policy">Privacy Policy</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
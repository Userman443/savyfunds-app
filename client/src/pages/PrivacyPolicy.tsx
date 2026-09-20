import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/layout/Footer";

export default function PrivacyPolicy() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container px-4 py-8 mx-auto flex-grow">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: April 23, {currentYear}</p>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <p>
              At savyfunds, we take your privacy seriously. This Privacy Policy describes how your personal information is collected, 
              used, and shared when you visit or make use of our services at savyfunds.com ("the Site").
            </p>

            <h2>Information We Collect</h2>
            <p>
              When you visit the Site, we automatically collect certain information about your device, including 
              information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.
            </p>
            <p>
              Additionally, as you browse the Site, we collect information about the individual web pages that you view, 
              what websites or search terms referred you to the Site, and information about how you interact with the Site.
              We refer to this automatically-collected information as "Device Information."
            </p>

            <h3>Information You Provide</h3>
            <p>
              When you create an account or fill out forms on our site, we may collect certain personal information from you, including:
            </p>
            <ul>
              <li>Your name and username</li>
              <li>Email address</li>
              <li>Financial goals and preferences</li>
              <li>Progress tracking data</li>
              <li>Information about your financial knowledge and interests</li>
            </ul>

            <h2>Google reCAPTCHA</h2>
            <p>
              We use Google reCAPTCHA v3 on our site to protect our service from spam and abuse. reCAPTCHA works by 
              collecting hardware and software information, such as device and application data, and sending it to Google 
              for analysis. This information includes:
            </p>
            <ul>
              <li>IP address</li>
              <li>How long you are on the website</li>
              <li>Your mouse movements while on the page</li>
              <li>Browser information</li>
              <li>Cookies placed by Google</li>
              <li>Other information Google may use to identify abusive traffic</li>
            </ul>
            <p>
              By using our service, you acknowledge and agree that the data collected during the reCAPTCHA verification 
              process is subject to Google's <a 
                href="https://policies.google.com/privacy" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </a> and <a 
                href="https://policies.google.com/terms" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Terms of Service
              </a>.
            </p>

            <h2>How We Use Your Information</h2>
            <p>
              We use the information that we collect about you to help us screen for potential risk and fraud, 
              and more generally to improve and optimize our Site. We also use your personal information to:
            </p>
            <ul>
              <li>Provide and personalize our services</li>
              <li>Track your progress and achievements</li>
              <li>Respond to your questions and comments</li>
              <li>Send important notices about changes to our terms or policies</li>
              <li>Improve our platform and educational content</li>
            </ul>

            <h2>Sharing Your Information</h2>
            <p>
              We do not sell or rent your personal information to third parties. We may share your Personal Information with 
              service providers to help us operate our business and the Site or to administer activities on our behalf, such as 
              sending emails, analyzing data, or providing customer service.
            </p>

            <h2>Cookies</h2>
            <p>
              Cookies are files with a small amount of data that are commonly used as anonymous unique identifiers. These 
              are sent to your browser from the websites that you visit and are stored on your device's internal memory.
            </p>
            <p>
              We use cookies to help us remember and process items in your learning progress, understand and save your 
              preferences for future visits, and compile aggregate data about site traffic and site interactions.
            </p>

            <h3>Your Cookie Choices</h3>
            <p>
              You can choose to have your computer warn you each time a cookie is being sent, or you can choose to turn off 
              all cookies through your browser settings. Since each browser is different, look at your browser's Help Menu to 
              learn the correct way to modify your cookies.
            </p>

            <h2>Data Retention</h2>
            <p>
              We will maintain your information for our records unless and until you ask us to delete this information.
            </p>

            <h2>Your Rights</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, such as:
            </p>
            <ul>
              <li>The right to access the personal information we have about you</li>
              <li>The right to request correction or deletion of your personal information</li>
              <li>The right to object to certain processing activities</li>
              <li>The right to data portability</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at privacy@savyfunds.com.
            </p>

            <h2>Changes</h2>
            <p>
              We may update this privacy policy from time to time in order to reflect, for example, changes to our practices 
              or for other operational, legal, or regulatory reasons. Any changes will be posted on this page with an updated 
              revision date.
            </p>

            <h2>Contact Us</h2>
            <p>
              For more information about our privacy practices, if you have questions, or if you would like to make a complaint, 
              please contact us by e-mail at privacy@savyfunds.com.
            </p>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button variant="outline" asChild>
              <Link href="/">Return to Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/terms">Terms of Service</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
import { useState } from "react";
import { Mail, Phone, Instagram, Twitter, Send, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HelpButton from "@/components/ui/help-button";
import { useQuery } from "@tanstack/react-query";

type User = {
  id: number;
  username: string;
  displayName?: string;
  level: number;
  isPremium?: boolean;
};

const Contact = () => {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    type: "general"
  });

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Create mailto link with form data
    const subject = formData.subject || `${formData.type === 'partnership' ? 'Partnership Inquiry' : 'General Inquiry'} from ${formData.name}`;
    const body = `Name: ${formData.name}\nEmail: ${formData.email}\nType: ${formData.type}\n\nMessage:\n${formData.message}`;
    
    const mailtoLink = `mailto:partnerships@savyfunds.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoLink;
    
    toast({
      title: "Opening email client",
      description: "Your default email application will open with the message pre-filled.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar 
        user={user ? {
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          level: user.level,
          isPremium: user.isPremium || false,
        } : null}
      />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-primary">
            Get in Touch with savyfunds<span className="align-super text-sm">™</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're on a mission to make financial literacy a universal right for young adults worldwide. 
            Whether you're seeking to master financial concepts or ready to partner with us to empower 
            the next generation, we'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Send className="h-6 w-6 text-primary" />
                Send us a Message
              </CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Inquiry Type</Label>
                  <select
                    id="type"
                    className="w-full p-2 border border-border rounded-md bg-background"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="general">General Question</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="media">Media & Press</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject (Optional)</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Tell us more about your inquiry..."
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Direct Contact */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Direct Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a 
                      href="mailto:partnerships@savyfunds.com" 
                      className="text-primary hover:underline"
                    >
                      partnerships@savyfunds.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-muted-foreground">We typically respond within 24-48 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Connect With Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Instagram</p>
                    <a 
                      href="https://instagram.com/savyfunds" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      @savyfunds
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Twitter className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">X (Twitter)</p>
                    <a 
                      href="https://x.com/savyfunds" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      @savyfunds
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Partnership CTA */}
            <Card className="shadow-lg bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Partner With Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Help us keep financial education free and accessible. Partner with us to pioneer 
                  a generation with financial literacy in this AI and digital age.
                </p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => {
                    const mailtoLink = "mailto:partnerships@savyfunds.com?subject=Partner%20with%20Savyfunds%20to%20Support%20Financial%20Literacy";
                    window.location.href = mailtoLink;
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Join Our Mission
                </Button>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Quick Response Time</h3>
                  <p className="text-sm text-muted-foreground">
                    We typically respond to all inquiries within 24-48 hours during business days.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-semibold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What is savyfunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  savyfunds is a comprehensive financial literacy platform designed specifically for young adults. 
                  We provide personalized learning paths, budgeting tools, and community support to help you 
                  build strong financial foundations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is savyfunds really free?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Our core features including budgeting tools, educational content, and financial breakdowns 
                  are completely free. We believe financial education should be accessible to everyone.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How can I partner with savyfunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We're always looking for partners who share our mission. Whether you're an educational institution, 
                  financial services company, or organization focused on youth development, reach out to discuss 
                  collaboration opportunities.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer customer support?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely! Our support team is available to help with any questions or technical issues. 
                  You can reach us through this contact form or directly via email.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      <HelpButton />
    </div>
  );
};

export default Contact;
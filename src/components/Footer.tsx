import { Facebook, Instagram, Mail, MapPin, Phone, MessageCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-foreground">Sto4ages</h3>
            <p className="text-sm text-muted-foreground">
              Safe, Simple & Affordable Storage for Students
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Contact</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Cape Town, South Africa</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+27 83 331 9780</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+27 63 722 1745</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>sto4agesnow@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info.sto4ages@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Quick Links</h4>
            <div className="space-y-1 text-sm">
              <a 
                href="https://sto4ages.co.za/terms" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms and Conditions
              </a>
              <br />
              <a 
                href="https://sto4ages.co.za/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
            </div>
          </div>

          {/* Follow Us */}
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Follow Us</h4>
            <div className="flex gap-3">
              <a 
                href="https://www.facebook.com/share/1DVvbczFQD/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/sto4agesnowbru/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://tiktok.com/@sto4agesnowbru" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="TikTok"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="border-t mt-6 pt-6 text-center text-sm text-muted-foreground">
          <div>
            © 2025 Sto4ages. All rights reserved.
          </div>
          <div className="mt-2">
            Website designed by{' '}
            <a 
              href="https://robq.online" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-blue-600 transition-colors duration-200"
            >
              RobQTech Designs
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

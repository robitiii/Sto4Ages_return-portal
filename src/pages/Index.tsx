import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Shield, Truck, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Index() {
  const steps = [
    {
      icon: Truck,
      number: '1',
      title: 'We Collect',
      description: 'We collect your parcels at your campus pickup point at a time convenient for you.',
    },
    {
      icon: Shield,
      number: '2',
      title: 'We Store',
      description: 'We store them securely in our climate-controlled facility for the chosen duration.',
    },
    {
      icon: Package,
      number: '3',
      title: 'We Return',
      description: 'We return them to your campus when you\'re back, hassle-free and on time.',
    },
  ];

  const features = [
    'Free Platinum package for all students',
    'Secure climate-controlled storage',
    'Convenient campus pickup & delivery',
    'Real-time booking tracking',
    'Flexible package upgrades',
    'No hidden fees',
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-hero py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
              Safe, Simple & Affordable
              <br />
              <span className="text-secondary">Storage for Students</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
              Store your belongings securely while you're on vacation. We handle the collection,
              storage, and delivery — so you can focus on what matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="hero" asChild>
                <Link to="/auth">
                  Book Storage Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Three simple steps to stress-free storage
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <Card
                key={step.title}
                className="text-center border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Students Choose
                <br />
                <span className="text-primary">Sto4ages</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                We understand student life. That's why we've designed our service to be
                affordable, flexible, and completely hassle-free.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="animate-scale-in overflow-hidden">
              <CardContent className="p-0">
                <div className="gradient-hero p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary-foreground mb-2">
                    Start Free Today
                  </h3>
                  <p className="text-primary-foreground/80 mb-6">
                    Every student gets a free Platinum package
                  </p>
                  <Button size="lg" variant="hero" asChild className="w-full">
                    <Link to="/auth">
                      Create Free Account
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto text-center gradient-hero border-0 animate-fade-in">
            <CardContent className="py-12 px-8">
              <Package className="w-16 h-16 text-secondary mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-primary-foreground mb-4">
                Ready to Store Your Belongings?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
                Join thousands of students who trust Sto4ages with their belongings.
                Sign up now and book your first collection.
              </p>
              <Button size="xl" variant="hero" asChild>
                <Link to="/auth">
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Sto4ages. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

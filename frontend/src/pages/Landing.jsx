import { Link } from 'react-router-dom';
import { Phone, CheckCircle, Shield, Headphones, ArrowRight, Sparkles } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors">
      {/* Navigation */}
      <nav className="topbar sticky top-0 z-40">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-primary-600 flex items-center justify-center rounded-sm transition-transform duration-150 group-hover:scale-105">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                Farmer Assistant
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="btn-ghost"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="content-canvas py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-sm text-sm text-primary-700 dark:text-primary-400 mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Agricultural Support
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-neutral-900 dark:text-white mb-6 tracking-tight text-balance">
            Your Agricultural Assistant
            <br />
            <span className="text-primary-600 dark:text-primary-400">Available 24/7</span>
          </h1>
          
          <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-10 max-w-2xl mx-auto">
            Get instant answers to all your farming queries through voice calls powered by AI. 
            No more waiting, no more confusion — just ask and get expert guidance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="btn-primary px-8 py-3.5 text-base group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="btn-secondary px-8 py-3.5 text-base"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Headphones,
              title: 'Voice-Based Queries',
              description: 'Simply speak your questions in your preferred language and get instant voice responses.',
              delay: 'stagger-1'
            },
            {
              icon: CheckCircle,
              title: 'AI-Powered Answers',
              description: 'Get accurate agricultural advice powered by advanced AI trained on farming knowledge.',
              delay: 'stagger-2'
            },
            {
              icon: Shield,
              title: 'Secure & Private',
              description: 'Your conversations are encrypted and secure. Your privacy is our top priority.',
              delay: 'stagger-3'
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className={`card card-hover p-8 animate-fade-in-up ${feature.delay}`}
            >
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-sm flex items-center justify-center mb-5">
                <feature.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-32">
          <div className="card p-12 animate-fade-in">
            <h2 className="text-2xl font-semibold text-center text-neutral-900 dark:text-white mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'Register', description: 'Create your free account in seconds' },
                { step: '02', title: 'Call', description: 'Start a voice call from dashboard' },
                { step: '03', title: 'Ask', description: 'Speak your farming questions' },
                { step: '04', title: 'Get Answers', description: 'Receive expert guidance instantly' }
              ].map((item, index) => (
                <div key={index} className="text-center group">
                  <div className="w-14 h-14 bg-primary-600 rounded-sm flex items-center justify-center mx-auto mb-4 transition-transform duration-200 group-hover:scale-105">
                    <span className="text-sm font-semibold text-white">{item.step}</span>
                  </div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">{item.title}</h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center">
          <div className="inline-block gradient-border rounded-sm p-12">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
              Ready to transform your farming?
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8">
              Join thousands of farmers already using AI-powered assistance.
            </p>
            <Link
              to="/register"
              className="btn-primary px-8 py-3"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 flex items-center justify-center rounded-sm">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-neutral-900 dark:text-white">
                Farmer Assistant
              </span>
            </div>
            <p className="text-sm text-neutral-500">
              © 2026 Farmer Assistant. Empowering farmers with technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

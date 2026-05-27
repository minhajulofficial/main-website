"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faGlobe,
  faHome,
  faStar,
  faTags,
  faShoppingCart,
  faEnvelope,
  faRocket,
  faGift,
  faPlay,
  faServer,
  faCloud,
  faSearch,
  faCheck,
  faBolt,
  faCogs,
  faShieldAlt,
  faUsers,
  faCog,
  faQuestion,
  faBook,
  faComments,
  faFileContract,
  faCookie,
  faInfo,
  faClock,
  faHeadset,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookF,
  faTwitter,
  faLinkedinIn,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";
import { getEnabledTlds } from "@/lib/domains/registry";

// Add all icons to the library
library.add(
  faGlobe, faHome, faStar, faTags, faShoppingCart, faEnvelope, faRocket,
  faGift, faPlay, faServer, faCloud, faSearch, faCheck, faBolt, faCogs,
  faShieldAlt, faUsers, faCog, faQuestion, faBook, faComments, faFileContract,
  faCookie, faInfo, faClock, faHeadset, faPaperPlane,
  faFacebookF, faTwitter, faLinkedinIn, faGithub
);

const TLD_OPTIONS = getEnabledTlds().map((tld) => ({
  id: tld.id,
  name: `.${tld.name}`,
}));

function smoothScrollTo(target: string, offset = 80) {
  if (typeof window === "undefined") return;
  const element = document.getElementById(target);
  if (element) {
    window.scrollTo({ top: element.offsetTop - offset, behavior: "smooth" });
  }
}

// Navigation Component
function Navigation() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-lg" data-aos="fade-down">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-[#3b82f6] text-2xl font-bold flex items-center">
            <FontAwesomeIcon icon={faGlobe} className="mr-3 text-3xl" />
            SITES.BD
          </Link>
          <div className="hidden md:flex space-x-8">
            <a href="#home" className="text-gray-700 hover:text-[#3b82f6] transition-colors duration-300 font-medium"
               onClick={(e) => { e.preventDefault(); smoothScrollTo("home"); }}>
              <FontAwesomeIcon icon={faHome} className="mr-2" /> Home
            </a>
            <a href="#features" className="text-gray-700 hover:text-[#3b82f6] transition-colors duration-300 font-medium"
               onClick={(e) => { e.preventDefault(); smoothScrollTo("features"); }}>
              <FontAwesomeIcon icon={faStar} className="mr-2" /> Features
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-[#3b82f6] transition-colors duration-300 font-medium"
               onClick={(e) => { e.preventDefault(); smoothScrollTo("pricing"); }}>
              <FontAwesomeIcon icon={faTags} className="mr-2" /> Pricing
            </a>
            <a href="#order" className="text-gray-700 hover:text-[#3b82f6] transition-colors duration-300 font-medium"
               onClick={(e) => { e.preventDefault(); smoothScrollTo("order"); }}>
              <FontAwesomeIcon icon={faShoppingCart} className="mr-2" /> Order
            </a>
            <a href="#contact" className="text-gray-700 hover:text-[#3b82f6] transition-colors duration-300 font-medium"
               onClick={(e) => { e.preventDefault(); smoothScrollTo("contact"); }}>
              <FontAwesomeIcon icon={faEnvelope} className="mr-2" /> Contact
            </a>
          </div>
          <Link href="/login" className="primary-gradient text-white px-4 py-2 rounded-full font-semibold hover-lift pulse-glow">
            <FontAwesomeIcon icon={faRocket} className="mr-2" /> Get
          </Link>
        </div>
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section id="home" className="min-h-screen primary-gradient flex items-center justify-center relative overflow-hidden pt-20">
      <div className="absolute top-32 left-10 text-white text-5xl opacity-20 floating-icon">
        <FontAwesomeIcon icon={faGlobe} />
      </div>
      <div className="absolute top-40 right-20 text-white text-4xl opacity-20 floating-icon" style={{ animationDelay: "1s" }}>
        <FontAwesomeIcon icon={faServer} />
      </div>
      <div className="absolute bottom-32 left-20 text-white text-6xl opacity-20 floating-icon" style={{ animationDelay: "2s" }}>
        <FontAwesomeIcon icon={faCloud} />
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-7xl font-bold text-white mb-3" data-aos="fade-up" data-aos-delay="100">
            Free SubDomain Provider
          </h1>
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-3 typing-animation" data-aos="fade-up" data-aos-delay="100">
            SITES.BD
          </h2>
          <p className="text-xl md:text-2xl text-white mb-2 leading-relaxed opacity-90" data-aos="fade-up" data-aos-delay="300">
            Get your <strong>FREE subdomain</strong> instantly! Connect to any hosting, use with Blogger, and start your online journey with zero cost and instant activation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center" data-aos="fade-up" data-aos-delay="400">
            <button onClick={() => smoothScrollTo("order")} className="bg-white text-[#3b82f6] px-8 py-4 rounded-full text-xl font-bold hover-lift shadow-2xl">
              <FontAwesomeIcon icon={faGift} className="mr-3" /> Get Free Subdomain
            </button>
            <button onClick={() => smoothScrollTo("features")} className="glass-effect text-white px-8 py-4 rounded-full text-xl font-bold hover-lift">
              <FontAwesomeIcon icon={faPlay} className="mr-3" /> See Features
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6" data-aos="fade-up" data-aos-delay="500">
            <div className="glass-effect rounded-xl p-6">
              <div className="text-3xl font-bold text-white mb-2">100%</div>
              <div className="text-white opacity-80">Free Forever</div>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="text-3xl font-bold text-white mb-2">Instant</div>
              <div className="text-white opacity-80">Activation</div>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-white opacity-80">DNS Updates</div>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="text-3xl font-bold text-white mb-2">Any</div>
              <div className="text-white opacity-80">Hosting</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Domain Check Section
function DomainCheckSection() {
  const [subdomain, setSubdomain] = useState("");
  const defaultTld = useMemo(() => TLD_OPTIONS[0], []);
  const [selectedTld, setSelectedTld] = useState(defaultTld);

  const handleCheck = () => {
    if (!subdomain.trim()) return;
    window.location.href = `/check?q=${encodeURIComponent(subdomain)}&tld=${encodeURIComponent(selectedTld.name)}`;
  };

  return (
    <section id="order" className="py-24 bg-blue-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-6" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">Check Your Domain Name</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Instantly check if your desired subdomain is available</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div data-aos="fade-up" data-aos-delay="100">
            <div className="space-y-6">
              <div className="flex items-center bg-gray-50 rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  onKeyPress={(e) => { if (e.key === "Enter") handleCheck(); }}
                  placeholder="Enter Your Domain Name"
                  className="w-2/5 text-lg font-medium bg-transparent border-none px-4 py-3 focus:outline-none"
                />
                <select
                  value={selectedTld.id}
                  onChange={(e) => {
                    const tld = TLD_OPTIONS.find((t) => t.id === e.target.value);
                    if (tld) setSelectedTld(tld);
                  }}
                  className="w-2/5 text-lg font-semibold text-gray-600 border-l border-gray-300 py-3 bg-transparent focus:outline-none cursor-pointer"
                >
                  {TLD_OPTIONS.map((tld) => (
                    <option key={tld.id} value={tld.id}>{tld.name}</option>
                  ))}
                </select>
                <button onClick={handleCheck} className="w-1/5 primary-gradient text-white py-4 rounded-lg font-bold text-lg hover-lift">
                  <FontAwesomeIcon icon={faSearch} className="mr-2" />
                </button>
              </div>
              <div className="text-center text-sm font-semibold text-gray-500">Example: bdshop / arman-mia</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    { gradient: "primary-gradient", icon: faGift, title: "100% Free", description: "Get your subdomain completely free with no hidden charges, no setup fees, and no monthly costs.", items: ["No Setup Fees", "No Monthly Charges", "No Hidden Costs"], bgFrom: "#eff6ff", bgTo: "#dbeafe" },
    { gradient: "success-gradient", icon: faBolt, title: "Instant Activation", description: "Your subdomain is created and activated instantly. No waiting, no approval process.", items: ["Immediate Creation", "Auto DNS Setup", "Ready to Use"], bgFrom: "#ecfdf5", bgTo: "#d1fae5" },
    { gradient: "purple-gradient", icon: faServer, title: "Any Hosting Support", description: "Use with any hosting provider, Blogger, or our own hosting. Complete flexibility.", items: ["Custom Hosting", "Blogger Compatible", "Our Hosting Available"], bgFrom: "#f5f3ff", bgTo: "#ede9fe" },
    { gradient: "bg-gradient-to-r from-orange-500 to-orange-600", icon: faCogs, title: "Easy Management", description: "Simple order process with automatic DNS updates and easy subdomain management.", items: ["Easy Order Process", "Auto DNS Updates", "User Dashboard"], bgFrom: "#fff7ed", bgTo: "#ffedd5" },
    { gradient: "bg-gradient-to-r from-red-500 to-red-600", icon: faShieldAlt, title: "Secure & Reliable", description: "Professional DNS infrastructure with 99.9% uptime and secure subdomain management.", items: ["99.9% Uptime", "Secure DNS", "Professional Support"], bgFrom: "#fef2f2", bgTo: "#fee2e2" },
    { gradient: "bg-gradient-to-r from-teal-500 to-teal-600", icon: faUsers, title: "For Everyone", description: "Perfect for beginners and developers alike. No technical knowledge required.", items: ["Beginner Friendly", "Developer Ready", "No Tech Skills Needed"], bgFrom: "#f0fdfa", bgTo: "#ccfbf1" },
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            <FontAwesomeIcon icon={faStar} className="text-[#3b82f6] mr-3" /> Why Choose sites.bd?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Revolutionary subdomain system with instant creation and unlimited possibilities</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="rounded-2xl p-8 hover-lift" data-aos="fade-up" data-aos-delay={feature.items[0] ? (i + 1) * 100 : 100} style={{ background: `linear-gradient(to bottom, ${feature.bgFrom}, ${feature.bgTo})` }}>
              <div className={`${feature.gradient} w-16 h-16 rounded-full flex items-center justify-center mb-6`}>
                <FontAwesomeIcon icon={feature.icon} className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed mb-6">{feature.description}</p>
              <ul className="text-gray-600 space-y-2">
                {feature.items.map((item, j) => (
                  <li key={j}><FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2" />{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    { number: 1, gradient: "primary-gradient", title: "Choose Your Subdomain", description: "Enter your desired subdomain name and check availability instantly. Choose from yourname.sites.bd" },
    { number: 2, gradient: "success-gradient", title: "Instant Creation", description: "Your subdomain is created instantly with automatic DNS configuration and immediate activation." },
    { number: 3, gradient: "purple-gradient", title: "Connect & Launch", description: "Connect to your hosting or use with Blogger. Your website is ready to go live immediately!" },
  ];

  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            <FontAwesomeIcon icon={faCog} className="text-[#3b82f6] mr-3" /> How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Get your free subdomain in just 3 simple steps</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="bg-white rounded-xl p-8 shadow-lg hover-lift text-center" data-aos="fade-up" data-aos-delay={(i + 1) * 100}>
              <div className={`${step.gradient} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6`}>
                <span className="text-3xl font-bold text-white">{step.number}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing Section
function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            <FontAwesomeIcon icon={faTags} className="text-[#3b82f6] mr-3" /> Simple Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Everything you need to get started online, completely free</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="primary-gradient rounded-2xl p-8 hover-lift relative text-center" data-aos="fade-up" data-aos-delay="100">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-800 px-6 py-2 rounded-full text-sm font-bold">
              COMPLETELY FREE
            </div>
            <div className="text-white">
              <h3 className="text-3xl font-bold mb-4">Free Subdomain</h3>
              <div className="text-6xl font-bold mb-2">$0</div>
              <p className="text-xl opacity-80 mb-8">Forever Free</p>
              <ul className="text-left space-y-4 mb-8 max-w-md mx-auto">
                <li><FontAwesomeIcon icon={faCheck} className="text-yellow-400 mr-3" /> yourname.sites.bd subdomain</li>
                <li><FontAwesomeIcon icon={faCheck} className="text-yellow-400 mr-3" /> Instant activation</li>
                <li><FontAwesomeIcon icon={faCheck} className="text-yellow-400 mr-3" /> Connect to any hosting</li>
                <li><FontAwesomeIcon icon={faCheck} className="text-yellow-400 mr-3" /> Use with Blogger</li>
                <li><FontAwesomeIcon icon={faCheck} className="text-yellow-400 mr-3" /> Automatic DNS updates</li>
                <li><FontAwesomeIcon icon={faCheck} className="text-yellow-400 mr-3" /> 24/7 DNS support</li>
                <li><FontAwesomeIcon icon={faCheck} className="text-yellow-400 mr-3" /> No setup fees</li>
                <li><FontAwesomeIcon icon={faCheck} className="text-yellow-400 mr-3" /> No monthly charges</li>
              </ul>
              <button onClick={() => smoothScrollTo("order")} className="bg-white text-[#3b82f6] py-4 px-8 rounded-full font-bold text-lg hover-lift w-full md:w-auto">
                <FontAwesomeIcon icon={faGift} className="mr-2" /> Get Subdomain
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Contact Section
function ContactSection() {
  return (
    <section id="contact" className="py-20 primary-gradient">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Need Help?</h2>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">Get in touch with our support team for any questions or assistance</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="glass-effect rounded-2xl p-8" data-aos="fade-up" data-aos-delay="100">
              <h3 className="text-2xl font-bold text-white mb-6">Send us a message</h3>
              <form className="space-y-6">
                <input type="text" placeholder="Your Name" className="w-full p-4 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white" required />
                <input type="email" placeholder="Your Email" className="w-full p-4 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white" required />
                <select className="w-full p-4 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white">
                  <option>General Question</option>
                  <option>Technical Support</option>
                  <option>Subdomain Issue</option>
                  <option>Hosting Question</option>
                </select>
                <textarea placeholder="Your message" rows={4} className="w-full p-4 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white resize-none" required />
                <button type="submit" className="w-full bg-white text-[#3b82f6] py-4 rounded-lg font-bold text-lg hover-lift">
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" /> Send Message
                </button>
              </form>
            </div>
            <div className="space-y-8" data-aos="fade-up" data-aos-delay="200">
              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mr-4"><FontAwesomeIcon icon={faEnvelope} className="text-[#3b82f6]" /></div>
                  <div><h4 className="text-white font-bold">Email</h4><p className="text-white opacity-80">help@sites.bd</p></div>
                </div>
              </div>
              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mr-4"><FontAwesomeIcon icon={faClock} className="text-[#3b82f6]" /></div>
                  <div><h4 className="text-white font-bold">Response Time</h4><p className="text-white opacity-80">Within 24 hours</p></div>
                </div>
              </div>
              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mr-4"><FontAwesomeIcon icon={faHeadset} className="text-[#3b82f6]" /></div>
                  <div><h4 className="text-white font-bold">Support</h4><p className="text-white opacity-80">Free technical support</p></div>
                </div>
              </div>
              <div className="glass-effect rounded-xl p-6">
                <h4 className="text-white font-bold mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover-lift"><FontAwesomeIcon icon={faFacebookF} className="text-[#3b82f6]" /></a>
                  <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover-lift"><FontAwesomeIcon icon={faTwitter} className="text-[#3b82f6]" /></a>
                  <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover-lift"><FontAwesomeIcon icon={faLinkedinIn} className="text-[#3b82f6]" /></a>
                  <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover-lift"><FontAwesomeIcon icon={faGithub} className="text-[#3b82f6]" /></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold mb-4 flex items-center"><FontAwesomeIcon icon={faGlobe} className="mr-3 text-[#3b82f6]" /> SITES.BD</div>
            <p className="text-gray-400 leading-relaxed">The revolutionary free subdomain provider system. Get your online presence started with zero cost.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Services</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><FontAwesomeIcon icon={faGlobe} className="mr-2" /> Free Subdomains</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><FontAwesomeIcon icon={faServer} className="mr-2" /> DNS Management</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><FontAwesomeIcon icon={faCogs} className="mr-2" /> Easy Setup</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><FontAwesomeIcon icon={faHeadset} className="mr-2" /> 24/7 Support</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><FontAwesomeIcon icon={faQuestion} className="mr-2" /> FAQ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><FontAwesomeIcon icon={faBook} className="mr-2" /> Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><FontAwesomeIcon icon={faEnvelope} className="mr-2" /> Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><FontAwesomeIcon icon={faComments} className="mr-2" /> Live Chat</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><FontAwesomeIcon icon={faShieldAlt} className="mr-2" /> Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><FontAwesomeIcon icon={faFileContract} className="mr-2" /> Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><FontAwesomeIcon icon={faCookie} className="mr-2" /> Cookie Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><FontAwesomeIcon icon={faInfo} className="mr-2" /> About Us</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">© 2026 SITES.BD. All rights reserved. | Your gateway to free subdomains and online success.</p>
        </div>
      </div>
    </footer>
  );
}

// Main Page Component
export default function HomePage() {
  return (
    <>
      <Navigation />
      <main>
        <HeroSection />
        <DomainCheckSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
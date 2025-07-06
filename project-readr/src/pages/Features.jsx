import { motion } from 'framer-motion';
import './Features.css';

const features = [
  {
    icon: '📚',
    title: 'Personalized Recommendations',
    description: 'Discover books tailored to your taste with our smart recommendation engine that learns from your reading preferences.'
  },
  {
    icon: '⭐',
    title: 'Rate & Review',
    description: 'Share your thoughts and rate books to help others find their next read while building your reading community.'
  },
  {
    icon: '📝',
    title: 'Reading Lists',
    description: 'Create and manage custom reading lists for any mood, genre, or occasion with our intuitive organization tools.'
  },
  {
    icon: '🔍',
    title: 'Advanced Search',
    description: 'Find books by title, author, or genre with powerful search tools and filters to narrow down your perfect match.'
  },
  {
    icon: '🎨',
    title: 'Modern, Responsive UI',
    description: 'Enjoy a seamless experience on any device with our clean, modern design that adapts to your screen size.'
  },
  {
    icon: '⚡',
    title: 'Fast & Secure',
    description: 'Lightning-fast browsing and secure user authentication for peace of mind while exploring your next favorite book.'
  }
];

const featureStats = [
  { number: '10K+', label: 'Books Available' },
  { number: '5K+', label: 'Happy Readers' },
  { number: '50K+', label: 'Books Discovered' },
  { number: '100%', label: 'Free to Use' }
];

export function Features() {
  return (
    <div className="features-page">
      {/* Hero Section */}
      <motion.section className="features-hero" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <h1>Explore <span className="features-highlight">Readr</span> Features</h1>
        <p className="features-tagline">Everything you need for a delightful reading journey</p>
      </motion.section>

      {/* Features Section */}
      <motion.section className="features-section" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} viewport={{ once: true }}>
        <h2>What Makes Readr Special</h2>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <motion.div key={feature.title} className="feature-card" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: idx * 0.1 }} viewport={{ once: true }}>
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-content">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section className="features-stats" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} viewport={{ once: true }}>
        <div className="stats-grid">
          {featureStats.map((stat, idx) => (
            <motion.div key={stat.label} className="stat-item" initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: idx * 0.1 }} viewport={{ once: true }}>
              <h3>{stat.number}</h3>
              <p>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section className="features-cta" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} viewport={{ once: true }}>
        <h2>Ready to Start Your Reading Adventure?</h2>
        <p>Join thousands of readers who have already discovered their next favorite book with Readr.</p>
        <a href="/SignIn" className="features-cta-btn">Get Started Today</a>
      </motion.section>
    </div>
  );
}
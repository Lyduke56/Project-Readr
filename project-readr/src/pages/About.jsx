import { motion } from 'framer-motion';
import './About.css';

const team = [
  {
    name: 'Alice',
    role: 'Front End Developer',
    bio: 'Loves crafting beautiful UIs and smooth user experiences.',
    img: 'https://randomuser.me/api/portraits/women/44.jpg',
    github: '#',
    linkedin: '#',
  },
  {
    name: 'Bob',
    role: 'Back End Developer',
    bio: 'API wizard and database enthusiast.',
    img: 'https://randomuser.me/api/portraits/men/46.jpg',
    github: '#',
    linkedin: '#',
  },
  {
    name: 'Carol',
    role: 'UI/UX Designer',
    bio: 'Passionate about intuitive and accessible design.',
    img: 'https://randomuser.me/api/portraits/women/65.jpg',
    github: '#',
    linkedin: '#',
  },
  {
    name: 'Dave',
    role: 'Project Lead',
    bio: 'Keeps the team on track and motivated.',
    img: 'https://randomuser.me/api/portraits/men/68.jpg',
    github: '#',
    linkedin: '#',
  },
];

const whyReadrFeatures = [
  {
    icon: '📚',
    title: 'Discover Your Next Read',
    description: 'Swipe through thousands of books to find your perfect match'
  },
  {
    icon: '📖',
    title: 'Organize Your Library',
    description: 'Create personalized reading lists and track your progress'
  },
  {
    icon: '🎯',
    title: 'Smart Recommendations',
    description: 'Get personalized suggestions based on your reading history'
  },
  {
    icon: '🌟',
    title: 'Community Reviews',
    description: 'Read and share honest reviews from fellow book lovers'
  }
];

const stats = [
  { number: '10K+', label: 'Books Available' },
  { number: '5K+', label: 'Happy Readers' },
  { number: '50K+', label: 'Books Discovered' },
  { number: '100%', label: 'Free to Use' }
];

export function About() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <motion.section className="about-hero" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <h1>Welcome to <span className="about-highlight">Readr</span></h1>
        <p className="about-tagline">Your Gateway to Smarter Reading</p>
      </motion.section>

      {/* Why Readr Section */}
      <motion.section className="why-readr-section" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} viewport={{ once: true }}>
        <h2>Why Readr?</h2>
        <div className="why-readr-content">
          <div className="why-readr-left">
            <motion.div className="animated-books" initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }} viewport={{ once: true }}>
              <div className="book-stack">
                <motion.div className="book book-1" animate={{ rotateY: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}></motion.div>
                <motion.div className="book book-2" animate={{ rotateY: [0, -360] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}></motion.div>
                <motion.div className="book book-3" animate={{ rotateY: [0, 360] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}></motion.div>
                <motion.div className="book book-4" animate={{ rotateY: [0, -360] }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }}></motion.div>
              </div>
              <motion.div className="floating-hearts" animate={{ y: [-10, 10, -10] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                ❤️ 📖 ✨
              </motion.div>
            </motion.div>
          </div>
          <div className="why-readr-right">
            <p className="why-readr-intro">
              Readr transforms how you discover, organize, and enjoy books. Our platform combines the joy of browsing with the power of smart technology to create your perfect reading experience.
            </p>
            <div className="why-readr-features">
              {whyReadrFeatures.map((feature, idx) => (
                <motion.div key={feature.title} className="why-readr-feature" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: idx * 0.1 }} viewport={{ once: true }}>
                  <span className="feature-icon">{feature.icon}</span>
                  <div className="feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section className="about-stats" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} viewport={{ once: true }}>
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <motion.div key={stat.label} className="stat-item" initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: idx * 0.1 }} viewport={{ once: true }}>
              <h3>{stat.number}</h3>
              <p>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Team Section */}
      <motion.section className="about-team" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} viewport={{ once: true }}>
        <h2>Meet the Team</h2>
        <div className="about-team-cards">
          {team.map((member, idx) => (
            <motion.div className="about-team-card" key={member.name} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: idx * 0.15 }} viewport={{ once: true }}>
              <img src={member.img} alt={member.name} className="about-team-img" />
              <h3>{member.name}</h3>
              <p className="about-team-role">{member.role}</p>
              <p className="about-team-bio">{member.bio}</p>
              <div className="about-team-links">
                <a href={member.github} target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section className="about-cta" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} viewport={{ once: true }}>
        <h2>Ready to Start Your Reading Journey?</h2>
        <p>Join thousands of readers who have already discovered their next favorite book with Readr.</p>
        <a href="/SignUp" className="about-cta-btn">Get Started Today</a>
      </motion.section>
    </div>
  );
}
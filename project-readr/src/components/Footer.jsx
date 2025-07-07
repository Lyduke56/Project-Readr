import { Link } from "react-router-dom"
import './Footer.css';

function Footer() {
  return (
    <footer>
      <div className="footer">
        <div className="footer-content">
          <div className="row social-row">
            <a href="#"><img src="/facebook.png" alt="Facebook" className="social-logo" /></a>
            <a href="#"><img src="/instagram.png" alt="Instagram" className="social-logo" /></a>
            <a href="#"><img src="/github.png" alt="GitHub" className="social-logo" /></a>
            <a href="#"><img src="/twitter-alt.png" alt="Twitter" className="social-logo" /></a>
          </div>

          <div className="row links-row">
            <ul>
              <li><Link to="#">Contact us</Link></li>
              <li><Link to="#">Our Services</Link></li>
              <li><Link to="#">Privacy Policy</Link></li>
              <li><Link to="#">Terms & Conditions</Link></li>
              <li><Link to="#">Career</Link></li>
            </ul>
          </div>

          <div className="row copyright-row">
            <div className="brand-name">Project Readr</div>
            <div className="copyright-text">Copyright © 2025 Readr - All rights reserved</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
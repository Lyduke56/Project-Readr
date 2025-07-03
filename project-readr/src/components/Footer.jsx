import { Link } from "react-router-dom"
import './Footer.css';

function Footer() {
  return (
    <footer>
      <div className="footer">
        <div className="row">
          <a href="#"><img src="/facebook.png" alt="Facebook" className="social-logo" /></a>
          <a href="#"><img src="/instagram.png" alt="Instagram" className="social-logo" /></a>
          <a href="#"><img src="/github.png" alt="GitHub" className="social-logo" /></a>
          <a href="#"><img src="/twitter-alt.png" alt="Twitter" className="social-logo" /></a>
        </div>

        <div className="row">
          <ul>
            <li><Link href="#">Contact us</Link></li>
            <li><Link href="#">Our Services</Link></li>
            <li><Link href="#">Privacy Policy</Link></li>
            <li><Link href="#">Terms & Conditions</Link></li>
            <li><Link href="#">Career</Link></li>
          </ul>
        </div>

        <div className="row">
          INFERNO Copyright © 2025 Inferno - All rights reserved 
        </div>
      </div>
    </footer>
  );
}

export default Footer;

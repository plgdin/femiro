import { Logo } from './Logo'

export function Footer({ navigate, isAdmin }: { navigate: (path: string) => void; isAdmin: boolean }) {
  return (
    <footer className="premium-footer">
      <div className="footer-container">
        {/* Brand Column */}
        <div className="footer-col brand-col">
          <Logo />
          <p className="footer-tagline">
            Elegant. Feminine. Timeless. Considered wardrobe essentials tailored in small batches for the modern woman.
          </p>
          <div className="footer-contact">
            <span>Email: femirodesigns@gmail.com</span>
            <span>Phone: 9562637753</span>
          </div>
        </div>

        {/* Shop Column */}
        <div className="footer-col">
          <h3>Shop Collections</h3>
          <ul>
            <li><button onClick={() => navigate('/shop')}>New Arrivals</button></li>
            <li><button onClick={() => navigate('/shop')}>Best Sellers</button></li>
            <li><button onClick={() => navigate('/shop')}>Kurtis</button></li>
            <li><button onClick={() => navigate('/shop')}>Co-ords</button></li>
            <li><button onClick={() => navigate('/shop')}>Salwar Sets</button></li>
          </ul>
        </div>

        {/* Support Column */}
        <div className="footer-col">
          <h3>Customer Care</h3>
          <ul>
            <li><button onClick={() => navigate('/account')}>My Account</button></li>
            <li><button onClick={() => navigate('/cart')}>Shopping Bag</button></li>
            <li><button onClick={() => navigate('/wishlist')}>Wishlist</button></li>
            <li><button>Shipping & Returns</button></li>
            <li><button>Privacy Policy</button></li>
            {isAdmin && (
              <li>
                <button className="admin-link" onClick={() => navigate('/cms')}>
                  Admin CMS Panel
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Newsletter Column */}
        <div className="footer-col newsletter-col">
          <h3>Stay In The Loop</h3>
          <p>Subscribe to receive early access to new edits, private sales, and fashion events.</p>
          <form className="footer-form" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="Your email address" aria-label="Email address" required />
            <button type="submit">Join</button>
          </form>
        </div>
      </div>

      {/* Bottom Footer Bar */}
      <div className="footer-bottom">
        <span>© 2026 Femiro Designs. All rights reserved.</span>
        <div className="footer-links">
          <button>Terms of Use</button>
          <button>Sitemap</button>
        </div>
      </div>
    </footer>
  )
}

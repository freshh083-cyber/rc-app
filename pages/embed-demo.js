export default function EmbedDemo() {
  return (
    <div style={{ fontFamily: 'Georgia, serif', background: '#fff', minHeight: '100vh' }}>

      {/* Fake WordPress header */}
      <div style={{ background: '#1B2A4A', color: 'white', padding: '0 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 20, letterSpacing: 1 }}>CMHA Alberta</div>
            <div style={{ fontSize: 11, color: '#5EEAD4', letterSpacing: 2, textTransform: 'uppercase' }}>Recovery College</div>
          </div>
          <nav style={{ display: 'flex', gap: 28, fontSize: 14, color: '#CBD5E1' }}>
            {['Home', 'About', 'Programs', 'Courses', 'Contact'].map(n => (
              <span key={n} style={{ cursor: 'pointer', color: n === 'Courses' ? '#5EEAD4' : '#CBD5E1' }}>{n}</span>
            ))}
          </nav>
        </div>
      </div>

      {/* Fake WP page hero */}
      <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '32px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>Home → Programs → Courses</div>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', color: '#1B2A4A', margin: 0 }}>Recovery College Courses</h1>
          <p style={{ color: '#64748B', marginTop: 8, fontSize: 15 }}>
            Browse and register for free courses offered across Alberta. All are welcome.
          </p>
        </div>
      </div>

      {/* Fake WP content area */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>

        {/* WordPress content block above */}
        <div style={{ background: '#F0FDF9', border: '1px solid #CCFBF1', borderRadius: 10, padding: '16px 20px', marginBottom: 24, fontSize: 14, color: '#134E4A' }}>
          <strong>📌 About Recovery College</strong><br />
          <span style={{ color: '#0F766E' }}>Recovery College offers free educational workshops and courses across Alberta focused on mental health and wellness. Registration is free and open to everyone.</span>
        </div>

        {/* THE IFRAME EMBED — this is literally all WordPress has */}
        <div style={{ position: 'relative' }}>

          {/* Code callout */}
          <div style={{
            background: '#1E293B', color: '#E2E8F0', borderRadius: '10px 10px 0 0',
            padding: '10px 16px', fontSize: 12, fontFamily: 'monospace',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span>
              <span style={{ color: '#94A3B8' }}>{/* WordPress page editor — this is the ONLY code on this page: */}</span>
            </span>
            <span style={{ background: '#0D9488', color: 'white', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontFamily: 'sans-serif', fontWeight: 'bold' }}>
              ONE LINE IN WORDPRESS
            </span>
          </div>
          <div style={{
            background: '#0F172A', color: '#7DD3FC', borderRadius: '0 0 0 0',
            padding: '10px 16px', fontSize: 12, fontFamily: 'monospace', marginBottom: 0,
            borderBottom: '3px solid #0D9488'
          }}>
            {'<iframe src="https://rc-app.onrender.com" width="100%" height="800px" frameborder="0"></iframe>'}
          </div>

          {/* The actual iframe */}
          <iframe
            src="/"
            width="100%"
            height="780"
            style={{ border: '1px solid #E2E8F0', borderTop: 'none', display: 'block' }}
            title="Recovery College Course Registration"
          />
        </div>

        {/* WordPress content block below */}
        <div style={{ marginTop: 32, padding: '16px 0', borderTop: '1px solid #E2E8F0', fontSize: 13, color: '#94A3B8', display: 'flex', gap: 40 }}>
          <span>📞 Questions? Call your regional Recovery College</span>
          <span>📧 info@recoverycollege.ca</span>
          <span>🔒 Your information is kept private</span>
        </div>
      </div>

      {/* Fake WordPress footer */}
      <div style={{ background: '#1B2A4A', color: '#94A3B8', padding: '24px 40px', marginTop: 40, fontSize: 12 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          <span>© 2026 CMHA Alberta — Recovery College. All rights reserved.</span>
          <span>Privacy Policy · Terms of Use · Accessibility</span>
        </div>
      </div>

    </div>
  )
}

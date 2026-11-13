import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LuAward, LuBookOpen, LuBrush, LuClock, LuFileText, LuMail, LuMapPin, LuMenu, LuMessageCircle, LuNotebookPen,
  LuPackage, LuPalette, LuPaperclip, LuPen, LuPhone, LuPrinter, LuRuler, LuScissors, LuStamp, LuX,
} from 'react-icons/lu';
import '../assets/landing.css';
import { useAuth } from '../hooks/useContexts';
import { SITE } from '../utils/siteInfo';

const CATEGORIES = [
  { cls: 'c1', icon: <LuNotebookPen />, title: 'Note Books & Exercise Books', text: 'Note books, exercise books and since books for school and college students.', chips: ['Note books', 'Exercise books', 'Since books'] },
  { cls: 'c2', icon: <LuFileText />, title: 'Papers', text: 'Chart papers, JK papers and plain papers for projects, printing and everyday use.', chips: ['Chart', 'JK paper', 'Plain'] },
  { cls: 'c3', icon: <LuPen />, title: 'Pens & Pencils', text: 'Ball pens, fountain pens and ink, colour pens, colour pencils, fancy pens and pencils for kids.', chips: ['Ball pen', 'Fountain pen', 'Colour pencil'] },
  { cls: 'c4', icon: <LuPaperclip />, title: 'Office Essentials', text: 'File covers of all kinds and sizes, hole punching machines, staplers, stamp pads and ink.', chips: ['File covers', 'Stapler', 'Hole punch'] },
  { cls: 'c5', icon: <LuPalette />, title: 'Art & Craft', text: 'Fabric colours, glue, permanent and CD markers, and erasers.', chips: ['Fabric colours', 'Glue', 'Markers'] },
];

const PRODUCTS = [
  { icon: <LuNotebookPen />, bg: 'linear-gradient(135deg,#d9d4ff,#a99bff)', name: 'Note Books & Exercise Books', text: 'Everyday writing books for school and college.', tag: 'School & college' },
  { icon: <LuPalette />, bg: 'linear-gradient(135deg,#ffd0dc,#ff8fb1)', name: 'Chart Papers', text: 'Bright, sturdy sheets for projects and presentations.', tag: 'Projects' },
  { icon: <LuFileText />, bg: 'linear-gradient(135deg,#bfeee8,#6fd6c9)', name: 'JK & Plain Papers', text: 'Plain and JK papers for printing, copying and writing.', tag: 'Office & home' },
  { icon: <LuPen />, bg: 'linear-gradient(135deg,#ffe29a,#ffb347)', name: 'Pens & Fountain Pen Ink', text: 'Ball pens, fountain pens, fancy pens and ink.', tag: 'Daily use' },
  { icon: <LuBrush />, bg: 'linear-gradient(135deg,#ffe0f2,#f58ad0)', name: 'Colour Pens & Pencils', text: 'Colour pens and colour pencils, including sets for kids.', tag: 'Kids love it' },
  { icon: <LuPackage />, bg: 'linear-gradient(135deg,#e6f7c4,#b4e05f)', name: 'File Covers', text: 'File covers in all kinds and sizes.', tag: 'All sizes' },
  { icon: <LuRuler />, bg: 'linear-gradient(135deg,#cfe4ff,#7db3ff)', name: 'Instrument & Science Boxes', text: 'Geometry and science instrument boxes for students.', tag: 'Students' },
  { icon: <LuStamp />, bg: 'linear-gradient(135deg,#ffd9b8,#ff9a62)', name: 'Staplers, Hole Punches & Stamp Pads', text: 'Desk essentials plus stamp pad ink.', tag: 'Office' },
];

const STEPS = [
  { title: 'Visit or call us', text: 'Drop by at Dobhinala Police Point or call during shop hours.' },
  { title: 'Tell us what you need', text: 'Share your list for home, office, school or college.' },
  { title: 'We help you choose', text: 'Pick the right size, type and quantity with our help.' },
  { title: 'Take it home', text: 'Pay, pack and go. Simple as that.' },
];

const WHY = [
  { icon: <LuAward />, title: 'Everything in one place', text: 'Papers, pens, files, colours and desk items under one roof.' },
  { icon: <LuBookOpen />, title: 'For every need', text: 'Stationery for home, office, school and college use.' },
  { icon: <LuScissors />, title: 'All kinds and sizes', text: 'File covers and papers in many kinds and sizes.' },
  { icon: <LuMapPin />, title: 'Easy to find', text: 'Right at Dobhinala Police Point, PWD Road, Dimapur.' },
];

const MARQUEE = ['Note Books', 'Chart Papers', 'JK Papers', 'Pens', 'Colour Pencils', 'File Covers', 'Staplers', 'Stamp Pads', 'Instrument Boxes', 'Markers'];

const useReveal = () => {
  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
};

const LandingPage = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  useReveal();

  const close = () => setOpen(false);
  const wa = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Hello RP Enterprises, I would like a quote for ')}`;

  return (
    <div className="lp">
      <nav className="lp-nav">
        <div className="lp-wrap">
          <a href="#top" className="lp-logo"><span className="lp-logo-mark">RP</span>{SITE.name}</a>
          <div className={`lp-links ${open ? 'open' : ''}`}>
            <a className="lp-link" href="#categories" onClick={close}>Categories</a>
            <a className="lp-link" href="#products" onClick={close}>Products</a>
            <a className="lp-link" href="#how" onClick={close}>How it works</a>
            <a className="lp-link" href="#contact" onClick={close}>Contact</a>
            <Link to={user ? '/app' : '/login'} className="lp-btn lp-btn-dark lp-btn-sm" onClick={close}>{user ? 'Open Dashboard' : 'Staff Login'}</Link>
          </div>
          <button type="button" className="lp-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">{open ? <LuX /> : <LuMenu />}</button>
        </div>
      </nav>

      <header className="lp-hero" id="top">
        <div className="lp-wrap">
          <div>
            <span className="lp-eyebrow"><LuPaperclip /> Dobhinala · {SITE.city}</span>
            <h1>Everything you <em>write</em>, print &amp; present on.</h1>
            <p className="lead">{SITE.name} is a papers and stationery shop at Dobhinala Police Point, Dimapur, with everything you need for home, office, school and college.</p>
            <div className="lp-cta">
              <a href="#products" className="lp-btn lp-btn-solid">Explore products</a>
              <a href={wa} target="_blank" rel="noreferrer" className="lp-btn lp-btn-ghost"><LuMessageCircle /> Ask on WhatsApp</a>
            </div>
            <div className="lp-stats">
              <div><strong>All kinds</strong><span>Papers, pens, files &amp; more</span></div>
              <div><strong>Mon – Sat</strong><span>9:00 AM – 7:00 PM</span></div>
              <div><strong>Home · Office</strong><span>School · College</span></div>
            </div>
          </div>

          <div className="lp-art" aria-hidden="true">
            <div className="lp-blob" />
            <div className="lp-sheet a"><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="lp-sheet b"><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="lp-notebook"><div className="label">NOTE<br />BOOK<small>100 pages · ruled</small></div></div>
            <div className="lp-pencil" />
            <div className="lp-swatches"><b style={{ background: '#ff6b35' }} /><b style={{ background: '#ffc83d' }} /><b style={{ background: '#1fa89a' }} /><b style={{ background: '#e84a7f' }} /></div>
            <div className="lp-sticker"><span>Papers &amp;<br />Stationery<br />✦</span></div>
          </div>
        </div>
      </header>

      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track">
          {[...MARQUEE, ...MARQUEE].map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>

      <section className="lp-section" id="categories">
        <div className="lp-wrap">
          <div className="lp-head lp-reveal">
            <div className="kicker">Shop by category</div>
            <h2>One counter for every page you'll ever fill.</h2>
            <p>From a child's first pencil to the office file cabinet, find it all under one roof.</p>
          </div>
          <div className="lp-bento">
            {CATEGORIES.map((c) => (
              <div key={c.title} className={`lp-tile ${c.cls} lp-reveal`}>
                <div className="ico">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <div className="chips">{c.chips.map((x) => <span key={x}>{x}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-products" id="products">
        <div className="lp-wrap">
          <div className="lp-head lp-reveal">
            <div className="kicker">Popular picks</div>
            <h2>Fresh from the shelves.</h2>
            <p>A taste of what we stock. Ask us for sizes, brands and anything not listed here.</p>
          </div>
          <div className="lp-grid">
            {PRODUCTS.map((p) => (
              <article key={p.name} className="lp-card lp-reveal">
                <div className="art" style={{ background: p.bg }}>{p.icon}</div>
                <div className="body">
                  <h3>{p.name}</h3>
                  <p>{p.text}</p>
                  <span className="lp-tag">{p.tag}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="how">
        <div className="lp-wrap">
          <div className="lp-head lp-reveal">
            <div className="kicker">Simple ordering</div>
            <h2>Getting what you need, in four easy steps.</h2>
          </div>
          <div className="lp-steps">
            {STEPS.map((s) => (
              <div key={s.title} className="lp-step lp-reveal"><h3>{s.title}</h3><p>{s.text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">
          <div className="lp-head lp-reveal">
            <div className="kicker">Why {SITE.name}</div>
            <h2>Paper people you can count on.</h2>
          </div>
          <div className="lp-why">
            {WHY.map((w) => (
              <div key={w.title} className="lp-reveal"><div className="ico">{w.icon}</div><h3>{w.title}</h3><p>{w.text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="contact" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">
          <div className="lp-contact lp-reveal">
            <div>
              <h2 className="lp-display">Let's fill your shelves.</h2>
              <p style={{ opacity: .92, fontSize: '1.05rem' }}>Send us your list on WhatsApp or drop by the shop at Dobhinala Police Point.</p>
              <div className="lp-cta">
                <a href={wa} target="_blank" rel="noreferrer" className="lp-btn lp-btn-dark"><LuMessageCircle /> WhatsApp us</a>
                <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="lp-btn lp-btn-ghost" style={{ color: '#fff', borderColor: '#fff' }}><LuPhone /> Call now</a>
              </div>
            </div>
            <ul>
              <li><LuMapPin /> {SITE.address}</li>
              <li><LuPhone /> <a href={`tel:${SITE.phone.replace(/\s/g, '')}`}>{SITE.phone}</a></li>
              {SITE.email && <li><LuMail /> <a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>}
              <li><LuClock /> {SITE.hours}</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        © {new Date().getFullYear()} {SITE.name} · {SITE.tagline} · <Link to="/login" style={{ color: 'inherit' }}>Staff login</Link> <LuBrush style={{ verticalAlign: '-2px' }} />
      </footer>
    </div>
  );
};

export default LandingPage;

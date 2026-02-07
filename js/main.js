/* ============================================
   THE FLOOBIVERSE - Main JavaScript
   Scroll effects, card interactions, navigation
   ============================================ */

// --- Hide loader when page is ready ---
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    // Small delay so user sees the cute Floob animation
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 800);
  }
});

document.addEventListener('DOMContentLoaded', () => {

  // --- Navigation show/hide on scroll ---
  const nav = document.querySelector('.nav');
  let lastScroll = 0;
  const heroHeight = window.innerHeight * 0.6;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > heroHeight) {
      nav.classList.add('visible');
    } else {
      nav.classList.remove('visible');
    }

    lastScroll = currentScroll;
  }, { passive: true });

  // --- Mobile nav toggle ---
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    // Close mobile nav when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }

  // --- Character card flip ---
  document.querySelectorAll('.char-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });

  // --- Scroll-triggered animations (Intersection Observer) ---
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
  });

  // --- Staggered animations for grids ---
  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const items = entry.target.querySelectorAll(
          '.char-card, .value-item, .episode-card, .gallery-item'
        );
        items.forEach(item => {
          item.classList.add('animate-in');
        });
        staggerObserver.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  });

  document.querySelectorAll(
    '.characters-grid, .values-grid, .episodes-grid, .gallery-grid'
  ).forEach(grid => {
    staggerObserver.observe(grid);
  });

  // --- Smooth scroll for nav links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const offset = 60; // nav height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // --- Parallax effect on hero background ---
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroBg.style.transform = `scale(${1.05 + scrolled * 0.0002}) translateY(${scrolled * 0.3}px)`;
      }
    }, { passive: true });
  }

  // --- Lazy loading enhancement ---
  if ('loading' in HTMLImageElement.prototype) {
    // Browser supports native lazy loading
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
  } else {
    // Fallback: use Intersection Observer for lazy loading
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          imgObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      imgObserver.observe(img);
    });
  }

});

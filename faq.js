/** KITKING — faq.js */
document.addEventListener("DOMContentLoaded", () => {
  // FAQ accordion
  document.querySelectorAll(".faq-q").forEach(btn => {
    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".faq-q").forEach(b => {
        b.setAttribute("aria-expanded", "false");
        b.nextElementSibling?.classList.remove("open");
      });
      if (!isOpen) {
        btn.setAttribute("aria-expanded", "true");
        btn.nextElementSibling?.classList.add("open");
      }
    });
  });

  // Active nav link on scroll
  const groups  = document.querySelectorAll(".faq-group");
  const navLinks = document.querySelectorAll(".faq-nav-link");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
      }
    });
  }, { rootMargin: `-${68+32}px 0px -50% 0px` });
  groups.forEach(g => observer.observe(g));

  // WA links
  const num = cfg().whatsappNumber;
  ["faq-wa-inline","sg-wa-link","contact-wa"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = `https://wa.me/${num}?text=${encodeURIComponent("Hi KITKING! I have a question.")}`;
  });

  // Jump to section from URL hash
  if (window.location.hash) {
    setTimeout(() => {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior:"smooth" });
    }, 300);
  }
});

/* ============================================
   iDigitalStudies — Interactive Scripts
   ============================================ */

// Animated Counters
const counters = document.querySelectorAll("[data-count]");
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count);
      const duration = 1500;
      const start = performance.now();

      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // Ease-out cubic
        el.textContent = Math.floor(target * eased) + "+";
        if (p < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  },
  { threshold: 0.5 },
);

counters.forEach((c) => counterObserver.observe(c));

// Lead Form Submission with Google Sheet Integration
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzXMhXBjqb7642-9RsgGRiyPjdc5Ho1Yyqe_uoRGejWIl4-IBPujmVjfaNkD8vWcoKoLQ/exec";

function bindLeadForm(formEl, msgBoxEl) {
  if (!formEl) return;

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = formEl.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    const data = new FormData(formEl);
    const payload = {
      name: (data.get("name") || "").trim(),
      phone: (data.get("phone") || "").trim(),
      email: (data.get("email") || "").trim(),
      course: data.get("course") || "",
      mode: data.get("mode") || "",
      timeline: data.get("timeline") || "",
    };

    console.log("Submitting lead payload:", payload);

    // UI Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    if (msgBoxEl) {
      msgBoxEl.textContent = "";
      msgBoxEl.className = "form-message";
    }

    try {
      // Send to Google Apps Script
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      // Success feedback
      if (msgBoxEl) {
        msgBoxEl.textContent =
          "✅ Thank you! Redirecting to confirmation page…";
        msgBoxEl.className = "form-message form-success";
      }
      formEl.reset();

      // Fire Meta Pixel Lead Event
      if (typeof fbq === "function") {
        fbq("track", "Lead");
      }

      // Redirect directly to Thank You page
      setTimeout(() => {
        window.location.href = "thank-you/";
      }, 300);
    } catch (err) {
      console.error("Submission error:", err);
      if (msgBoxEl) {
        msgBoxEl.textContent =
          "✅ Thank you! Redirecting to confirmation page…";
        msgBoxEl.className = "form-message form-success";
      }
      formEl.reset();
      setTimeout(() => {
        window.location.href = "thank-you/";
      }, 300);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

// Bind both Hero form (top) and Bottom form (desktop/bottom)
bindLeadForm(
  document.getElementById("leadForm"),
  document.getElementById("formMessage"),
);
bindLeadForm(
  document.getElementById("bottomLeadForm"),
  document.getElementById("bottomFormMessage"),
);

// Active color for select dropdowns when chosen
document.querySelectorAll(".input-wrap select").forEach((sel) => {
  sel.addEventListener("change", () => {
    sel.style.color = sel.value ? "#1a1f36" : "#9ca3be";
  });
});

// Mobile Lead Form Bottom Sheet Modal Logic
const leadModalWrap = document.getElementById("leadModalWrap");
const closeFormModalBtn = document.getElementById("closeFormModal");

function isMobileView() {
  return window.innerWidth <= 800;
}

function openLeadModal() {
  if (!leadModalWrap) return;
  leadModalWrap.classList.add("is-open");
  document.body.classList.add("modal-open");
  const firstInput = leadModalWrap.querySelector("input[name='name']");
  if (firstInput) {
    setTimeout(() => {
      try { firstInput.focus(); } catch (e) {}
    }, 280);
  }
}

function closeLeadModal() {
  if (!leadModalWrap) return;
  leadModalWrap.classList.remove("is-open");
  document.body.classList.remove("modal-open");
}

if (closeFormModalBtn) {
  closeFormModalBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeLeadModal();
  });
}

if (leadModalWrap) {
  leadModalWrap.addEventListener("click", (e) => {
    if (e.target === leadModalWrap) {
      closeLeadModal();
    }
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && leadModalWrap && leadModalWrap.classList.contains("is-open")) {
    closeLeadModal();
  }
});

// Touch swipe-down to dismiss modal sheet
const formCard = document.querySelector("#leadModalWrap .hero-form-card");
if (formCard) {
  let touchStartY = 0;
  let touchCurrentY = 0;

  formCard.addEventListener("touchstart", (e) => {
    if (formCard.scrollTop <= 5) {
      touchStartY = e.touches[0].clientY;
    } else {
      touchStartY = 0;
    }
  }, { passive: true });

  formCard.addEventListener("touchmove", (e) => {
    if (!touchStartY) return;
    touchCurrentY = e.touches[0].clientY;
    const diff = touchCurrentY - touchStartY;
    if (diff > 0) {
      formCard.style.transform = `translateY(${diff}px)`;
    }
  }, { passive: true });

  formCard.addEventListener("touchend", () => {
    if (!touchStartY) return;
    const diff = touchCurrentY - touchStartY;
    formCard.style.transform = "";
    if (diff > 90) {
      closeLeadModal();
    }
    touchStartY = 0;
    touchCurrentY = 0;
  });
}

// Close modal if resizing above mobile breakpoint
window.addEventListener("resize", () => {
  if (!isMobileView() && leadModalWrap && leadModalWrap.classList.contains("is-open")) {
    closeLeadModal();
  }
});

// Check on load if #contact is hashed in mobile view
if (window.location.hash === "#contact" && isMobileView()) {
  setTimeout(openLeadModal, 300);
}

// Smooth Scroll for Anchor Links (Intercepts #contact on mobile to open modal)
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id === "#contact" && isMobileView()) {
      e.preventDefault();
      openLeadModal();
      return;
    }
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const headerHeight =
          document.querySelector(".site-header").offsetHeight;
        const targetPosition =
          target.getBoundingClientRect().top +
          window.pageYOffset -
          headerHeight -
          10;
        window.scrollTo({ top: targetPosition, behavior: "smooth" });
      }
    }
  });
});

// Scroll Reveal Animation
const revealElements = document.querySelectorAll(
  ".feature, .topic, .number-card, .journey-step, .tool-item, .review-grid blockquote, .support-card, .bottom-card",
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -30px 0px" },
);

revealElements.forEach((el, i) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(20px)";
  el.style.transition = `opacity 0.5s ease ${(i % 6) * 0.08}s, transform 0.5s ease ${(i % 6) * 0.08}s`;
  revealObserver.observe(el);
});

// Active nav link highlight on scroll
const sections = document.querySelectorAll("section[id]");
window.addEventListener("scroll", () => {
  const scrollY = window.pageYOffset;
  const headerHeight = document.querySelector(".site-header").offsetHeight;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - headerHeight - 100;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute("id");

    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
      document.querySelectorAll(".main-nav a:not(.nav-cta)").forEach((link) => {
        link.style.color = "";
        if (link.getAttribute("href") === "#" + sectionId) {
          link.style.color = "#fe4759";
        }
      });
    }
  });
});

// Header shadow on scroll
window.addEventListener("scroll", () => {
  const header = document.querySelector(".site-header");
  if (window.scrollY > 10) {
    header.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
  } else {
    header.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
  }
});

// ============================================
// Hear From IDS Alumni — Infinite Video Carousel
// ============================================
const alumniTrack = document.getElementById("alumniCarouselTrack");
const alumniPrevBtn = document.getElementById("alumniPrevBtn");
const alumniNextBtn = document.getElementById("alumniNextBtn");
const alumniDotsContainer = document.getElementById("alumniCarouselDots");

if (alumniTrack) {
  const originalCards = Array.from(alumniTrack.querySelectorAll(".alumni-video-card"));
  const originalCount = originalCards.length;

  if (originalCount > 0) {
    // Clone cards for seamless infinite wrapping:
    // [Set A: clones] [Set B: originals] [Set C: clones]
    const clonesBefore = originalCards.map((card) => {
      const clone = card.cloneNode(true);
      clone.classList.add("is-clone");
      return clone;
    });

    const clonesAfter = originalCards.map((card) => {
      const clone = card.cloneNode(true);
      clone.classList.add("is-clone");
      return clone;
    });

    clonesBefore.reverse().forEach((clone) => {
      alumniTrack.insertBefore(clone, alumniTrack.firstChild);
    });

    clonesAfter.forEach((clone) => {
      alumniTrack.appendChild(clone);
    });

    const allCards = Array.from(alumniTrack.querySelectorAll(".alumni-video-card"));

    let autoPlayTimer = null;
    let isHovered = false;
    let isVideoPlaying = false;
    let isProgrammaticScrolling = false;

    function getStep() {
      const firstCard = allCards[0];
      if (!firstCard) return 250;
      const style = window.getComputedStyle(alumniTrack);
      const gap = parseFloat(style.gap) || 20;
      return firstCard.offsetWidth + gap;
    }

    function getSingleSetWidth() {
      return getStep() * originalCount;
    }

    // Position carousel at the start of Set B (original cards)
    function initPosition() {
      const singleSetWidth = getSingleSetWidth();
      alumniTrack.style.scrollBehavior = "auto";
      alumniTrack.scrollLeft = singleSetWidth;
    }

    // Initialize position on DOM load and after resize
    initPosition();
    window.addEventListener("resize", () => {
      initPosition();
      updateActiveDot();
    });

    // Check bounds and seamlessly wrap around without any visible jump
    function checkWrapBounds() {
      const singleSetWidth = getSingleSetWidth();
      if (!singleSetWidth) return;

      // Reached into Set C (right side): silently wrap back to Set B
      if (alumniTrack.scrollLeft >= singleSetWidth * 2 - 5) {
        alumniTrack.style.scrollBehavior = "auto";
        alumniTrack.scrollLeft -= singleSetWidth;
      }
      // Reached into Set A (left side): silently wrap forward to Set B
      else if (alumniTrack.scrollLeft <= singleSetWidth * 0.5) {
        alumniTrack.style.scrollBehavior = "auto";
        alumniTrack.scrollLeft += singleSetWidth;
      }
    }

    function scrollToNext() {
      if (isProgrammaticScrolling) return;
      isProgrammaticScrolling = true;
      const step = getStep();

      alumniTrack.style.scrollBehavior = "smooth";
      alumniTrack.scrollBy({ left: step, behavior: "smooth" });

      setTimeout(() => {
        checkWrapBounds();
        isProgrammaticScrolling = false;
        updateActiveDot();
      }, 420);
    }

    function scrollToPrev() {
      if (isProgrammaticScrolling) return;
      isProgrammaticScrolling = true;
      const step = getStep();

      alumniTrack.style.scrollBehavior = "smooth";
      alumniTrack.scrollBy({ left: -step, behavior: "smooth" });

      setTimeout(() => {
        checkWrapBounds();
        isProgrammaticScrolling = false;
        updateActiveDot();
      }, 420);
    }

    function startAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = setInterval(() => {
        if (!isHovered && !isVideoPlaying) {
          scrollToNext();
        }
      }, 3000);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    function resetAutoPlay() {
      stopAutoPlay();
      startAutoPlay();
    }

    // Button click events
    if (alumniPrevBtn) {
      alumniPrevBtn.addEventListener("click", () => {
        scrollToPrev();
        resetAutoPlay();
      });
    }

    if (alumniNextBtn) {
      alumniNextBtn.addEventListener("click", () => {
        scrollToNext();
        resetAutoPlay();
      });
    }

    // Setup 6 dots representing the 6 unique alumni cards
    if (alumniDotsContainer) {
      alumniDotsContainer.innerHTML = "";
      originalCards.forEach((_, idx) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = `carousel-dot ${idx === 0 ? "active" : ""}`;
        dot.setAttribute("aria-label", `Slide ${idx + 1}`);
        dot.addEventListener("click", () => {
          const step = getStep();
          const singleSetWidth = getSingleSetWidth();
          alumniTrack.style.scrollBehavior = "smooth";
          alumniTrack.scrollTo({ left: singleSetWidth + idx * step, behavior: "smooth" });
          resetAutoPlay();
        });
        alumniDotsContainer.appendChild(dot);
      });
    }

    function updateActiveDot() {
      if (!alumniDotsContainer) return;
      const step = getStep();
      const singleSetWidth = getSingleSetWidth();
      if (!step || !singleSetWidth) return;

      const normalized = ((alumniTrack.scrollLeft % singleSetWidth) + singleSetWidth) % singleSetWidth;
      const activeIdx = Math.min(
        Math.round(normalized / step) % originalCount,
        originalCount - 1
      );
      const dots = alumniDotsContainer.querySelectorAll(".carousel-dot");
      dots.forEach((dot, idx) => {
        dot.classList.toggle("active", idx === activeIdx);
      });
    }

    // Track scroll listener (for manual swipe/drag)
    alumniTrack.addEventListener("scroll", () => {
      if (!isProgrammaticScrolling) {
        checkWrapBounds();
      }
      updateActiveDot();
    }, { passive: true });

    // Hover & Touch pause
    alumniTrack.addEventListener("mouseenter", () => { isHovered = true; });
    alumniTrack.addEventListener("mouseleave", () => { isHovered = false; });
    alumniTrack.addEventListener("touchstart", () => { isHovered = true; }, { passive: true });
    alumniTrack.addEventListener("touchend", () => {
      setTimeout(() => { isHovered = false; }, 2000);
    }, { passive: true });

    // Video playback management across ALL cards (including clones)
    allCards.forEach((card) => {
      const video = card.querySelector("video");
      const playTrigger = card.querySelector(".play-trigger");

      if (!video) return;

      function togglePlay(e) {
        if (e) e.stopPropagation();

        if (video.paused) {
          // Pause all other videos
          allCards.forEach((otherCard) => {
            const otherVideo = otherCard.querySelector("video");
            if (otherVideo && otherVideo !== video && !otherVideo.paused) {
              otherVideo.pause();
              otherCard.classList.remove("is-playing");
              otherVideo.controls = false;
            }
          });

          video.play().then(() => {
            card.classList.add("is-playing");
            video.controls = true;
            isVideoPlaying = true;
            stopAutoPlay();
          }).catch((err) => {
            console.warn("Video playback error:", err);
          });
        } else {
          video.pause();
          card.classList.remove("is-playing");
          video.controls = false;
          isVideoPlaying = false;
          startAutoPlay();
        }
      }

      if (playTrigger) {
        playTrigger.addEventListener("click", togglePlay);
      }

      card.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() === "video" && video.controls) return;
        togglePlay(e);
      });

      video.addEventListener("ended", () => {
        card.classList.remove("is-playing");
        video.controls = false;
        video.currentTime = 0;
        isVideoPlaying = false;
        startAutoPlay();
      });

      video.addEventListener("pause", () => {
        card.classList.remove("is-playing");
        const anyPlaying = allCards.some(c => !c.querySelector("video").paused);
        if (!anyPlaying) {
          isVideoPlaying = false;
          startAutoPlay();
        }
      });

      video.addEventListener("play", () => {
        card.classList.add("is-playing");
        isVideoPlaying = true;
        stopAutoPlay();
      });
    });

    // Start seamless infinite auto-carouseling
    startAutoPlay();
  }
}

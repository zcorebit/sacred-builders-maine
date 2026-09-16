(function(){
  "use strict";
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---- header solid on scroll + top progress ---- */
  var header = document.getElementById('siteHeader');
  var progress = document.getElementById('topProgress');
  function onScroll(){
    try{
      if (header) header.classList.toggle('solid', window.scrollY > 60);
      if (progress){
        var h = document.documentElement;
        var pct = (h.scrollTop || document.body.scrollTop) / ((h.scrollHeight || document.body.scrollHeight) - h.clientHeight) * 100;
        progress.style.width = (isFinite(pct)?pct:0) + '%';
      }
    }catch(e){}
  }
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---- mobile nav ---- */
  var burger = document.getElementById('burgerBtn');
  var mobileNav = document.getElementById('mobileNav');
  if (burger && mobileNav){
    burger.addEventListener('click', function(){
      var open = mobileNav.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        mobileNav.classList.remove('open'); burger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---- reveal + hero + counters + parallax ---- */
  if (window.gsap){
    gsap.set('[data-reveal]', {opacity:1});

    if (document.querySelector('.hero')){
      gsap.timeline({defaults:{ease:'power2.out'}})
        .from('.hero-badges', {opacity:0, y:16, duration:.6})
        .from('.hero h1', {opacity:0, y:40, duration:.8}, '-=.35')
        .from('.hero-sub', {opacity:0, y:20, duration:.6}, '-=.45')
        .from('.hero-ctas', {opacity:0, y:16, duration:.6}, '-=.4');

      if (!reduceMotion && document.getElementById('heroImg')){
        gsap.to('#heroImg', {
          yPercent: 10, ease:'none',
          scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:0.6}
        });
      }
    }

    if (document.querySelector('.page-hero')){
      gsap.timeline({defaults:{ease:'power2.out'}})
        .from('.page-hero .crumbs', {opacity:0, y:14, duration:.5})
        .from('.page-hero h1', {opacity:0, y:30, duration:.7}, '-=.3')
        .from('.page-hero .sub', {opacity:0, y:16, duration:.5}, '-=.35')
        .from('.page-hero .hero-ctas, .page-hero .badge-row', {opacity:0, y:14, duration:.5}, '-=.3');
    }

    /* grid children (service/gallery/process/testimonial cards) get their
       reveal from the stagger block below — skip them here so they are never
       driven by two competing tweens on the same opacity property, which
       could leave a card stuck mid-fade. */
    document.querySelectorAll('section:not(.hero):not(.page-hero) [data-reveal], .page-hero ~ * [data-reveal]').forEach(function(el){
      if (el.closest('.services-grid, .gal-grid, .process-grid, .tst-grid')) return;
      gsap.from(el, {
        opacity:0, y:26, duration:.6, ease:'power2.out',
        scrollTrigger:{trigger:el, start:'top 88%', toggleActions:'play none none reverse'}
      });
    });

    document.querySelectorAll('.services-grid, .gal-grid, .process-grid, .tst-grid').forEach(function(grid){
      gsap.from(grid.children, {
        opacity:0, y:24, duration:.5, stagger:0.08, ease:'power2.out',
        scrollTrigger:{trigger:grid, start:'top 85%'}
      });
    });

    document.querySelectorAll('[data-count]').forEach(function(el){
      var target = parseInt(el.getAttribute('data-count'), 10);
      var obj = {v:0};
      ScrollTrigger.create({
        trigger: el, start:'top 90%', once:true,
        onEnter: function(){
          gsap.to(obj, {v:target, duration:1.4, ease:'power2.out', onUpdate:function(){ el.textContent = Math.round(obj.v); }});
        }
      });
    });

    if (!reduceMotion && document.querySelector('[data-parallax] img')){
      gsap.to('[data-parallax] img', {
        yPercent:-8, ease:'none',
        scrollTrigger:{trigger:'[data-parallax]', start:'top bottom', end:'bottom top', scrub:0.6}
      });
    }
  }

  /* ---- gallery filter ---- */
  var tabs = document.querySelectorAll('.gal-tab');
  var items = document.querySelectorAll('.gal-item');
  if (tabs.length && items.length){
    tabs.forEach(function(tab){
      tab.addEventListener('click', function(){
        tabs.forEach(function(t){ t.classList.remove('active'); });
        tab.classList.add('active');
        var f = tab.getAttribute('data-filter');
        items.forEach(function(it){
          var show = f === 'all' || it.getAttribute('data-cat') === f;
          if (window.gsap){
            gsap.to(it, {opacity: show?1:0, duration:.25, onComplete:function(){ it.style.display = show?'':'none'; } });
            if(show){ it.style.display=''; gsap.fromTo(it,{opacity:0},{opacity:1,duration:.3}); }
          } else {
            it.style.display = show ? '' : 'none';
          }
        });
      });
    });
  }

  /* ---- lightbox ---- */
  var lightbox = document.getElementById('lightbox');
  if (lightbox && items.length){
    var lbImg = document.getElementById('lbImg');
    var lbCap = document.getElementById('lbCap');
    items.forEach(function(it){
      it.addEventListener('click', function(){
        lbImg.src = it.getAttribute('data-img');
        lbCap.textContent = it.getAttribute('data-cap');
        lightbox.classList.add('open');
      });
    });
    var lbClose = document.getElementById('lbClose');
    if (lbClose) lbClose.addEventListener('click', function(){ lightbox.classList.remove('open'); });
    lightbox.addEventListener('click', function(e){ if (e.target === lightbox) lightbox.classList.remove('open'); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') lightbox.classList.remove('open'); });
  }

  /* ---- testimonial slider ---- */
  var track = document.getElementById('tstTrack');
  if (track){
    var cards = track.children.length;
    var idx = 0;
    function perView(){ return window.innerWidth <= 1080 ? 1 : 3; }
    function update(){
      var pv = perView();
      var max = Math.max(0, cards - pv);
      idx = Math.min(idx, max);
      var cardEl = track.children[0];
      var gap = 26;
      var w = cardEl.getBoundingClientRect().width + gap;
      track.style.transform = 'translateX(' + (-idx * w) + 'px)';
    }
    var nextBtn = document.getElementById('tstNext');
    var prevBtn = document.getElementById('tstPrev');
    if (nextBtn) nextBtn.addEventListener('click', function(){
      var pv = perView(); var max = Math.max(0, cards - pv);
      idx = idx >= max ? 0 : idx + 1; update();
    });
    if (prevBtn) prevBtn.addEventListener('click', function(){
      var pv = perView(); var max = Math.max(0, cards - pv);
      idx = idx <= 0 ? max : idx - 1; update();
    });
    window.addEventListener('resize', update);
    update();
  }

  /* ---- faq accordion ---- */
  document.querySelectorAll('.faq-item').forEach(function(item){
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    if (item.classList.contains('open')) a.style.maxHeight = a.scrollHeight + 'px';
    q.addEventListener('click', function(){
      var isOpen = item.classList.contains('open');
      var group = item.closest('.faq-group') || document;
      group.querySelectorAll('.faq-item.open').forEach(function(other){
        other.classList.remove('open');
        other.querySelector('.faq-a').style.maxHeight = 0;
      });
      if (!isOpen){
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ---- contact form (front-end only demo) ---- */
  var form = document.getElementById('quoteForm');
  if (form){
    var msg = document.getElementById('formMsg');
    var serviceSelect = document.getElementById('service');
    if (serviceSelect){
      var hash = (window.location.hash || '').replace('#','').toLowerCase();
      var map = {roofing:'Roofing', siding:'Siding', painting:'Painting', construction:'Construction'};
      if (map[hash]){
        Array.prototype.forEach.call(serviceSelect.options, function(opt){
          if (opt.value === map[hash] || opt.textContent === map[hash]) opt.selected = true;
        });
      }
    }
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (!form.checkValidity()){ form.reportValidity(); return; }
      msg.classList.add('show');
      form.reset();
      msg.scrollIntoView({behavior:'smooth', block:'nearest'});
    });
  }
})();

/* Serena · interações e animações */
(() => {
  const S = window.SITE || {};
  const raiz = document.documentElement;
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const anima = !!(window.gsap && window.ScrollTrigger) && !reduz;
  window.__animOk = true;
  if (!anima) raiz.classList.remove("js");
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmt = (n) => Math.round(n).toLocaleString("pt-BR");

  /* ── Relógios do rodapé do hero ─────────────────────────────────────── */
  const relogios = () => $$("[data-hora]").forEach((el) => {
    el.textContent = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: el.dataset.hora }).format(new Date());
  });
  relogios(); setInterval(relogios, 20000);
  $$("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ── Rolagem suave ──────────────────────────────────────────────────── */
  let lenis = null;
  if (anima && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const irPara = (alvo) => {
    const el = typeof alvo === "string" ? $(alvo) : alvo;
    if (!el) return;
    lenis ? lenis.scrollTo(el, { duration: 1.6 }) : el.scrollIntoView({ behavior: reduz ? "auto" : "smooth" });
  };

  /* ── Topo, menu e WhatsApp ──────────────────────────────────────────── */
  const topo = $(".topo"), hero = $(".hero"), whats = $(".whats"), form = $(".form"), rodape = $(".rodape");
  const escuros = $$(".depo, .rodape");
  let formNaTela = false;
  const aoRolar = () => {
    const y = scrollY;
    topo.classList.toggle("rolou", y > 40);
    topo.classList.toggle("claro", y > hero.offsetHeight - 60);
    topo.classList.toggle("escuro", escuros.some((el) => { const r = el.getBoundingClientRect(); return r.top < 50 && r.bottom > 50; }));
    whats && whats.classList.toggle("visivel", y > innerHeight * 0.6 && !formNaTela && rodape.getBoundingClientRect().top > innerHeight - 40);
  };
  if (form) new IntersectionObserver(([e]) => { formNaTela = e.isIntersecting; aoRolar(); }).observe(form);
  addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  const menuBotao = $(".menu-botao");
  const fecharMenu = () => { topo.classList.remove("aberto"); menuBotao.setAttribute("aria-expanded", "false"); lenis && lenis.start(); };
  menuBotao.addEventListener("click", () => {
    const abrir = !topo.classList.contains("aberto");
    topo.classList.toggle("aberto", abrir);
    menuBotao.setAttribute("aria-expanded", String(abrir));
    lenis && (abrir ? lenis.stop() : lenis.start());
    if (abrir && anima) gsap.from(".menu a", { y: 30, opacity: 0, stagger: 0.05, duration: 0.8, ease: "expo.out" });
  });
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    e.preventDefault(); fecharMenu(); irPara(id);
  }));

  if (whats && S.whatsapp) {
    const num = String(S.whatsapp.numero || "").replace(/\D/g, "");
    whats.href = `https://wa.me/${num}?text=${encodeURIComponent(S.whatsapp.mensagem || "")}`;
  }

  /* ── Divide títulos em palavras (para a revelação) ──────────────────── */
  const dividir = (el) => {
    const nos = [...el.childNodes];
    el.textContent = "";
    nos.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { el.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "palavra";
          const i = document.createElement("span"); i.textContent = p;
          w.appendChild(i); el.appendChild(w);
        });
      } else el.appendChild(n);
    });
    el.style.visibility = "visible";
    return $$(".palavra > span", el);
  };
  const splits = new Map();
  if (anima) $$("[data-split]").forEach((el) => splits.set(el, dividir(el)));

  /* ── Contadores ─────────────────────────────────────────────────────── */
  const contar = (el, para, dur = 1.8) => {
    const de = parseFloat(el.dataset.atual || 0);
    if (!anima) { el.textContent = fmt(para); el.dataset.atual = para; return; }
    const o = { v: de };
    gsap.to(o, { v: para, duration: dur, ease: "power3.out", onUpdate: () => (el.textContent = fmt(o.v)) });
    el.dataset.atual = para;
  };

  /* ── Tratamentos (acordeão + card que muda) ─────────────────────────── */
  const itens = $$(".trat-lista li");
  const card = $(".card-preco");
  const precoEl = $("[data-preco]", card), tagEl = $("[data-tag]", card);
  const ativarTrat = (li) => {
    if (li.classList.contains("ativo")) return;
    itens.forEach((x) => { x.classList.toggle("ativo", x === li); $(".trat-cab", x).setAttribute("aria-expanded", String(x === li)); });
    const d = li.dataset;
    const trocar = () => {
      tagEl.innerHTML = `${d.tag} <em>${d.unid}</em>`;
      $("[data-resumo]", card).textContent = d.resumo;
      $("[data-s1l]", card).textContent = d.s1l;
      $("[data-s2l]", card).textContent = d.s2l;
    };
    const alvoPreco = parseInt(d.preco.replace(/\D/g, ""), 10);
    if (!anima) { trocar(); precoEl.textContent = d.preco; $("[data-s1]", card).textContent = d.s1; $("[data-s2]", card).textContent = d.s2; return; }
    const o = { v: parseInt(precoEl.textContent.replace(/\D/g, ""), 10) };
    gsap.to(o, { v: alvoPreco, duration: 1.1, ease: "power3.out", onUpdate: () => (precoEl.textContent = "R$ " + fmt(o.v)) });
    contar($("[data-s1]", card), +d.s1, 1.1);
    contar($("[data-s2]", card), +d.s2, 1.1);
    gsap.timeline()
      .to([tagEl, "[data-resumo]", "[data-s1l]", "[data-s2l]"].map((s) => (typeof s === "string" ? $(s, card) : s)), { opacity: 0, y: -8, duration: 0.25, stagger: 0.03 })
      .add(trocar)
      .to([tagEl, $("[data-resumo]", card), $("[data-s1l]", card), $("[data-s2l]", card)], { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "expo.out" });
    const linha = $(".curva-linha", card), L = linha.getTotalLength();
    gsap.fromTo(linha, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" });
    gsap.fromTo(".foto--yoga img", { scale: 1.08 }, { scale: 1, duration: 1.6, ease: "expo.out" });
  };
  itens.forEach((li) => $(".trat-cab", li).addEventListener("click", () => { ativarTrat(li); setTimeout(() => window.ScrollTrigger && ScrollTrigger.refresh(), 750); }));
  $$("[data-s1],[data-s2]", card).forEach((el) => (el.dataset.atual = el.textContent));

  /* ── Produtos ───────────────────────────────────────────────────────── */
  const produtos = [
    { nome: "Aurora", img: "frasco-verde", desc: "Creme matinal revitalizante que nutre a pele com antioxidantes.", preco: 129, off: "20% OFF", tipo: "Creme matinal" },
    { nome: "Clareza", img: "frasco-azul", desc: "Gel de limpeza diária que controla a oleosidade sem ressecar a pele.", preco: 98, off: "", tipo: "Tratamento de acne" },
    { nome: "Equilíbrio", img: "frasco-laranja", desc: "Sérum leve com vitamina C que uniformiza o tom da pele do corpo.", preco: 112, off: "Novo", tipo: "Sérum corporal" },
    { nome: "Brilho", img: "frasco-marinho", desc: "Creme noturno com peptídeos que repara a pele enquanto você dorme.", preco: 145, off: "", tipo: "Creme noturno" },
  ];
  let pAtual = 0;
  const miniA = $('[data-mini="a"]'), miniB = $('[data-mini="b"]');
  const mini = (i) => `<button class="mini" data-i="${i}" aria-label="Ver ${produtos[i].nome}"><img src="assets/img/${produtos[i].img}.webp" alt="" loading="lazy"><span>${produtos[i].nome}</span></button>`;
  const desenharMinis = () => {
    const outros = [1, 2, 3].map((k) => (pAtual + k) % produtos.length);
    miniA.innerHTML = mini(outros[0]) + mini(outros[1]);
    miniB.innerHTML = mini(outros[2]) + `<a class="mini mini--todos" href="#agendar"><span style="opacity:1;transform:none">Ver linha completa →</span></a>`;
    $$(".mini[data-i]").forEach((b) => b.addEventListener("click", () => irProduto(+b.dataset.i)));
    if (anima) gsap.from(".miniaturas .mini", { opacity: 0, y: 24, stagger: 0.06, duration: 0.8, ease: "expo.out" });
  };
  const setasProd = $$(".paginacao .seta");
  const irProduto = (i) => {
    const dir = i > pAtual || (pAtual === produtos.length - 1 && i === 0) ? 1 : -1;
    pAtual = (i + produtos.length) % produtos.length;
    const p = produtos[pAtual];
    const img = $("[data-prod-img]"), caixa = $(".prod-img");
    const aplicarTexto = () => {
      $("[data-prod-nome]").textContent = p.nome;
      $("[data-prod-desc]").textContent = p.desc;
      $("[data-prod-preco]").textContent = `Comprar agora (R$ ${p.preco})`;
      const off = $("[data-off]"); off.textContent = p.off; off.style.display = p.off ? "" : "none";
      $("[data-pag]").textContent = pAtual + 1;
      setasProd[0].disabled = pAtual === 0;
    };
    if (!anima) { img.src = `assets/img/${p.img}.webp`; aplicarTexto(); desenharMinis(); return; }
    const nova = img.cloneNode(); nova.src = `assets/img/${p.img}.webp`; nova.removeAttribute("data-prod-img");
    caixa.appendChild(nova);
    gsap.timeline({ onComplete: () => { img.src = nova.src; nova.remove(); } })
      .fromTo(nova, { clipPath: dir > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)", scale: 1.15 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.2, ease: "expo.inOut" })
      .to(img, { scale: 0.92, xPercent: -8 * dir, duration: 1.2, ease: "expo.inOut" }, 0)
      .set(img, { scale: 1, xPercent: 0 });
    gsap.timeline()
      .to(".prod-info > *", { opacity: 0, y: -14, duration: 0.3, stagger: 0.04, ease: "power2.in" })
      .add(aplicarTexto)
      .to(".prod-info > *", { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: "expo.out" });
    desenharMinis();
  };
  setasProd[0].addEventListener("click", () => irProduto(pAtual - 1));
  setasProd[1].addEventListener("click", () => irProduto(pAtual + 1));
  setasProd[0].disabled = true;
  desenharMinis();
  $$(".chips--suave button").forEach((b) => b.addEventListener("click", () => {
    $$(".chips--suave button").forEach((x) => x.classList.toggle("ativo", x === b));
    irProduto(pAtual + 1);
  }));

  /* ── Depoimentos ────────────────────────────────────────────────────── */
  const depos = [
    { foto: "depoimento", nome: "Camila Andrade", tempo: "Paciente há 2 anos", texto: "Fazer parte de um programa guiado mudou a minha rotina de um jeito real. Pela primeira vez, ser constante ficou leve." },
    { foto: "sobre-retrato", nome: "Juliana Reis", tempo: "Paciente há 8 meses", texto: "Cheguei cansada de dietas prontas. Aqui o plano partiu da minha rotina de verdade, e foi isso que fez durar." },
    { foto: "avatar", nome: "Marina Costa", tempo: "Paciente há 1 ano", texto: "O acompanhamento é próximo de verdade. Cada ajuste fez sentido e eu sempre soube o porquê de cada passo." },
  ];
  let dAtual = 0, dTimer = null;
  $("[data-depo-avatar]").src = "assets/img/depoimento.webp";
  const irDepo = (i) => {
    dAtual = (i + depos.length) % depos.length;
    const d = depos[dAtual];
    const aplicar = () => {
      $("[data-depo-texto]").textContent = d.texto;
      $("[data-depo-nome]").textContent = d.nome;
      $("[data-depo-tempo]").textContent = d.tempo;
      $("[data-depo-avatar]").src = `assets/img/${d.foto}.webp`;
      $("[data-depo-pag]").textContent = dAtual + 1;
    };
    const foto = $("[data-depo-foto]");
    if (!anima) { foto.src = `assets/img/${d.foto}.webp`; aplicar(); return; }
    gsap.timeline()
      .to(foto, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.55, ease: "power3.in" })
      .set(foto, { attr: { src: `assets/img/${d.foto}.webp` } })
      .fromTo(foto, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.2 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1, ease: "expo.out" });
    gsap.timeline()
      .to([".depo-card blockquote", ".depo-card figcaption"], { opacity: 0, y: -16, duration: 0.35, stagger: 0.05, ease: "power2.in" })
      .add(() => {
        aplicar();
        const q = $("[data-depo-texto]");
        const palavras = dividir(q);
        gsap.set(q, { opacity: 1, y: 0 });
        gsap.from(palavras, { yPercent: 110, duration: 1, stagger: 0.02, ease: "expo.out" });
      })
      .to(".depo-card figcaption", { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" }, "+=0.2");
  };
  const reiniciarDepo = () => { clearInterval(dTimer); dTimer = setInterval(() => irDepo(dAtual + 1), 8000); };
  $$("[data-depo]").forEach((b) => b.addEventListener("click", () => { irDepo(dAtual + +b.dataset.depo); reiniciarDepo(); }));
  new IntersectionObserver(([e]) => (e.isIntersecting ? reiniciarDepo() : clearInterval(dTimer))).observe($(".depo"));

  /* ── Dúvidas (acordeão com altura animada) ──────────────────────────── */
  const detalhes = $$(".faq-lista details");
  const fechar = (d) => {
    const r = $(".faq-resp", d);
    if (!anima) { d.open = false; return; }
    gsap.to(r, { height: 0, duration: 0.6, ease: "expo.inOut", onComplete: () => { d.open = false; r.style.height = ""; ScrollTrigger.refresh(); } });
    d.classList.add("fechando");
  };
  detalhes.forEach((d) => $("summary", d).addEventListener("click", (e) => {
    e.preventDefault();
    if (d.open) return fechar(d);
    detalhes.filter((x) => x !== d && x.open).forEach(fechar);
    d.open = true;
    if (anima) {
      const r = $(".faq-resp", d);
      gsap.fromTo(r, { height: 0 }, { height: "auto", duration: 0.8, ease: "expo.out", onComplete: () => ScrollTrigger.refresh() });
      gsap.fromTo($("p", r), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.1, ease: "expo.out" });
    }
  }));

  /* ── Formulário → e-mail ────────────────────────────────────────────── */
  if (form && S.contato) {
    const status = $(".form-status", form), botao = $("button[type=submit]", form);
    const avisar = (t, tipo) => { status.textContent = t; status.className = `form-status campo--inteiro ${tipo || ""}`; };
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      if (form.elements._honey.value) return;
      let ok = true;
      $$("[required]", form).forEach((c) => {
        const v = c.type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.value) : c.value.trim().length > 1;
        c.closest(".campo").classList.toggle("erro", !v);
        if (!v) ok = false;
      });
      if (!ok) return avisar("Confira os campos destacados.", "falha");
      const dados = Object.fromEntries(new FormData(form)); delete dados._honey;
      const assunto = S.contato.assunto || `Novo contato pelo site ${S.nome || ""}`;
      const [url, corpo] = S.contato.web3formsChave
        ? ["https://api.web3forms.com/submit", { access_key: S.contato.web3formsChave, subject: assunto, from_name: S.nome, ...dados }]
        : [`https://formsubmit.co/ajax/${encodeURIComponent(S.contato.email)}`, { _subject: assunto, _template: "table", _captcha: "false", ...dados }];
      botao.disabled = true; avisar("Enviando…");
      try {
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(corpo) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j.success === false || j.success === "false") throw new Error(j.message || r.status);
        form.reset(); avisar("Recebemos seu contato. Em breve falamos com você.", "ok");
      } catch (e) {
        console.warn("Falha no envio do formulário:", e);
        avisar("Não foi possível enviar agora. Chame a gente no WhatsApp.", "falha");
      } finally { botao.disabled = false; }
    });
  }

  if (!anima) return;

  /* ══════════════════ ANIMAÇÕES ══════════════════ */
  gsap.registerPlugin(ScrollTrigger);
  const EXPO = "expo.out";

  // Abertura
  const intro = gsap.timeline({ defaults: { ease: EXPO } });
  intro
    .fromTo(".hero-midia img", { scale: 1.28, filter: "blur(14px) brightness(.6)" }, { scale: 1, filter: "blur(0px) brightness(1)", duration: 2.6 })
    .from(".hero-veu", { opacity: 0, duration: 1.6 }, 0)
    .from(matchMedia("(min-width: 901px)").matches ? ".marca, .menu" : ".marca, .menu-botao", { y: -24, opacity: 0, duration: 1.2, stagger: 0.1, clearProps: "opacity,transform" }, 0.5)
    .from(splits.get($(".hero-titulo")), { yPercent: 115, duration: 1.4, stagger: 0.045 }, 0.7)
    .to(".hero-entra", { opacity: 1, duration: 1.2, stagger: 0.12 }, 1.3)
    .from(".hero-entra", { y: 24, duration: 1.2, stagger: 0.12 }, 1.3);

  // Hero na rolagem: imagem desce devagar, texto sobe e some
  gsap.to(".hero-midia img", { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-base, .selo", { y: -90, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "35% top", end: "bottom top", scrub: true } });

  // Títulos palavra a palavra
  splits.forEach((palavras, el) => {
    if (el.classList.contains("hero-titulo")) return;
    gsap.from(palavras, { yPercent: 115, duration: 1.3, stagger: 0.035, ease: EXPO, scrollTrigger: { trigger: el, start: "top 86%" } });
  });

  // Linhas dos rótulos
  $$(".rotulo").forEach((r) => {
    gsap.to(r, { "--linha-x": 1, duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: r, start: "top 92%" } });
    gsap.from(r.children, { y: 12, opacity: 0, duration: 1, stagger: 0.1, ease: EXPO, scrollTrigger: { trigger: r, start: "top 92%" } });
  });

  // Fotos: cortina de baixo para cima + zoom
  $$(".revela").forEach((f) => {
    const img = $("img", f);
    const tl = gsap.timeline({ scrollTrigger: { trigger: f, start: "top 88%" } });
    tl.to(f, { clipPath: "inset(0% 0% 0% 0% round 24px)", duration: 1.5, ease: "expo.inOut" });
    if (img && !img.hasAttribute("data-paralaxe")) tl.from(img, { scale: 1.3, duration: 2, ease: EXPO }, 0.1);
    const extras = $$("figcaption, .card-kcal, .card-preco, .comprar, .tag-off", f);
    if (extras.length) tl.from(extras, { y: 40, opacity: 0, duration: 1.2, stagger: 0.12, ease: EXPO }, 0.8);
  });

  // Paralaxe dentro das fotos
  $$("[data-paralaxe]").forEach((img) => {
    gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: img.closest("figure"), start: "top bottom", end: "bottom top", scrub: true } });
  });

  // Blocos que sobem
  $$(".sobe").forEach((el) => {
    gsap.fromTo(el, { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: 1.3, ease: EXPO, scrollTrigger: { trigger: el, start: "top 90%" } });
  });
  $$(".chips--sobe").forEach((ul) => {
    gsap.fromTo($$("li", ul), { y: 20, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.05, ease: "back.out(1.6)", scrollTrigger: { trigger: ul, start: "top 90%" } });
  });

  // Números, barras e gráfico
  $$("[data-conta]").forEach((el) => ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => contar(el, +el.dataset.conta, 2) }));
  gsap.from(".barras-semana .barra", { scaleX: 0, duration: 1.4, stagger: 0.15, ease: "expo.inOut", scrollTrigger: { trigger: ".card-lima", start: "top 88%" } });
  gsap.from(".kcal-barras i", { scaleY: 0, duration: 1, stagger: 0.04, ease: "back.out(1.4)", scrollTrigger: { trigger: ".card-kcal", start: "top 85%" } });
  $$(".progresso i").forEach((i) => gsap.from(i, { scaleX: 0, duration: 1.8, ease: "expo.inOut", scrollTrigger: { trigger: i, start: "top 95%" } }));
  const curva = $(".curva-linha"), L = curva.getTotalLength();
  gsap.fromTo(curva, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut", scrollTrigger: { trigger: ".card-preco", start: "top 92%" } });

  // Anéis giram com a rolagem
  $$(".aneis.girar").forEach((a) => gsap.to(a, { rotate: 180, ease: "none", scrollTrigger: { trigger: a, start: "top bottom", end: "bottom top", scrub: 1 } }));

  // Listas
  gsap.from(".trat-lista li", { y: 40, opacity: 0, duration: 1.1, stagger: 0.1, ease: EXPO, scrollTrigger: { trigger: ".trat-lista", start: "top 85%" } });
  gsap.from(".faq-lista details", { y: 40, opacity: 0, duration: 1.1, stagger: 0.08, ease: EXPO, scrollTrigger: { trigger: ".faq-lista", start: "top 85%" } });
  gsap.from(".vitrine-esq, .vitrine-dir", { y: 50, opacity: 0, duration: 1.3, stagger: 0.15, ease: EXPO, scrollTrigger: { trigger: ".vitrine", start: "top 85%" } });

  // Bloco de depoimentos se abre
  gsap.fromTo(".depo", { clipPath: "inset(6% 4% 6% 4% round 48px)" }, { clipPath: "inset(0% 0% 0% 0% round 32px)", ease: "none", scrollTrigger: { trigger: ".depo-moldura", start: "top bottom", end: "top 30%", scrub: true } });

  // Rodapé
  gsap.from(".rodape-dados > *", { y: 24, opacity: 0, duration: 1, stagger: 0.04, ease: EXPO, scrollTrigger: { trigger: ".rodape", start: "top 80%" } });
  gsap.fromTo(".rodape-marca", { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: ".rodape-marca", start: "top bottom", end: "bottom bottom", scrub: true } });

  // Botões magnéticos (só com mouse)
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".btn, .seta, .menu-cta").forEach((b) => {
      const xTo = gsap.quickTo(b, "x", { duration: 0.6, ease: "elastic.out(1, .4)" });
      const yTo = gsap.quickTo(b, "y", { duration: 0.6, ease: "elastic.out(1, .4)" });
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.18);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      b.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  addEventListener("load", () => ScrollTrigger.refresh());
})();

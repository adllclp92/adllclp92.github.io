/* Amicale des locataires – le Clos La Paume
   Affiche le contenu défini dans data/content.js (géré par le logiciel de gestion). */
(function () {
  "use strict";

  var D = window.SITE_DATA || {};
  var accueil = D.accueil || {};
  var affiches = (D.affiches || []).slice();
  var gazettes = (D.gazettes || []).slice();

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function url(p) { return encodeURI(p || ""); }
  function fmt(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T12:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }
  function moisAnnee(iso) {
    var d = new Date(iso + "T12:00:00");
    return isNaN(d) ? "" : d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }
  function parDate(a, b) { return (b.date || "").localeCompare(a.date || ""); }
  function estImage(f) { return /\.(png|jpe?g|gif|webp)$/i.test(f || ""); }
  function paragraphes(t) {
    return String(t || "").split(/\n\s*\n/).filter(function (p) { return p.trim(); })
      .map(function (p) { return "<p>" + esc(p.trim()).replace(/\n/g, "<br>") + "</p>"; }).join("");
  }
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Accueil ---------- */
  if (accueil.titre) $("intro-titre").textContent = accueil.titre;
  $("intro-sous-titre").textContent = accueil.sous_titre || "";
  $("intro-texte").innerHTML = paragraphes(accueil.texte);
  if (accueil.bandeau && accueil.bandeau.trim()) {
    $("bandeau").textContent = accueil.bandeau;
    $("bandeau").hidden = false;
  }
  $("pied-texte").textContent = accueil.pied || "";
  var email = D.contact || "amicalelapaume@gmail.com";
  var mailto = "mailto:" + email + "?subject=" + encodeURIComponent("Contact depuis le site de l'amicale");
  var fenetre = $("contact-fenetre");
  var champ = $("contact-email");
  var okMsg = $("contact-copie-ok");
  champ.value = email;
  champ.size = Math.max(email.length, 10);
  $("contact-ecrire").href = mailto;
  Array.prototype.forEach.call(document.querySelectorAll(".email-texte"), function (el) { el.textContent = email; });
  ["contact-nav", "contact-footer"].forEach(function (id) {
    var lien = $(id);
    lien.href = mailto;
    lien.title = email;
    lien.addEventListener("click", function (e) {
      if (!fenetre.showModal) return; /* très vieux navigateur : ouvre la messagerie */
      e.preventDefault();
      okMsg.textContent = "";
      fenetre.showModal();
      champ.focus();
      champ.select();
    });
  });
  champ.addEventListener("focus", function () { champ.select(); });
  champ.addEventListener("click", function () { champ.select(); });
  $("contact-copier").addEventListener("click", function () {
    function reussi() { okMsg.textContent = "Adresse copiée ! Collez-la dans votre messagerie."; }
    function secours() {
      champ.focus();
      champ.select();
      champ.setSelectionRange(0, champ.value.length);
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      okMsg.textContent = ok ? "Adresse copiée ! Collez-la dans votre messagerie."
        : "Sélectionnez l'adresse ci-dessus puis faites Ctrl+C (ou appui long › Copier sur téléphone).";
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(reussi, secours);
    } else {
      secours();
    }
  });
  fenetre.querySelector(".fermer").addEventListener("click", function () { fenetre.close(); });
  fenetre.addEventListener("click", function (e) { if (e.target === fenetre) fenetre.close(); });

  /* ---------- Documents : affiches et gazettes ----------
     Chaque document a une ou plusieurs pages (images). Dès qu'il y en a plusieurs,
     il se lit en carrousel ; le bouton « plein écran » ouvre le visualiseur. */
  var docs = {};
  var reduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pagesDe(e) {
    if (e.pages && e.pages.length) return e.pages;
    return estImage(e.fichier) ? [e.fichier] : [];
  }
  function inscrire(cle, e) {
    var pages = pagesDe(e);
    docs[cle] = { titre: e.titre, pages: pages, pdf: /\.pdf$/i.test(e.fichier || "") ? e.fichier : "" };
    return pages;
  }
  function iconePdf(t) {
    return '<svg width="' + t + '" height="' + t + '" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">' +
      '<path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V9h5.5L13 3.5ZM7 13v5h1.3v-1.6h.8a1.7 1.7 0 0 0 0-3.4H7Zm1.3 1.1h.8a.6.6 0 0 1 0 1.2h-.8v-1.2Zm3.2-1.1v5h1.6a2.5 2.5 0 0 0 0-5h-1.6Zm1.3 1.1h.3a1.4 1.4 0 0 1 0 2.8h-.3v-2.8Zm3.2-1.1v5h1.3v-2h1.7v-1.1H17.3v-.8h1.9V13H16Z"/></svg>';
  }
  function iconeEcran() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M4 4h6v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z"/></svg>';
  }
  function plein(cle, page, texte) {
    return '<button class="btn btn-outline btn-ecran" type="button" data-doc="' + esc(cle) + '" data-page="' + (page || 0) + '">' +
      iconeEcran() + esc(texte || "Plein écran") + "</button>";
  }

  /* Carrousel intégré à la page (glissement tactile, flèches, points, clavier) */
  function carrouselHtml(cle, titre, pages) {
    var diapos = pages.map(function (src, i) {
      return '<div class="car-diapo" role="group" aria-roledescription="page" aria-label="Page ' + (i + 1) + " sur " + pages.length + '">' +
        '<button class="car-img" type="button" data-doc="' + esc(cle) + '" data-page="' + i + '" title="Ouvrir en plein écran">' +
        '<img src="' + esc(url(src)) + '" alt="' + esc(titre) + " – page " + (i + 1) + " sur " + pages.length + '"' +
        (i < 2 ? "" : ' loading="lazy"') + "></button></div>";
    }).join("");
    var points = pages.map(function (_, i) {
      return '<button class="car-point' + (i === 0 ? " is-active" : "") + '" type="button" data-aller="' + i +
        '" aria-label="Aller à la page ' + (i + 1) + '"></button>';
    }).join("");
    return '<div class="carrousel" role="region" aria-roledescription="carrousel" aria-label="' + esc(titre) + " – " + pages.length + ' pages">' +
      '<div class="car-piste" tabindex="0" aria-label="Pages du document, utilisez les flèches gauche et droite">' + diapos + "</div>" +
      '<button class="car-fleche car-prec" type="button" aria-label="Page précédente" disabled>&#8249;</button>' +
      '<button class="car-fleche car-suiv" type="button" aria-label="Page suivante">&#8250;</button>' +
      '<div class="car-bas"><span class="car-compteur" aria-live="polite">Page 1 / ' + pages.length + "</span>" +
      '<span class="car-points">' + points + "</span></div></div>";
  }
  function initCarrousel(c) {
    var piste = c.querySelector(".car-piste");
    var prec = c.querySelector(".car-prec");
    var suiv = c.querySelector(".car-suiv");
    var compteur = c.querySelector(".car-compteur");
    var points = c.querySelectorAll(".car-point");
    var n = piste.children.length;
    var raf = 0;
    function courant() { return Math.max(0, Math.min(n - 1, Math.round(piste.scrollLeft / (piste.clientWidth || 1)))); }
    function maj() {
      var i = courant();
      compteur.textContent = "Page " + (i + 1) + " / " + n;
      prec.disabled = i === 0;
      suiv.disabled = i === n - 1;
      Array.prototype.forEach.call(points, function (p, k) { p.classList.toggle("is-active", k === i); });
    }
    function aller(i) {
      i = Math.max(0, Math.min(n - 1, i));
      piste.scrollTo({ left: i * piste.clientWidth, behavior: reduit ? "auto" : "smooth" });
    }
    piste.addEventListener("scroll", function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(maj); }, { passive: true });
    prec.addEventListener("click", function () { aller(courant() - 1); });
    suiv.addEventListener("click", function () { aller(courant() + 1); });
    Array.prototype.forEach.call(points, function (p) {
      p.addEventListener("click", function () { aller(parseInt(p.getAttribute("data-aller"), 10)); });
    });
    piste.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); aller(courant() + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); aller(courant() - 1); }
      else if (e.key === "Home") { e.preventDefault(); aller(0); }
      else if (e.key === "End") { e.preventDefault(); aller(n - 1); }
    });
    window.addEventListener("resize", function () { piste.scrollLeft = courant() * piste.clientWidth; });
  }

  /* ---------- À la une : affiches ouvertes, les unes sous les autres ---------- */
  var actives = affiches.filter(function (a) { return !a.archive; }).sort(parDate);
  var zoneAff = $("affiches");
  if (!actives.length) {
    zoneAff.innerHTML = '<p class="vide">Aucune affiche pour le moment. Revenez bientôt&nbsp;!</p>';
  } else {
    zoneAff.innerHTML = actives.map(function (a, n) {
      var cle = "affiche:" + (a.id || n);
      var pages = inscrire(cle, a);
      var estPdf = /\.pdf$/i.test(a.fichier || "");
      var visuel, actions = "";
      if (pages.length > 1) {
        visuel = carrouselHtml(cle, "Affiche : " + a.titre, pages);
        actions += plein(cle, 0, "Plein écran");
      } else if (pages.length === 1) {
        visuel = '<button class="affiche-page" type="button" data-doc="' + esc(cle) + '" data-page="0" title="Ouvrir en plein écran">' +
          '<img src="' + esc(url(pages[0])) + '" alt="Affiche : ' + esc(a.titre) + '"' + (n === 0 ? "" : ' loading="lazy"') + "></button>";
        actions += plein(cle, 0, "Agrandir");
      } else {
        visuel = '<object class="affiche-objet" data="' + esc(url(a.fichier)) + '#view=FitH" type="application/pdf">' +
          '<a class="affiche-pdf" href="' + esc(url(a.fichier)) + '" target="_blank" rel="noopener">' + iconePdf(56) +
          "<span>Ouvrir l'affiche</span></a></object>";
      }
      if (estPdf) actions += '<a class="btn btn-outline" href="' + esc(url(a.fichier)) + '" download>Télécharger (PDF)</a>';
      return '<article class="affiche">' +
        '<header class="affiche-tete">' +
        (a.date ? '<span class="date">' + esc(fmt(a.date)) + "</span>" : "") +
        "<h3>" + esc(a.titre) + "</h3>" +
        (a.description ? "<p>" + esc(a.description).replace(/\n/g, "<br>") + "</p>" : "") +
        "</header>" +
        '<div class="affiche-visuel">' + visuel + "</div>" +
        '<div class="affiche-actions">' + actions + "</div></article>";
    }).join("");
    Array.prototype.forEach.call(zoneAff.querySelectorAll(".carrousel"), initCarrousel);
  }

  /* ---------- La gazette ---------- */
  var gActives = gazettes.filter(function (g) { return !g.archive; }).sort(parDate);
  var zoneGaz = $("gazettes");
  function numero(g) { return g.numero ? "N°&nbsp;" + esc(g.numero) : "PDF"; }
  function nbPages(pages) { return pages.length > 1 ? pages.length + " pages" : ""; }
  function couverture(cle, g, pages, classe) {
    if (pages.length) {
      return '<button class="' + classe + '" type="button" data-doc="' + esc(cle) + '" data-page="0" aria-label="Lire « ' + esc(g.titre) + ' » en ligne">' +
        '<img src="' + esc(url(pages[0])) + '" alt="Couverture de la gazette ' + esc(g.titre) + '" loading="lazy"></button>';
    }
    return '<div class="journal" aria-hidden="true">' + (classe === "gazette-couv" ? "<small>LA GAZETTE</small>" : "") + (g.numero ? esc(g.numero) : "") + "</div>";
  }
  if (!gActives.length) {
    zoneGaz.innerHTML = '<p class="vide">Aucune gazette pour le moment.</p>';
  } else {
    var g0 = gActives[0];
    var cle0 = "gazette:" + (g0.id || 0);
    var pages0 = inscrire(cle0, g0);
    var infos0 = [g0.numero ? "Numéro " + esc(g0.numero) : "", g0.date ? esc(moisAnnee(g0.date)) : "", nbPages(pages0)].filter(Boolean).join(" · ");
    var html = '<article class="gazette-une">' + couverture(cle0, g0, pages0, "gazette-couv") +
      "<div><span class=\"gazette-badge\">Dernier numéro</span>" +
      "<h3>" + esc(g0.titre) + "</h3>" +
      "<p>" + infos0 + "</p>" +
      (g0.description ? "<p>" + esc(g0.description) + "</p>" : "") +
      '<div class="actions">' +
      (pages0.length
        ? '<button class="btn btn-primary" type="button" data-doc="' + esc(cle0) + '" data-page="0">Lire en ligne</button>'
        : '<a class="btn btn-primary" href="' + esc(url(g0.fichier)) + '" target="_blank" rel="noopener">Lire la gazette</a>') +
      '<a class="btn btn-outline" href="' + esc(url(g0.fichier)) + '" download>Télécharger (PDF)</a>' +
      "</div></div></article>";
    if (gActives.length > 1) {
      html += '<div class="grid-gazettes">' + gActives.slice(1).map(function (g, k) {
        var cle = "gazette:" + (g.id || (k + 1));
        var pages = inscrire(cle, g);
        return '<article class="gazette">' + couverture(cle, g, pages, "gazette-mini") +
          "<div><h3>" + esc(g.titre) + "</h3>" +
          '<span class="date">' + esc(moisAnnee(g.date)) + (pages.length > 1 ? " · " + pages.length + " pages" : "") + "</span>" +
          '<div class="liens">' +
          (pages.length
            ? '<button class="lien-bouton" type="button" data-doc="' + esc(cle) + '" data-page="0" aria-label="Lire « ' + esc(g.titre) + ' » en ligne">Lire</button>'
            : '<a href="' + esc(url(g.fichier)) + '" target="_blank" rel="noopener">Lire</a>') +
          '<a href="' + esc(url(g.fichier)) + '" download>Télécharger</a></div></div></article>';
      }).join("") + "</div>";
    }
    zoneGaz.innerHTML = html;
  }

  /* ---------- Archives ---------- */
  var archives = affiches.filter(function (a) { return a.archive; }).map(function (a) { return Object.assign({ type: "affiche" }, a); })
    .concat(gazettes.filter(function (g) { return g.archive; }).map(function (g) { return Object.assign({ type: "gazette" }, g); }))
    .sort(parDate);
  var zoneArch = $("liste-archives");

  function rendreArchives(filtre) {
    var liste = archives.filter(function (x) { return filtre === "tout" || x.type === filtre; });
    if (!liste.length) {
      zoneArch.innerHTML = '<p class="vide">Rien dans les archives pour le moment.</p>';
      return;
    }
    var parAnnee = {};
    liste.forEach(function (x) {
      var an = (x.date || "").slice(0, 4) || "Sans date";
      (parAnnee[an] = parAnnee[an] || []).push(x);
    });
    zoneArch.innerHTML = Object.keys(parAnnee).sort().reverse().map(function (an) {
      return '<h3 class="annee">' + esc(an) + '</h3><div class="liste-archives">' + parAnnee[an].map(function (x, k) {
        var cle = x.type + ":" + (x.id || (an + k));
        var pages = inscrire(cle, x);
        var vignette = pages.length
          ? '<span class="archive-vignette"><img src="' + esc(url(pages[0])) + '" alt="" loading="lazy"></span>'
          : '<span class="archive-vignette' + (x.type === "gazette" ? " is-gazette" : "") + '">' + (x.type === "gazette" ? numero(x) : "PDF") + "</span>";
        return '<a class="archive" href="' + esc(url(x.fichier)) + '" target="_blank" rel="noopener" data-doc="' + esc(cle) + '" data-page="0">' + vignette +
          "<span><strong>" + esc(x.titre) + "</strong>" +
          '<span class="meta"><span class="tag tag-' + x.type + '">' + (x.type === "affiche" ? "Affiche" : "Gazette") + "</span>" +
          esc(fmt(x.date)) + (pages.length > 1 ? " · " + pages.length + " pages" : "") + "</span></span></a>";
      }).join("") + "</div>";
    }).join("");
  }
  rendreArchives("tout");
  Array.prototype.forEach.call(document.querySelectorAll(".filtre"), function (b) {
    b.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".filtre"), function (o) {
        o.classList.toggle("is-active", o === b);
        o.setAttribute("aria-selected", o === b ? "true" : "false");
      });
      rendreArchives(b.getAttribute("data-filtre"));
    });
  });

  /* ---------- Visualiseur plein écran en carrousel ---------- */
  var vis = $("viewer");
  var vImg = $("viewer-img"), vCompteur = $("viewer-compteur"), vTitre = $("viewer-titre");
  var vDefile = $("viewer-defile"), vPrec = $("viewer-prec"), vSuiv = $("viewer-suiv");
  var vZoom = $("viewer-zoom"), vPdf = $("viewer-pdf"), vVign = $("viewer-vignettes");
  var vDoc = null, vIdx = 0, vOrigine = null;

  function vAfficher() {
    var n = vDoc.pages.length;
    vImg.src = url(vDoc.pages[vIdx]);
    vImg.alt = vDoc.titre + (n > 1 ? " – page " + (vIdx + 1) + " sur " + n : "");
    vCompteur.textContent = n > 1 ? "Page " + (vIdx + 1) + " / " + n : "";
    vPrec.hidden = vSuiv.hidden = n < 2;
    vPrec.disabled = vIdx === 0;
    vSuiv.disabled = vIdx === n - 1;
    Array.prototype.forEach.call(vVign.children, function (b, k) {
      var actif = k === vIdx;
      b.classList.toggle("is-active", actif);
      if (actif) {
        b.setAttribute("aria-current", "true");
        if (b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "center" });
      } else { b.removeAttribute("aria-current"); }
    });
    vDefile.scrollTop = 0;
    vDefile.scrollLeft = 0;
    [vIdx - 1, vIdx + 1].forEach(function (k) {
      if (k >= 0 && k < n) { var pre = new Image(); pre.src = url(vDoc.pages[k]); }
    });
  }
  function vAller(i) {
    if (!vDoc) return;
    i = Math.max(0, Math.min(vDoc.pages.length - 1, i));
    if (i !== vIdx) { vIdx = i; vAfficher(); }
  }
  function vZoomer(oui) {
    vis.classList.toggle("zoom", oui);
    vZoom.setAttribute("aria-pressed", oui ? "true" : "false");
    vZoom.querySelector("span").textContent = oui ? "Ajuster" : "Zoom";
    vZoom.setAttribute("aria-label", oui ? "Ajuster la page à l'écran" : "Zoomer sur la page");
    vDefile.scrollTop = 0;
    vDefile.scrollLeft = 0;
  }
  function ouvrirVisionneuse(doc, page, origine) {
    if (!vis.showModal) { window.open(url(doc.pages[page] || doc.pdf), "_blank"); return; }
    vDoc = doc;
    vIdx = Math.max(0, Math.min(doc.pages.length - 1, page || 0));
    vOrigine = origine || null;
    vTitre.textContent = doc.titre;
    vVign.innerHTML = "";
    vVign.hidden = doc.pages.length < 2;
    if (doc.pages.length > 1) {
      doc.pages.forEach(function (src, k) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Page " + (k + 1));
        b.innerHTML = '<img src="' + esc(url(src)) + '" alt="" loading="lazy">';
        b.addEventListener("click", function () { vAller(k); });
        vVign.appendChild(b);
      });
    }
    if (doc.pdf) { vPdf.href = url(doc.pdf); vPdf.hidden = false; } else { vPdf.hidden = true; }
    vZoomer(false);
    vAfficher();
    document.documentElement.classList.add("viewer-ouvert");
    vis.showModal();
    $("viewer-fermer").focus();
  }
  $("viewer-fermer").addEventListener("click", function () { vis.close(); });
  vis.addEventListener("close", function () {
    document.documentElement.classList.remove("viewer-ouvert");
    vImg.removeAttribute("src");
    if (vOrigine && document.contains(vOrigine) && vOrigine.focus) vOrigine.focus();
  });
  vPrec.addEventListener("click", function () { vAller(vIdx - 1); });
  vSuiv.addEventListener("click", function () { vAller(vIdx + 1); });
  vZoom.addEventListener("click", function () { vZoomer(!vis.classList.contains("zoom")); });
  vImg.addEventListener("click", function () { vZoomer(!vis.classList.contains("zoom")); });
  vis.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); vAller(vIdx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); vAller(vIdx - 1); }
    else if (e.key === "Home") { e.preventDefault(); vAller(0); }
    else if (e.key === "End") { e.preventDefault(); vAller(vDoc.pages.length - 1); }
  });
  var toucheX = null, toucheY = 0;
  vDefile.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1 || vis.classList.contains("zoom")) { toucheX = null; return; }
    toucheX = e.touches[0].clientX; toucheY = e.touches[0].clientY;
  }, { passive: true });
  vDefile.addEventListener("touchend", function (e) {
    if (toucheX === null) return;
    var dx = e.changedTouches[0].clientX - toucheX, dy = e.changedTouches[0].clientY - toucheY;
    toucheX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) vAller(vIdx + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* Clic sur n'importe quel élément « data-doc » : ouvre le visualiseur */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-doc]");
    if (!el || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var d = docs[el.getAttribute("data-doc")];
    if (!d || !d.pages.length) return; /* pas de pages : le lien PDF s'ouvre normalement */
    e.preventDefault();
    ouvrirVisionneuse(d, parseInt(el.getAttribute("data-page"), 10) || 0, el);
  });

  /* ---------- Compteur de visites ----------
     Service gratuit Abacus. Chaque navigateur n'est compté qu'une fois par jour :
     la date du dernier comptage est mémorisée dans le navigateur du visiteur. */
  (function () {
    var c = D.compteur || {};
    if (c.actif === false || !window.fetch) return;
    var espace = c.espace || "amicale-clos-la-paume-bagneux";
    var cle = c.cle || "visites-site";
    var memo = "amicale-derniere-visite-" + cle;
    var d = new Date();
    var aujourdhui = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    var local = /^(file:|)$/.test(location.protocol) || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    var dejaCompte = true;
    try { dejaCompte = localStorage.getItem(memo) === aujourdhui; } catch (e) { dejaCompte = true; }
    var action = (dejaCompte || local) ? "get" : "hit";
    fetch("https://abacus.jasoncameron.dev/" + action + "/" + espace + "/" + cle, { cache: "no-store" })
      .then(function (r) {
        if (r.status === 404) return { value: 0 };
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (j) {
        if (action === "hit") { try { localStorage.setItem(memo, aujourdhui); } catch (e) { /* ignoré */ } }
        var n = (parseInt(j.value, 10) || 0) + (parseInt(c.depart, 10) || 0);
        if (n < 1) return;
        $("compteur-valeur").textContent = n.toLocaleString("fr-FR") + (n > 1 ? " visites" : " visite");
        $("compteur").title = "Une visite est comptée une fois par personne et par jour";
        $("compteur").hidden = false;
      })
      .catch(function () { /* service indisponible : le compteur reste masqué */ });
  })();

  /* ---------- Menu actif au défilement ---------- */
  var liens = document.querySelectorAll(".nav-links a");
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Array.prototype.forEach.call(liens, function (l) {
          l.classList.toggle("is-current", l.getAttribute("href") === "#" + en.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    ["a-la-une", "la-gazette", "archives"].forEach(function (id) { obs.observe($(id)); });
  }
})();

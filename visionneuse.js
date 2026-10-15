/* Amicale des locataires – le Clos La Paume
   Visualiseur plein écran en carrousel — réservé aux GAZETTES.
   Toute balise portant data-doc="<clé>" (et data-page) ouvre le document correspondant. */
(function () {
  "use strict";
  var A = window.Amicale;
  var $ = A.$, esc = A.esc, url = A.url;
  var vis = $("viewer");
  if (!vis) return;

  var docs = {};
  var vImg = $("viewer-img"), vCompteur = $("viewer-compteur"), vTitre = $("viewer-titre");
  var vDefile = $("viewer-defile"), vPrec = $("viewer-prec"), vSuiv = $("viewer-suiv");
  var vZoom = $("viewer-zoom"), vPdf = $("viewer-pdf"), vVign = $("viewer-vignettes");
  var vDoc = null, vIdx = 0, vOrigine = null;

  function afficher() {
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
  function aller(i) {
    if (!vDoc) return;
    i = Math.max(0, Math.min(vDoc.pages.length - 1, i));
    if (i !== vIdx) { vIdx = i; afficher(); }
  }
  function zoomer(oui) {
    vis.classList.toggle("zoom", oui);
    vZoom.setAttribute("aria-pressed", oui ? "true" : "false");
    vZoom.querySelector("span").textContent = oui ? "Ajuster" : "Zoom";
    vZoom.setAttribute("aria-label", oui ? "Ajuster la page à l'écran" : "Zoomer sur la page");
    vDefile.scrollTop = 0;
    vDefile.scrollLeft = 0;
  }
  function ouvrir(doc, page, origine) {
    if (!vis.showModal) { window.open(url(doc.pdf || doc.pages[page]), "_blank"); return; }
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
        b.addEventListener("click", function () { aller(k); });
        vVign.appendChild(b);
      });
    }
    if (doc.pdf) { vPdf.href = url(doc.pdf); vPdf.hidden = false; } else { vPdf.hidden = true; }
    zoomer(false);
    afficher();
    document.documentElement.classList.add("viewer-ouvert");
    vis.showModal();
    $("viewer-fermer").focus();
    if (window.Suivi && doc.id) window.Suivi.evenement("gaz-" + doc.id);
  }

  $("viewer-fermer").addEventListener("click", function () { vis.close(); });
  vis.addEventListener("close", function () {
    document.documentElement.classList.remove("viewer-ouvert");
    vImg.removeAttribute("src");
    if (vOrigine && document.contains(vOrigine) && vOrigine.focus) vOrigine.focus();
  });
  vPrec.addEventListener("click", function () { aller(vIdx - 1); });
  vSuiv.addEventListener("click", function () { aller(vIdx + 1); });
  vZoom.addEventListener("click", function () { zoomer(!vis.classList.contains("zoom")); });
  vImg.addEventListener("click", function () { zoomer(!vis.classList.contains("zoom")); });
  vis.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); aller(vIdx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); aller(vIdx - 1); }
    else if (e.key === "Home") { e.preventDefault(); aller(0); }
    else if (e.key === "End") { e.preventDefault(); aller(vDoc.pages.length - 1); }
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
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) aller(vIdx + (dx < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-doc]");
    if (!el || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var d = docs[el.getAttribute("data-doc")];
    if (!d || !d.pages.length) return; /* sans pages : le lien PDF s'ouvre normalement */
    e.preventDefault();
    ouvrir(d, parseInt(el.getAttribute("data-page"), 10) || 0, el);
  });

  /* Enregistre une gazette et renvoie ses pages (images) */
  window.Visionneuse = {
    inscrire: function (cle, g) {
      var pages = A.pagesDe(g);
      docs[cle] = { id: g.id, titre: g.titre, pages: pages, pdf: A.estPdf(g.fichier) ? g.fichier : "" };
      return pages;
    }
  };
})();

/* Amicale des locataires – le Clos La Paume
   Outils communs à toutes les pages (données du site dans data/content.js). */
(function () {
  "use strict";
  var A = window.Amicale = {};
  var D = A.donnees = window.SITE_DATA || {};

  A.$ = function (id) { return document.getElementById(id); };
  A.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  A.url = function (p) { return encodeURI(p || ""); };
  A.fmt = function (iso) {
    if (!iso) return "";
    var d = new Date(iso + "T12:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };
  A.moisAnnee = function (iso) {
    var d = new Date(iso + "T12:00:00");
    return isNaN(d) ? "" : d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };
  A.parDate = function (a, b) { return (b.date || "").localeCompare(a.date || ""); };
  A.estImage = function (f) { return /\.(png|jpe?g|gif|webp)$/i.test(f || ""); };
  A.estPdf = function (f) { return /\.pdf$/i.test(f || ""); };
  A.paragraphes = function (t) {
    return String(t || "").split(/\n\s*\n/).filter(function (p) { return p.trim(); })
      .map(function (p) { return "<p>" + A.esc(p.trim()).replace(/\n/g, "<br>") + "</p>"; }).join("");
  };
  A.pagesDe = function (e) {
    if (e.pages && e.pages.length) return e.pages;
    return A.estImage(e.fichier) ? [e.fichier] : [];
  };
  /* Ordre d'affichage choisi dans le logiciel (champ « ordre »), à défaut du plus récent au plus ancien */
  A.ordonner = function (liste) {
    return liste.slice().sort(function (a, b) {
      var oa = typeof a.ordre === "number" ? a.ordre : 1e9;
      var ob = typeof b.ordre === "number" ? b.ordre : 1e9;
      return oa !== ob ? oa - ob : A.parDate(a, b);
    });
  };
  A.email = D.contact || "amicalelapaume@gmail.com";
  A.mailto = "mailto:" + A.email + "?subject=" + encodeURIComponent("Contact depuis le site de l'amicale");

  A.iconePdf = function (t) {
    return '<svg width="' + t + '" height="' + t + '" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">' +
      '<path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V9h5.5L13 3.5ZM7 13v5h1.3v-1.6h.8a1.7 1.7 0 0 0 0-3.4H7Zm1.3 1.1h.8a.6.6 0 0 1 0 1.2h-.8v-1.2Zm3.2-1.1v5h1.6a2.5 2.5 0 0 0 0-5h-1.6Zm1.3 1.1h.3a1.4 1.4 0 0 1 0 2.8h-.3v-2.8Zm3.2-1.1v5h1.3v-2h1.7v-1.1H17.3v-.8h1.9V13H16Z"/></svg>';
  };

  /* Affiche entière : toutes ses pages, les unes sous les autres, directement lisibles */
  A.afficheHtml = function (a, prioritaire) {
    var pages = A.pagesDe(a);
    var visuel, actions = "";
    if (pages.length) {
      visuel = pages.map(function (src, i) {
        var alt = "Affiche : " + a.titre + (pages.length > 1 ? " – page " + (i + 1) + " sur " + pages.length : "");
        return '<a class="affiche-page" href="' + A.esc(A.url(src)) + '" target="_blank" rel="noopener" title="Ouvrir l\'affiche en grand">' +
          '<img src="' + A.esc(A.url(src)) + '" alt="' + A.esc(alt) + '"' + (prioritaire && i === 0 ? "" : ' loading="lazy"') + "></a>";
      }).join("");
      actions += '<a class="btn btn-outline" href="' + A.esc(A.url(pages[0])) + '" target="_blank" rel="noopener">Ouvrir en grand</a>';
    } else {
      visuel = '<object class="affiche-objet" data="' + A.esc(A.url(a.fichier)) + '#view=FitH" type="application/pdf">' +
        '<a class="affiche-pdf" href="' + A.esc(A.url(a.fichier)) + '" target="_blank" rel="noopener">' + A.iconePdf(56) +
        "<span>Ouvrir l'affiche</span></a></object>";
    }
    if (A.estPdf(a.fichier)) {
      actions += '<a class="btn btn-outline" href="' + A.esc(A.url(a.fichier)) + '" download>Télécharger (PDF)</a>';
    }
    return '<article class="affiche">' +
      '<header class="affiche-tete">' +
      (a.date ? '<span class="date">' + A.esc(A.fmt(a.date)) + "</span>" : "") +
      "<h3>" + A.esc(a.titre) + "</h3>" +
      (a.description ? "<p>" + A.esc(a.description).replace(/\n/g, "<br>") + "</p>" : "") +
      "</header>" +
      '<div class="affiche-visuel">' + visuel + "</div>" +
      (actions ? '<div class="affiche-actions">' + actions + "</div>" : "") +
      "</article>";
  };
})();

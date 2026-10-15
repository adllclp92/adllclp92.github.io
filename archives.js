/* Page « Archives » : anciennes affiches, informations importantes et gazettes archivées. */
(function () {
  "use strict";
  var A = window.Amicale, D = A.donnees, $ = A.$, esc = A.esc, url = A.url;

  var lien = $("contact-nav");
  lien.href = A.mailto;
  lien.title = A.email;
  lien.addEventListener("click", function () { Suivi.evenement("contact"); });

  var imp = (D.importantes || []).filter(function (x) { return !x.archive; });
  if (imp.length) {
    var li = document.createElement("li");
    li.innerHTML = '<a class="nav-important" href="index.html#important">' + esc((D.accueil || {}).important_titre || "Information importante") + "</a>";
    var ul = document.querySelector(".nav-links");
    ul.insertBefore(li, ul.firstChild);
  }

  function marque(type) {
    return function (x) { return Object.assign({ type: type }, x); };
  }
  var archives = (D.affiches || []).filter(function (x) { return x.archive; }).map(marque("affiche"))
    .concat((D.importantes || []).filter(function (x) { return x.archive; }).map(marque("affiche")))
    .concat((D.gazettes || []).filter(function (x) { return x.archive; }).map(marque("gazette")))
    .sort(A.parDate);
  var zone = $("liste-archives");

  function rendre(filtre) {
    var liste = archives.filter(function (x) { return filtre === "tout" || x.type === filtre; });
    if (!liste.length) {
      zone.innerHTML = '<p class="vide">Rien dans les archives pour le moment.</p>';
      return;
    }
    var parAnnee = {};
    liste.forEach(function (x) {
      var an = (x.date || "").slice(0, 4) || "Sans date";
      (parAnnee[an] = parAnnee[an] || []).push(x);
    });
    zone.innerHTML = Object.keys(parAnnee).sort().reverse().map(function (an) {
      return '<h2 class="annee">' + esc(an) + '</h2><div class="liste-archives">' + parAnnee[an].map(function (x, k) {
        var gazette = x.type === "gazette";
        var cle = x.type + ":" + (x.id || (an + k));
        var pages = gazette ? Visionneuse.inscrire(cle, x) : A.pagesDe(x);
        var vignette = pages.length
          ? '<span class="archive-vignette"><img src="' + esc(url(pages[0])) + '" alt="" loading="lazy"></span>'
          : '<span class="archive-vignette' + (gazette ? " is-gazette" : "") + '">' + (gazette && x.numero ? esc(x.numero) : "PDF") + "</span>";
        /* gazette → visualiseur ; affiche → PDF, ou à défaut image en grand */
        var cible = A.estPdf(x.fichier) ? x.fichier : (pages[0] || x.fichier);
        return '<a class="archive" href="' + esc(url(cible)) + '" target="_blank" rel="noopener"' +
          (gazette ? ' data-doc="' + esc(cle) + '" data-page="0"' : "") + ">" + vignette +
          "<span><strong>" + esc(x.titre) + "</strong>" +
          '<span class="meta"><span class="tag tag-' + x.type + '">' + (gazette ? "Gazette" : "Affiche") + "</span>" +
          esc(A.fmt(x.date)) + (pages.length > 1 ? " · " + pages.length + " pages" : "") + "</span></span></a>";
      }).join("") + "</div>";
    }).join("");
  }
  rendre("tout");
  Array.prototype.forEach.call(document.querySelectorAll(".filtre"), function (b) {
    b.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".filtre"), function (o) {
        o.classList.toggle("is-active", o === b);
        o.setAttribute("aria-selected", o === b ? "true" : "false");
      });
      rendre(b.getAttribute("data-filtre"));
      A.reveler(".archive");
    });
  });
  A.reveler(".archive");
  Suivi.init("archives");
})();

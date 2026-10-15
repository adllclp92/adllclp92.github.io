/* Amicale des locataires – le Clos La Paume
   Page d'accueil : affiche le contenu défini dans data/content.js (géré par le logiciel de gestion). */
(function () {
  "use strict";

  var A = window.Amicale, D = A.donnees;
  var $ = A.$, esc = A.esc, url = A.url;
  var accueil = D.accueil || {};
  var actifs = function (l) { return (l || []).filter(function (x) { return !x.archive; }); };

  /* ---------- Accueil ---------- */
  if (accueil.titre) $("intro-titre").textContent = accueil.titre;
  $("intro-sous-titre").textContent = accueil.sous_titre || "";
  $("intro-texte").innerHTML = A.paragraphes(accueil.texte);
  if (accueil.bandeau && accueil.bandeau.trim()) {
    $("bandeau").textContent = accueil.bandeau;
    $("bandeau").hidden = false;
  }
  $("pied-texte").textContent = accueil.pied || "";

  /* ---------- Nous contacter ---------- */
  var email = A.email;
  var fenetre = $("contact-fenetre");
  var champ = $("contact-email");
  var okMsg = $("contact-copie-ok");
  champ.value = email;
  champ.size = Math.max(email.length, 10);
  $("contact-ecrire").href = A.mailto;
  Array.prototype.forEach.call(document.querySelectorAll(".email-texte"), function (el) { el.textContent = email; });
  ["contact-nav", "contact-footer"].forEach(function (id) {
    var lien = $(id);
    lien.href = A.mailto;
    lien.title = email;
    lien.addEventListener("click", function (e) {
      Suivi.evenement("contact");
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
    Suivi.evenement("copie");
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
  $("contact-ecrire").addEventListener("click", function () { Suivi.evenement("contact"); });
  fenetre.querySelector(".fermer").addEventListener("click", function () { fenetre.close(); });
  fenetre.addEventListener("click", function (e) { if (e.target === fenetre) fenetre.close(); });

  /* ---------- Information importante (zone masquée tant que rien n'est renseigné) ---------- */
  var imp = A.ordonner(actifs(D.importantes));
  if (imp.length) {
    $("important-titre").textContent = accueil.important_titre || "Information importante";
    $("important-liste").innerHTML = imp.map(function (a, n) { return A.afficheHtml(a, n === 0); }).join("");
    $("important").hidden = false;
    $("nav-important").hidden = false;
    $("nav-important").firstChild.textContent = accueil.important_titre || "Information importante";
  }

  /* ---------- À la une : affiches entières, les unes sous les autres ---------- */
  var affiches = A.ordonner(actifs(D.affiches));
  $("affiches").innerHTML = affiches.length
    ? affiches.map(function (a, n) { return A.afficheHtml(a, n === 0 && !imp.length); }).join("")
    : '<p class="vide">Aucune affiche pour le moment. Revenez bientôt&nbsp;!</p>';

  A.activerPdf(document);

  /* ---------- La gazette (lecture en ligne avec le visualiseur) ---------- */
  var gActives = actifs(D.gazettes).sort(A.parDate);
  var zoneGaz = $("gazettes");
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
    var pages0 = Visionneuse.inscrire(cle0, g0);
    var infos0 = [g0.numero ? "Numéro " + esc(g0.numero) : "", g0.date ? esc(A.moisAnnee(g0.date)) : "", nbPages(pages0)].filter(Boolean).join(" · ");
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
        var pages = Visionneuse.inscrire(cle, g);
        return '<article class="gazette">' + couverture(cle, g, pages, "gazette-mini") +
          "<div><h3>" + esc(g.titre) + "</h3>" +
          '<span class="date">' + esc(A.moisAnnee(g.date)) + (pages.length > 1 ? " · " + pages.length + " pages" : "") + "</span>" +
          '<div class="liens">' +
          (pages.length
            ? '<button class="lien-bouton" type="button" data-doc="' + esc(cle) + '" data-page="0" aria-label="Lire « ' + esc(g.titre) + ' » en ligne">Lire</button>'
            : '<a href="' + esc(url(g.fichier)) + '" target="_blank" rel="noopener">Lire</a>') +
          '<a href="' + esc(url(g.fichier)) + '" download>Télécharger</a></div></div></article>';
      }).join("") + "</div>";
    }
    zoneGaz.innerHTML = html;
  }

  Suivi.init("accueil");

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
    (imp.length ? ["important"] : []).concat(["a-la-une", "la-gazette"]).forEach(function (id) { obs.observe($(id)); });
  }
})();

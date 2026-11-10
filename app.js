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

  /* ---------- Information importante (zone masquée tant que rien n'est renseigné) ---------- */
  var imp = A.ordonner(actifs(D.importantes));
  if (imp.length) {
    $("important-titre").textContent = accueil.important_titre || "Information importante";
    $("important-liste").innerHTML = imp.map(function (a, n) { return A.afficheHtml(a, n === 0); }).join("");
    $("important").hidden = false;
  }

  /* ---------- À la une : affiches entières, les unes sous les autres ---------- */
  var affiches = A.ordonner(actifs(D.affiches));
  $("affiches").innerHTML = affiches.length
    ? affiches.map(function (a, n) { return A.afficheHtml(a, n === 0 && !imp.length); }).join("")
    : '<p class="vide">Aucune affiche pour le moment. Revenez bientôt&nbsp;!</p>';

  A.activerPdf(document);

  /* ---------- Dernier numéro de la gazette : encart en haut de page (lecture avec le visualiseur) ---------- */
  var gActives = actifs(D.gazettes).sort(A.parDate);
  function nbPages(pages) { return pages.length > 1 ? pages.length + " pages" : ""; }
  if (gActives.length) {
    var g0 = gActives[0];
    var cle0 = "gazette:" + (g0.id || 0);
    var pages0 = Visionneuse.inscrire(cle0, g0);
    var infos0 = [g0.numero ? "Numéro " + esc(g0.numero) : "", g0.date ? esc(A.moisAnnee(g0.date)) : "", nbPages(pages0)].filter(Boolean).join(" · ");
    /* Encart « Dernier numéro » à côté du texte de bienvenue */
    var ig = $("intro-gazette");
    var cover = pages0.length
      ? '<button class="aside-couv" type="button" data-doc="' + esc(cle0) + '" data-page="0" aria-label="Lire « ' + esc(g0.titre) + ' » en ligne"><img src="' + esc(url(pages0[0])) + '" alt="Couverture de ' + esc(g0.titre) + '"></button>'
      : "";
    ig.innerHTML = cover + "<div class=\"gazette-corps\"><div class=\"gazette-info\"><span class=\"gazette-badge\">Dernier numéro</span><h3>" + esc(g0.titre) + "</h3>" +
      (infos0 ? "<p>" + infos0 + "</p>" : "") + "</div><div class=\"gazette-actions\">" +
      (pages0.length
        ? '<button class="btn btn-primary" type="button" data-doc="' + esc(cle0) + '" data-page="0">Lire en ligne</button>'
        : '<a class="btn btn-primary" href="' + esc(url(g0.fichier)) + '" target="_blank" rel="noopener">Lire la gazette</a>') +
      (A.estPdf(g0.fichier) ? ' <a class="btn btn-outline" href="' + esc(url(g0.fichier)) + '" download>Télécharger (PDF)</a>' : "") +
      ' <a class="btn btn-outline" href="archives.html">Accès aux archives</a></div></div>';
    ig.hidden = false;
  } else {
    /* Pas de gazette en cours : l'accès aux archives reste proposé */
    var ia = $("intro-gazette");
    ia.innerHTML = '<div><h3>Archives</h3><p>Retrouvez les anciennes affiches et gazettes.</p><a class="btn btn-outline" href="archives.html">Accès aux archives</a></div>';
    ia.hidden = false;
  }

  A.reveler(".section, .affiche, .aside-card, .intro-card");
})();

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

  /* ---------- À la une : affiches ouvertes, les unes sous les autres ---------- */
  function imagesAffiche(a) {
    if (a.pages && a.pages.length) return a.pages;
    return estImage(a.fichier) ? [a.fichier] : [];
  }
  var actives = affiches.filter(function (a) { return !a.archive; }).sort(parDate);
  var zoneAff = $("affiches");
  if (!actives.length) {
    zoneAff.innerHTML = '<p class="vide">Aucune affiche pour le moment. Revenez bientôt&nbsp;!</p>';
  } else {
    zoneAff.innerHTML = actives.map(function (a, n) {
      var imgs = imagesAffiche(a);
      var estPdf = /\.pdf$/i.test(a.fichier || "");
      var visuel;
      if (imgs.length) {
        visuel = imgs.map(function (src, i) {
          var alt = "Affiche : " + a.titre + (imgs.length > 1 ? " – page " + (i + 1) : "");
          return '<a class="affiche-page" href="' + esc(url(src)) + '" target="_blank" rel="noopener" title="Ouvrir en grand">' +
            '<img src="' + esc(url(src)) + '" alt="' + esc(alt) + '"' + (n === 0 && i === 0 ? "" : ' loading="lazy"') + "></a>";
        }).join("");
      } else {
        visuel = '<object class="affiche-objet" data="' + esc(url(a.fichier)) + '#view=FitH" type="application/pdf">' +
          '<a class="affiche-pdf" href="' + esc(url(a.fichier)) + '" target="_blank" rel="noopener">' + iconePdf(56) +
          "<span>Ouvrir l'affiche</span></a></object>";
      }
      return '<article class="affiche">' +
        '<header class="affiche-tete">' +
        (a.date ? '<span class="date">' + esc(fmt(a.date)) + "</span>" : "") +
        "<h3>" + esc(a.titre) + "</h3>" +
        (a.description ? "<p>" + esc(a.description).replace(/\n/g, "<br>") + "</p>" : "") +
        "</header>" +
        '<div class="affiche-visuel">' + visuel + "</div>" +
        '<div class="affiche-actions">' +
        '<a class="btn btn-outline" href="' + esc(url(imgs[0] || a.fichier)) + '" target="_blank" rel="noopener">Agrandir</a>' +
        (estPdf ? '<a class="btn btn-outline" href="' + esc(url(a.fichier)) + '" download>Télécharger (PDF)</a>' : "") +
        "</div></article>";
    }).join("");
  }

  function iconePdf(t) {
    return '<svg width="' + t + '" height="' + t + '" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">' +
      '<path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V9h5.5L13 3.5ZM7 13v5h1.3v-1.6h.8a1.7 1.7 0 0 0 0-3.4H7Zm1.3 1.1h.8a.6.6 0 0 1 0 1.2h-.8v-1.2Zm3.2-1.1v5h1.6a2.5 2.5 0 0 0 0-5h-1.6Zm1.3 1.1h.3a1.4 1.4 0 0 1 0 2.8h-.3v-2.8Zm3.2-1.1v5h1.3v-2h1.7v-1.1H17.3v-.8h1.9V13H16Z"/></svg>';
  }

  /* ---------- La gazette ---------- */
  var gActives = gazettes.filter(function (g) { return !g.archive; }).sort(parDate);
  var zoneGaz = $("gazettes");
  function numero(g) { return g.numero ? "N°&nbsp;" + esc(g.numero) : "PDF"; }
  if (!gActives.length) {
    zoneGaz.innerHTML = '<p class="vide">Aucune gazette pour le moment.</p>';
  } else {
    var g0 = gActives[0];
    var html = '<article class="gazette-une">' +
      '<div class="journal" aria-hidden="true"><small>LA GAZETTE</small>' + (g0.numero ? esc(g0.numero) : "") + "</div>" +
      "<div><span class=\"gazette-badge\">Dernier numéro</span>" +
      "<h3>" + esc(g0.titre) + "</h3>" +
      "<p>" + [g0.numero ? "Numéro " + esc(g0.numero) : "", g0.date ? esc(moisAnnee(g0.date)) : ""].filter(Boolean).join(" · ") + "</p>" +
      (g0.description ? "<p>" + esc(g0.description) + "</p>" : "") +
      '<div class="actions">' +
      '<a class="btn btn-primary" href="' + esc(url(g0.fichier)) + '" target="_blank" rel="noopener">Lire la gazette</a>' +
      '<a class="btn btn-outline" href="' + esc(url(g0.fichier)) + '" download>Télécharger (PDF)</a>' +
      "</div></div></article>";
    if (gActives.length > 1) {
      html += '<div class="grid-gazettes">' + gActives.slice(1).map(function (g) {
        return '<article class="gazette"><div class="journal" aria-hidden="true">' + (g.numero ? esc(g.numero) : "") + "</div>" +
          "<div><h3>" + esc(g.titre) + "</h3>" +
          '<span class="date">' + esc(moisAnnee(g.date)) + "</span>" +
          '<div class="liens"><a href="' + esc(url(g.fichier)) + '" target="_blank" rel="noopener">Lire</a>' +
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
      return '<h3 class="annee">' + esc(an) + '</h3><div class="liste-archives">' + parAnnee[an].map(function (x) {
        var image = x.type === "affiche" ? imagesAffiche(x)[0] : null;
        var vignette = image
          ? '<span class="archive-vignette"><img src="' + esc(url(image)) + '" alt="" loading="lazy"></span>'
          : '<span class="archive-vignette' + (x.type === "gazette" ? " is-gazette" : "") + '">' + (x.type === "gazette" ? numero(x) : "PDF") + "</span>";
        return '<a class="archive" href="' + esc(url(x.fichier)) + '" target="_blank" rel="noopener">' + vignette +
          "<span><strong>" + esc(x.titre) + "</strong>" +
          '<span class="meta"><span class="tag tag-' + x.type + '">' + (x.type === "affiche" ? "Affiche" : "Gazette") + "</span>" +
          esc(fmt(x.date)) + "</span></span></a>";
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

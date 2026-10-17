/* Amicale des locataires – le Clos La Paume
   Suivi de fréquentation ANONYME (service GoatCounter, sans cookie ni compte visiteur).

   Seules des statistiques agrégées sont enregistrées — jamais de donnée individuelle :
     « / »                 une visite du site (affichée en bas du site)
     événements            contact, copie, pdf, archives, mentions, gaz-<id>
   Le type d'appareil est déduit par GoatCounter de la taille d'écran.

   Chaque navigateur n'est compté qu'une fois par jour (visite) et une fois par jour et par
   action ; la date du dernier comptage est mémorisée dans le navigateur du visiteur.
   Les noms d'événements doivent rester identiques à ceux lus par le logiciel de gestion. */
(function () {
  "use strict";
  var D = window.SITE_DATA || {};
  var c = D.compteur || {};
  var actif = c.actif !== false;
  var code = c.code || "amicale-closlapaume";
  var BASE = "https://" + code + ".goatcounter.com/";
  var ua = navigator.userAgent || "";
  var robot = !!navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit/i.test(ua);
  var local = /^(file:|)$/.test(location.protocol) || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var MEMO_VISITE = "amicale-derniere-visite-gc";
  var MEMO_ACTIONS = "amicale-actions-du-jour";

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  var d = new Date();
  var mois = d.getFullYear() + "-" + pad(d.getMonth() + 1);
  var jour = mois + "-" + pad(d.getDate());

  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }
  function rien() { /* service indisponible : on ignore */ }

  /* Envoie un comptage à GoatCounter (simple image, sans cookie) */
  function envoyer(chemin, titre, evenement) {
    var url = BASE + "count?p=" + encodeURIComponent(chemin) +
      "&t=" + encodeURIComponent(titre || chemin) +
      "&s=" + [window.screen.width || 0, window.screen.height || 0, window.devicePixelRatio || 1].join(",") +
      (evenement ? "&e=true" : "") +
      "&rnd=" + Math.random().toString(36).slice(2, 8);
    var img = new Image();
    img.onerror = rien;
    img.src = url;
  }
  function afficher(n) {
    var el = document.getElementById("compteur");
    var val = document.getElementById("compteur-valeur");
    if (!el || !val || n < 1) return;
    val.textContent = n.toLocaleString("fr-FR") + (n > 1 ? " visites" : " visite");
    el.title = "Une visite est comptée une fois par personne et par jour";
    el.hidden = false;
  }
  /* Total des visites, lu sur le compteur public de GoatCounter */
  function total() {
    return fetch(BASE + "counter/" + encodeURIComponent("/") + ".json", { cache: "no-store" })
      .then(function (r) {
        if (r.status === 404) return { count: "0" };
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (j) { return parseInt(String(j.count || "0").replace(/\D/g, ""), 10) || 0; });
  }

  /* Une action (clic sur « Nous contacter », lecture d'une gazette…) : comptée une fois par jour et par navigateur */
  function evenement(nom) {
    if (!actif || robot || local) return;
    nom = String(nom).replace(/[^A-Za-z0-9_.-]/g, "-");
    var memo = {};
    try { memo = JSON.parse(lire(MEMO_ACTIONS) || "{}"); } catch (e) { memo = {}; }
    if (memo[nom] === jour) return;
    var garde = {};
    Object.keys(memo).forEach(function (k) { if (memo[k] === jour) garde[k] = jour; });
    garde[nom] = jour;
    ecrire(MEMO_ACTIONS, JSON.stringify(garde));
    envoyer(nom, nom, true);
  }

  /* À appeler une fois par page : compte la visite du jour (si pas déjà faite) et affiche le total */
  function init(page) {
    if (!actif || !window.fetch || robot) return;
    var compter = lire(MEMO_VISITE) !== jour && !local;
    if (compter) {
      ecrire(MEMO_VISITE, jour);
      envoyer("/", document.title);
    }
    total().then(function (n) {
      afficher(n + (compter ? 1 : 0) + (parseInt(c.depart, 10) || 0));
    }).catch(rien);
    if (page && page !== "accueil") evenement(page);
  }

  /* Téléchargement d'un PDF (n'importe où sur le site) */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[download]");
    if (a) evenement("pdf");
  });

  window.Suivi = { init: init, evenement: evenement };
})();

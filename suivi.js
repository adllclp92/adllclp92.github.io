/* Amicale des locataires – le Clos La Paume
   Suivi de fréquentation ANONYME (service gratuit Abacus, sans cookie ni compte).

   Seuls des compteurs agrégés sont incrémentés — jamais de donnée individuelle :
     visites-site          total des visites (affiché en bas du site)
     j-AAAA-MM-JJ          visites du jour
     ap-AAAA-MM-<type>     visites du mois par type d'appareil (mobile / tablette / ordinateur)
     e-AAAA-MM-<nom>       actions du mois : contact, copie, pdf, archives, mentions, gaz-<id>

   Chaque navigateur n'est compté qu'une fois par jour (visite) et une fois par jour et par
   action ; la date du dernier comptage est mémorisée dans le navigateur du visiteur.
   Les noms de compteurs doivent rester identiques à ceux lus par le logiciel de gestion. */
(function () {
  "use strict";
  var D = window.SITE_DATA || {};
  var c = D.compteur || {};
  var actif = c.actif !== false;
  var espace = c.espace || "amicale-clos-la-paume-bagneux";
  var cle = c.cle || "visites-site";
  var BASE = "https://abacus.jasoncameron.dev/";
  var ua = navigator.userAgent || "";
  var robot = !!navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit/i.test(ua);
  var local = /^(file:|)$/.test(location.protocol) || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var MEMO_VISITE = "amicale-derniere-visite-" + cle;
  var MEMO_ACTIONS = "amicale-actions-du-jour";

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  var d = new Date();
  var mois = d.getFullYear() + "-" + pad(d.getMonth() + 1);
  var jour = mois + "-" + pad(d.getDate());

  function appareil() {
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
        (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "tablette";
    if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return "mobile";
    return "ordinateur";
  }
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }
  function rien() { /* service indisponible : on ignore */ }

  function appel(action, k) {
    return fetch(BASE + action + "/" + espace + "/" + k, { cache: "no-store", keepalive: true })
      .then(function (r) {
        if (r.status === 404) return { value: 0 };
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
  }
  function afficher(n) {
    var el = document.getElementById("compteur");
    var val = document.getElementById("compteur-valeur");
    if (!el || !val || n < 1) return;
    val.textContent = n.toLocaleString("fr-FR") + (n > 1 ? " visites" : " visite");
    el.title = "Une visite est comptée une fois par personne et par jour";
    el.hidden = false;
  }

  /* Une action (clic sur « Nous contacter », lecture d'une gazette…) : comptée une fois par jour et par navigateur */
  function evenement(nom) {
    if (!actif || robot || local || !window.fetch) return;
    nom = String(nom).replace(/[^A-Za-z0-9_.-]/g, "-");
    var memo = {};
    try { memo = JSON.parse(lire(MEMO_ACTIONS) || "{}"); } catch (e) { memo = {}; }
    if (memo[nom] === jour) return;
    var garde = {};
    Object.keys(memo).forEach(function (k) { if (memo[k] === jour) garde[k] = jour; });
    garde[nom] = jour;
    ecrire(MEMO_ACTIONS, JSON.stringify(garde));
    appel("hit", "e-" + mois + "-" + nom).catch(rien);
  }

  /* À appeler une fois par page : compte la visite du jour (si pas déjà faite) et affiche le total */
  function init(page) {
    if (!actif || !window.fetch || robot) return;
    var deja = lire(MEMO_VISITE) === jour;
    var compter = !deja && !local;
    appel(compter ? "hit" : "get", cle).then(function (j) {
      if (compter) {
        ecrire(MEMO_VISITE, jour);
        appel("hit", "j-" + jour).catch(rien);
        appel("hit", "ap-" + mois + "-" + appareil()).catch(rien);
      }
      afficher((parseInt(j.value, 10) || 0) + (parseInt(c.depart, 10) || 0));
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

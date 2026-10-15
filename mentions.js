/* Page « Mentions légales » : texte généré à partir de data/content.js
   (informations saisies dans l'onglet « Mentions légales » du logiciel de gestion). */
(function () {
  "use strict";
  var D = window.SITE_DATA || {};
  var M = D.mentions || {};
  var email = D.contact || "amicalelapaume@gmail.com";
  var compteurActif = !(D.compteur && D.compteur.actif === false);

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function paragraphes(t) {
    return String(t || "").split(/\n\s*\n/).filter(function (p) { return p.trim(); })
      .map(function (p) { return "<p>" + esc(p.trim()).replace(/\n/g, "<br>") + "</p>"; }).join("");
  }
  var asso = M.association || "Amicale des locataires – le Clos La Paume";
  var adresse = M.adresse || "8, rue du Clos la Paume – 92220 Bagneux";
  var mail = '<a href="mailto:' + esc(email) + '">' + esc(email) + "</a>";

  var ident = ["<li><strong>Dénomination :</strong> " + esc(asso) + "</li>",
    "<li><strong>Statut :</strong> association régie par la loi du 1<sup>er</sup> juillet 1901</li>",
    "<li><strong>Siège :</strong> " + esc(adresse) + "</li>"];
  if (M.rna) ident.push("<li><strong>Numéro RNA :</strong> " + esc(M.rna) + "</li>");
  if (M.siret) ident.push("<li><strong>Numéro SIRET :</strong> " + esc(M.siret) + "</li>");
  if (M.declaration) ident.push("<li><strong>Déclarée en préfecture :</strong> " + esc(M.declaration) + "</li>");
  ident.push("<li><strong>E-mail :</strong> " + mail + "</li>");

  var directeur = M.directeur
    ? esc(M.directeur) + ", en qualité de représentant(e) de l'association"
    : "le/la président(e) de l'association";

  var sections = [
    ["Éditeur du site", '<ul class="legal-liste">' + ident.join("") + "</ul>" +
      "<p><strong>Directeur(trice) de la publication :</strong> " + directeur + ".</p>"],
    ["Hébergement", "<p>Ce site est hébergé par <strong>GitHub, Inc.</strong> (service GitHub Pages), " +
      "88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis — " +
      '<a href="https://github.com" target="_blank" rel="noopener">github.com</a>.</p>'],
    ["Propriété intellectuelle", "<p>Le logo, les textes, les affiches et les numéros de la gazette publiés sur ce site " +
      "sont la propriété de l'amicale ou de leurs auteurs. Leur reproduction, leur diffusion ou leur réutilisation, " +
      "au-delà de la consultation et de la copie à usage privé, nécessitent l'accord préalable de l'association " +
      "(contact : " + mail + ").</p>"],
    ["Données personnelles et cookies",
      "<p>Ce site ne comporte aucun formulaire, aucun compte utilisateur, aucun cookie et aucun outil publicitaire.</p>" +
      (compteurActif
        ? "<p><strong>Mesure de fréquentation anonyme.</strong> Pour connaître l'audience du site, des compteurs agrégés sont " +
          "incrémentés au moyen du service tiers <em>Abacus</em> (abacus.jasoncameron.dev) : nombre de visites par jour, " +
          "type d'appareil utilisé (mobile, tablette ou ordinateur), pages et documents consultés, clics sur « Nous contacter » " +
          "et téléchargements de PDF. Ces compteurs ne contiennent aucune donnée permettant d'identifier un visiteur ; " +
          "l'amicale n'a accès qu'à des totaux. Pour ne compter qu'une fois un même navigateur par jour, la date de la " +
          "dernière visite est mémorisée dans le stockage local de votre navigateur (aucune donnée personnelle) ; vous pouvez " +
          "l'effacer à tout moment dans les réglages de votre navigateur. Comme pour toute connexion à un service en ligne, " +
          "l'adresse IP est transmise techniquement au service pour répondre à la requête.</p>"
        : "") +
      "<p>Comme tout hébergeur, GitHub peut enregistrer des journaux techniques de connexion (dont l'adresse IP) selon sa " +
      '<a href="https://docs.github.com/fr/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">politique de confidentialité</a>.</p>' +
      "<p><strong>Courriels.</strong> Si vous écrivez à l'amicale, votre adresse e-mail et le contenu de votre message sont " +
      "utilisés uniquement pour vous répondre et ne sont pas transmis à des tiers. Conformément au règlement général sur la " +
      "protection des données (RGPD) et à la loi « Informatique et Libertés », vous disposez d'un droit d'accès, de " +
      "rectification et d'effacement de ces données : il suffit d'écrire à " + mail + ". Vous pouvez aussi introduire une " +
      'réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener">CNIL</a>.</p>'],
    ["Responsabilité", "<p>Les informations publiées (affiches, gazette, annonces) le sont à titre indicatif et peuvent évoluer. " +
      "L'amicale s'efforce de les tenir à jour mais ne peut garantir leur exhaustivité. Elle n'est pas responsable du " +
      "contenu des sites externes vers lesquels ce site pourrait renvoyer.</p>"],
    ["Droit applicable", "<p>Le présent site et ses mentions légales sont soumis au droit français.</p>"]
  ];
  if (M.complement && M.complement.trim()) sections.push(["Informations complémentaires", paragraphes(M.complement)]);

  document.getElementById("legal-contenu").innerHTML = sections.map(function (s) {
    return '<section class="legal-bloc"><h2>' + s[0] + "</h2>" + s[1] + "</section>";
  }).join("");

  if (window.Suivi) window.Suivi.init("mentions");

  if (M.maj) {
    var d = new Date(M.maj + "T12:00:00");
    if (!isNaN(d)) {
      var el = document.getElementById("legal-maj");
      el.textContent = "Dernière mise à jour : " + d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      el.hidden = false;
    }
  }
})();

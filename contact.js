/* Amicale des locataires – le Clos La Paume
   Fenêtre « Nous contacter » (adresse copiable) — commune à l'accueil et aux archives. */
(function () {
  "use strict";
  var A = window.Amicale, $ = A.$;
  var email = A.email;
  var fenetre = $("contact-fenetre");
  if (!fenetre) return;
  var champ = $("contact-email");
  var okMsg = $("contact-copie-ok");
  champ.value = email;
  champ.size = Math.max(email.length, 10);
  $("contact-ecrire").href = A.mailto;
  Array.prototype.forEach.call(document.querySelectorAll(".email-texte"), function (el) { el.textContent = email; });
  ["contact-aside", "contact-footer"].forEach(function (id) {
    var lien = $(id);
    if (!lien) return;
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
})();

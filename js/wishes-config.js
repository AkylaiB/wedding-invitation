/**
 * Google Form + Sheet for wedding wishes.
 * formAction — ссылка формы с /formResponse (не /viewform и не таблица).
 * nameEntry / messageEntry — коды полей «Имя» и «Пожелание».
 * sheetId — ID таблицы с ответами.
 */
(function wishesConfig() {
  "use strict";

  var root = window.WeddingInvitation || {};
  window.WeddingInvitation = root;

  root.wishesConfig = {
    formAction:
      "https://docs.google.com/forms/d/e/1FAIpQLSejRdo_ix_Uo-Nnh7v_g8-xaLXGHa2SierlZc0xzwadbLqGvw/formResponse",
    nameEntry: "entry.1299726470",
    messageEntry: "entry.47990024",
    sheetId: "1J9Pp46pgkLHT01jk9m_3SLC3tVMA3nmADqvV21Vf6jk",
  };
})();

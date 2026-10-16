(function () {
  var cfg = window.SITE_CONFIG || {};
  var open = cfg.bookingOpen === true;

  // 정해진 사실은 그대로, 비어 있으면 "준비 중" 문구를 보여 준다
  document.querySelectorAll("[data-fact]").forEach(function (el) {
    var value = (cfg[el.dataset.fact] || "").trim();
    el.textContent = value || el.dataset.empty || "준비 중";
    el.classList.toggle("is-set", Boolean(value));
  });

  var buttons = document.querySelectorAll("[data-booking-button], [data-booking-label]");
  var form = document.querySelector("[data-booking-form]");
  var fieldset = document.querySelector("[data-booking-fieldset]");
  var submit = document.querySelector("[data-booking-submit]");
  var status = document.querySelector("[data-booking-status]");

  if (open) {
    buttons.forEach(function (b) {
      b.textContent = "예약 신청";
      b.removeAttribute("aria-disabled");
      b.classList.remove("is-closed");
    });
    document.querySelector("[data-booking-title]").textContent = "예약 신청";
    document.querySelector("[data-booking-lead]").textContent =
      "이름과 연락처를 남겨 주시면 일정을 확인해 연락드릴게요.";
    var note = document.querySelector("[data-booking-note]");
    if (note) note.hidden = true;
    fieldset.disabled = false;
    submit.textContent = "예약 신청 보내기";
  } else {
    buttons.forEach(function (b) {
      if (b.matches("[data-booking-button]")) b.classList.add("is-closed");
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!open) {
      status.textContent = "지금은 예약을 받지 않아요.";
      return;
    }
    if (!form.checkValidity()) {
      status.textContent = "이름, 연락처, 희망하는 때를 채우고 동의에 체크해 주세요.";
      return;
    }
    if (!cfg.bookingEndpoint) {
      status.textContent = "예약 저장이 아직 연결되지 않았어요. 잠시 후 다시 시도해 주세요.";
      return;
    }

    var data = Object.fromEntries(new FormData(form));
    data.consent = Boolean(data.consent);
    submit.disabled = true;
    status.textContent = "보내는 중이에요…";

    fetch(cfg.bookingEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.textContent = "예약 신청을 보냈어요. 확인 후 연락드릴게요.";
      })
      .catch(function () {
        status.textContent = "예약 신청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.";
      })
      .finally(function () {
        submit.disabled = false;
      });
  });
})();

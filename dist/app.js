const connectionStatus = document.querySelector("#connection-status");
const installButton = document.querySelector("#install-button");
const toast = document.querySelector("#toast");
let installPrompt = null;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function updateConnectionStatus() {
  const online = navigator.onLine;
  connectionStatus.classList.toggle("online", online);
  connectionStatus.classList.toggle("offline", !online);
  connectionStatus.querySelector("span:last-child").textContent = online
    ? "Verkkoyhteys käytössä"
    : "Offline-tila";
}

window.addEventListener("online", () => {
  updateConnectionStatus();
  showToast("Verkkoyhteys palautui.");
});
window.addEventListener("offline", () => {
  updateConnectionStatus();
  showToast("Olet offline-tilassa. Välimuistiin tallennettu sivu toimii edelleen.");
});
updateConnectionStatus();

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!installPrompt) {
    showToast("Asennus löytyy selaimen valikosta. iPhonessa valitse Jaa ja Lisää Koti-valikkoon.");
    return;
  }
  installPrompt.prompt();
  const result = await installPrompt.userChoice;
  if (result.outcome === "accepted") showToast("Asennus käynnistyi.");
  installPrompt = null;
  installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  installButton.hidden = true;
  showToast("Sivu on asennettu sovellukseksi.");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      if (registration.waiting) showToast("Sivusta on uusi versio. Päivitä sivu ottaaksesi sen käyttöön.");
    } catch (error) {
      console.warn("Service workerin rekisteröinti epäonnistui:", error);
    }
  });
}

document.querySelectorAll(".copy-button").forEach(button => {
  button.addEventListener("click", async () => {
    const code = button.closest(".code-block").querySelector("code").textContent;
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = "Kopioitu";
      showToast("Koodiesimerkki kopioitiin leikepöydälle.");
      setTimeout(() => { button.textContent = "Kopioi"; }, 1800);
    } catch {
      showToast("Kopiointi ei onnistunut tässä selaimessa.");
    }
  });
});

const checklist = [...document.querySelectorAll(".checklist input")];
const checklistStatus = document.querySelector("#checklist-status");
const savedChecks = JSON.parse(localStorage.getItem("pwa-checklist") || "[]");

checklist.forEach((input, index) => {
  input.checked = savedChecks.includes(index);
  input.addEventListener("change", saveChecklist);
});

function saveChecklist() {
  const checked = checklist.flatMap((input, index) => input.checked ? [index] : []);
  localStorage.setItem("pwa-checklist", JSON.stringify(checked));
  checklistStatus.textContent = checked.length === checklist.length
    ? "Kaikki kohdat on merkitty valmiiksi tällä laitteella."
    : `${checked.length}/${checklist.length} kohtaa merkitty valmiiksi. Valinnat tallentuvat tälle laitteelle.`;
}
saveChecklist();

const observedSections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".side-nav nav a")];

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => {
      const active = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-20% 0px -65%", threshold: [0, .25, .6] });
  observedSections.forEach(section => observer.observe(section));
}

document.querySelector("#year").textContent = new Date().getFullYear();

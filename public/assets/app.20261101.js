import { buildCalendarFile, buildStory } from "./story.20261101.js";

const THEMES = {
  blank: { background: "#f6efe0", ink: "#1b1712" },
  before: { background: "#ff7a45", ink: "#1b1712" },
  now: { background: "#ffc93c", ink: "#1b1712" },
  passed: { background: "#2437c8", ink: "#fff8ea" },
  unlikely: { background: "#a6e4c4", ink: "#1b1712" },
  gone: { background: "#2c2433", ink: "#fff8ea" }
};

const SITE_LABEL = "samesyday.merimerimeri.com";
const DISPLAY_FONT = '"Bricolage Grotesque", system-ui, sans-serif';

const form = document.getElementById("pet-form");
const species = document.getElementById("species");
const petName = document.getElementById("pet-name");
const petAge = document.getElementById("pet-age");
const humanAge = document.getElementById("human-age");
const goneToggle = document.getElementById("gone-toggle");
const goneFields = document.getElementById("gone-fields");
const goneYear = document.getElementById("gone-year");
const agePrefix = document.getElementById("age-prefix");
const headline = document.getElementById("headline");
const detail = document.getElementById("detail");
const actions = document.getElementById("actions");
const calendarButton = document.getElementById("calendar-button");
const shareButton = document.getElementById("share-button");
const themeColor = document.querySelector('meta[name="theme-color"]');

let story = null;

function numberIn(input, min, max) {
  if (input.value.trim() === "") return null;
  const value = Number(input.value);
  return Number.isFinite(value) && value >= min && value <= max ? value : null;
}

function readInputs() {
  const isGone = !goneFields.hidden;
  const currentYear = new Date().getFullYear();
  const pet = numberIn(petAge, 0, 40);
  const human = numberIn(humanAge, 1, 120);
  const year = isGone ? numberIn(goneYear, 1950, currentYear) : null;

  if (pet === null || human === null || (isGone && year === null)) return null;
  return {
    name: petName.value,
    species: species.value,
    petAge: pet,
    humanAge: human,
    goneYear: isGone ? Math.trunc(year) : null
  };
}

function applyTheme(state) {
  const theme = THEMES[state];
  document.documentElement.dataset.state = state;
  themeColor.content = theme.background;
}

function render() {
  const inputs = readInputs();
  story = inputs ? buildStory(inputs) : null;

  if (!story) {
    applyTheme("blank");
    headline.textContent = goneFields.hidden ? "How old are you both?" : "When did they die?";
    detail.textContent = "";
    actions.hidden = true;
    return;
  }

  applyTheme(story.state);
  headline.textContent = story.headline;
  detail.textContent = story.detail;
  actions.hidden = false;
  calendarButton.hidden = !story.event;
  shareButton.textContent = story.state === "gone" ? "Save the card" : "Share the card";
}

function setGone(isGone) {
  goneFields.hidden = !isGone;
  goneToggle.textContent = isGone ? "Never mind" : "If your pet has died";
  goneToggle.setAttribute("aria-expanded", String(isGone));
  agePrefix.textContent = isGone ? "lived to about" : "is about";
  if (isGone) {
    goneYear.max = String(new Date().getFullYear());
    goneYear.focus();
  } else {
    goneYear.value = "";
  }
  render();
}

function saveFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function fileStem() {
  const stem = petName.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return stem || "samesy-day";
}

function wrapText(context, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fittedHeadline(context, text, maxWidth, maxHeight) {
  for (let size = 132; size >= 56; size -= 4) {
    context.font = `800 ${size}px ${DISPLAY_FONT}`;
    const lines = wrapText(context, text, maxWidth);
    const lineHeight = size * 1.04;
    const fits = lines.length * lineHeight <= maxHeight
      && lines.every((line) => context.measureText(line).width <= maxWidth);
    if (fits) return { lines, size, lineHeight };
  }
  const size = 56;
  context.font = `800 ${size}px ${DISPLAY_FONT}`;
  return { lines: wrapText(context, text, maxWidth), size, lineHeight: size * 1.04 };
}

async function renderCard(currentStory) {
  await Promise.all([
    document.fonts.load(`800 100px ${DISPLAY_FONT}`),
    document.fonts.load(`500 40px ${DISPLAY_FONT}`)
  ]);

  const width = 1080;
  const height = 1350;
  const margin = 88;
  const theme = THEMES[currentStory.state];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  context.fillStyle = theme.background;
  context.fillRect(0, 0, width, height);
  context.fillStyle = theme.ink;
  context.textBaseline = "top";

  context.font = `700 40px ${DISPLAY_FONT}`;
  context.fillText("Samesy Day", margin, margin);

  const { lines, lineHeight } = fittedHeadline(context, currentStory.headline, width - margin * 2, 800);
  let y = 220;
  for (const line of lines) {
    context.fillText(line, margin, y);
    y += lineHeight;
  }

  if (currentStory.detail) {
    context.font = `500 42px ${DISPLAY_FONT}`;
    y += 44;
    for (const line of wrapText(context, currentStory.detail, width - margin * 2)) {
      if (y > height - margin - 120) break;
      context.fillText(line, margin, y);
      y += 56;
    }
  }

  context.font = `500 30px ${DISPLAY_FONT}`;
  context.fillText(SITE_LABEL, margin, height - margin - 30);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not make the image."))), "image/png");
  });
}

async function shareCard() {
  if (!story) return;
  const blob = await renderCard(story);
  const filename = `${fileStem()}-samesy-day.png`;
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: story.headline });
    } catch (error) {
      if (error.name !== "AbortError") saveFile(blob, filename);
    }
    return;
  }
  saveFile(blob, filename);
}

form.addEventListener("input", render);
form.addEventListener("submit", (event) => event.preventDefault());
goneToggle.addEventListener("click", () => setGone(goneFields.hidden));
calendarButton.addEventListener("click", () => {
  if (!story?.event) return;
  saveFile(new Blob([buildCalendarFile(story.event)], { type: "text/calendar" }), `${fileStem()}-samesy-day.ics`);
});
shareButton.addEventListener("click", () => {
  shareCard().catch((error) => console.error(error));
});

render();

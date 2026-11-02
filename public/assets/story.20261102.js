import {
  YEAR_DAYS,
  addDays,
  ageYearsFromDays,
  calculateSamesyDay,
  comparisonForDate,
  todayUtc
} from "./calculator.20260808.js";

export const TYPICAL_LIFESPAN_YEARS = { dog: 12, cat: 15 };

const DOG_SIZE = "medium";

function yearsBefore(date, years) {
  return addDays(date, -Math.round(years * YEAR_DAYS));
}

function monthYear(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function roundedAge(days) {
  return Math.round(ageYearsFromDays(days));
}

function isSameMonth(a, b) {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

function names(name, species) {
  const trimmed = name.trim();
  return {
    subject: trimmed || `Your ${species}`,
    object: trimmed || `your ${species}`
  };
}

export function buildStory({ name = "", species, petAge, humanAge, today = todayUtc() }) {
  const pet = names(name, species);

  const humanBirthday = yearsBefore(today, humanAge);
  const petBirthday = yearsBefore(today, petAge);
  const result = calculateSamesyDay({ humanBirthday, petBirthday, species, dogSize: DOG_SIZE, today });
  const target = result.target;

  if (result.status === "passed" && !target) {
    return {
      state: "passed",
      headline: `${pet.subject} has always been older than you.`,
      detail: `${pet.subject} has been the grown-up this whole time.`
    };
  }

  if (result.status === "passed" && !isSameMonth(target.date, today)) {
    const now = comparisonForDate(today, humanBirthday, petBirthday, species, DOG_SIZE);
    return {
      state: "passed",
      headline: `${pet.subject} became older than you in ${monthYear(target.date)}.`,
      detail: `${pet.subject} is about ${roundedAge(now.petEquivalentDays)} now. You're ${humanAge}. ${pet.subject} has been the grown-up this whole time.`
    };
  }

  if (result.status === "today" || result.status === "passed" || (target && isSameMonth(target.date, today))) {
    return {
      state: "now",
      headline: `${pet.subject} becomes older than you this month.`,
      detail: `You're both about ${humanAge}. Enjoy being the same age.`
    };
  }

  const reachesIt = target && ageYearsFromDays(target.petDays) <= TYPICAL_LIFESPAN_YEARS[species];
  if (!reachesIt) {
    return {
      state: "unlikely",
      headline: "You two may never be the same age.",
      detail: `${pet.subject} gets to stay the kid.`
    };
  }

  const sharedAge = roundedAge(target.humanDays);
  return {
    state: "before",
    headline: `${pet.subject} becomes older than you in ${monthYear(target.date)}.`,
    detail: `You'll both be about ${sharedAge}. After that, ${pet.object} is the grown-up.`,
    event: {
      date: target.date,
      title: `${pet.subject} becomes older than you`,
      description: `You're both about ${sharedAge} today. From here on, ${pet.object} is the grown-up. Take the photo.`
    }
  };
}

function escapeIcsText(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function icsDate(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

export function buildCalendarFile({ date, title, description }, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MeriMeriMeri Software//Samesy Day//EN",
    "BEGIN:VEVENT",
    `UID:${icsDate(date)}-${stamp}@samesyday.merimerimeri.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(date)}`,
    `DTEND;VALUE=DATE:${icsDate(addDays(date, 1))}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    ""
  ].join("\r\n");
}

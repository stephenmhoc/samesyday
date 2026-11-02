import assert from "node:assert/strict";
import test from "node:test";

import { buildCalendarFile, buildStory } from "../public/assets/story.20261101.js";

const today = new Date(Date.UTC(2026, 10, 1));

function story(overrides) {
  return buildStory({ name: "Olive", species: "dog", petAge: 3, humanAge: 34, today, ...overrides });
}

test("a pet that has not caught up gets a future month and a calendar event", () => {
  const result = story({ petAge: 1, humanAge: 30 });
  assert.equal(result.state, "before");
  assert.match(result.headline, /^Olive becomes older than you in \w+ \d{4}\.$/);
  assert.match(result.detail, /You'll both be about \d+/);
  assert.ok(result.event.date > today);
});

test("a pet that already caught up gets the passed story and no event", () => {
  const result = story({ petAge: 8, humanAge: 34 });
  assert.equal(result.state, "passed");
  assert.match(result.headline, /^Olive became older than you in \w+ \d{4}\.$/);
  assert.match(result.detail, /You're 34\. Olive has been the grown-up/);
  assert.equal(result.event, undefined);
});

test("a crossing in the current month reads as this month", () => {
  const result = story({ petAge: 4, humanAge: 29.5 });
  assert.equal(result.state, "now");
});

test("a crossing past the typical lifespan is flagged as unlikely", () => {
  const result = story({ species: "cat", petAge: 0, humanAge: 70 });
  assert.equal(result.state, "unlikely");
  assert.equal(result.event, undefined);
});

test("a pet older than a young human has always been older", () => {
  const result = story({ petAge: 9, humanAge: 5 });
  assert.equal(result.state, "passed");
  assert.equal(result.headline, "Olive has always been older than you.");
});

test("an unnamed pet still reads correctly", () => {
  const result = story({ name: "  ", species: "cat", petAge: 1, humanAge: 30 });
  assert.match(result.headline, /^Your cat becomes older than you in/);
  assert.match(result.detail, /After that, your cat is the grown-up\.$/);
});

test("a pet who died after catching up went on ahead", () => {
  const result = story({ petAge: 12, humanAge: 50, goneYear: 2024 });
  assert.equal(result.state, "gone");
  assert.match(result.headline, /^Olive caught up with you in \d{4}, then went on ahead\.$/);
});

test("a pet who died before catching up stayed the kid", () => {
  const result = story({ petAge: 2, humanAge: 60, goneYear: 2024 });
  assert.equal(result.state, "gone");
  assert.equal(result.headline, "Olive never had to catch up.");
});

test("stories never guess a pet's pronouns", () => {
  const inputs = [
    { petAge: 1, humanAge: 30 },
    { petAge: 8, humanAge: 34 },
    { species: "cat", petAge: 0, humanAge: 70 },
    { petAge: 12, humanAge: 50, goneYear: 2024 }
  ];
  for (const input of inputs) {
    const { headline, detail } = story(input);
    assert.doesNotMatch(`${headline} ${detail}`, /\b(she|he|her|his|him)\b/i);
  }
});

test("the calendar file is an all-day event with escaped text", () => {
  const file = buildCalendarFile(
    { date: new Date(Date.UTC(2031, 7, 2)), title: "Olive, the elder", description: "Take; the photo" },
    new Date(Date.UTC(2026, 10, 1, 12))
  );
  assert.match(file, /DTSTART;VALUE=DATE:20310802\r\n/);
  assert.match(file, /DTEND;VALUE=DATE:20310803\r\n/);
  assert.match(file, /SUMMARY:Olive\\, the elder\r\n/);
  assert.match(file, /DESCRIPTION:Take\\; the photo\r\n/);
});

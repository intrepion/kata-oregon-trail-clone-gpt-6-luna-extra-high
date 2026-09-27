(() => {
  "use strict";

  const SAVE_KEY = "westward-trail-save-v1";
  const TOTAL_MILES = 2170;
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const ROUTE = [
    { mile: 0, short: "Independence", full: "Independence, Missouri", note: "The last streets of town give way to open country.", fort: false },
    { mile: 300, short: "Fort Kearny", full: "Fort Kearny", note: "A stockade on the Platte, and a welcome place to mend and trade.", fort: true },
    { mile: 540, short: "Chimney Rock", full: "Chimney Rock", note: "A pale stone spire rises above the long, level country.", fort: false },
    { mile: 650, short: "Fort Laramie", full: "Fort Laramie", note: "The trail gathers at the last great post before the mountains.", fort: true },
    { mile: 830, short: "Independence Rock", full: "Independence Rock", note: "Names and dates cover the granite, left by travelers bound west.", fort: false },
    { mile: 1010, short: "South Pass", full: "South Pass", note: "The Rocky Mountains open into a broad, high saddle of land.", fort: false },
    { mile: 1190, short: "Fort Bridger", full: "Fort Bridger", note: "A small outpost offers supplies before the hard country ahead.", fort: true },
    { mile: 1390, short: "Fort Hall", full: "Fort Hall", note: "The Snake River country stretches dry and wide to the west.", fort: true },
    { mile: 1580, short: "Snake River", full: "Snake River Crossing", note: "A cold, swift river cuts across the trail. The crossing asks care.", fort: false },
    { mile: 1830, short: "Blue Mountains", full: "The Blue Mountains", note: "Pine-covered ridges rise in front of the wagons at last.", fort: false },
    { mile: 2050, short: "The Dalles", full: "The Dalles", note: "The Columbia carries the sound of the coast into the dry hills.", fort: true },
    { mile: TOTAL_MILES, short: "Oregon City", full: "Oregon City, Oregon Territory", note: "The Willamette Valley opens below the last ridge. You made it.", fort: false }
  ];
  const RIVERS = [
    { id: "kansas", mile: 60, name: "Kansas River", text: "The Kansas is swollen with spring rain. The far bank is near, but a wagon can be lost in the current." },
    { id: "platte", mile: 315, name: "Platte River", text: "The Platte spreads wide across the flats. Its channels look shallow until they begin to move." },
    { id: "sweetwater", mile: 850, name: "Sweetwater River", text: "Snowmelt runs fast through the Sweetwater. The team stamps while the water climbs the wheels." },
    { id: "snake", mile: 1580, name: "Snake River", text: "The Snake is broad, cold, and quick. The crossing is one of the hardest choices on this stretch." },
    { id: "columbia", mile: 2055, name: "Columbia River", text: "The Columbia blocks the direct way west. A ferry can take the wagon across without testing the current." }
  ];
  const PROFESSIONS = {
    farmer: { name: "Farmer", cash: 650, food: 1000, ammo: 60, medicine: 2, parts: 2, oxen: 4, clothing: 4 },
    carpenter: { name: "Carpenter", cash: 700, food: 800, ammo: 70, medicine: 2, parts: 4, oxen: 4, clothing: 4 },
    trader: { name: "Trader", cash: 1000, food: 700, ammo: 50, medicine: 1, parts: 1, oxen: 4, clothing: 3 }
  };
  const COMPANIONS = ["Elias", "Ruth", "Samuel", "Martha", "Jonah", "Ada", "Silas"];
  const TRADE = [
    { id: "food", name: "Food", amount: 100, unit: "lb", price: 20, copy: "100 pounds · $20" },
    { id: "ammo", name: "Ammunition", amount: 20, unit: "rounds", price: 12, copy: "20 rounds · $12" },
    { id: "medicine", name: "Medicine", amount: 1, unit: "kit", price: 24, copy: "1 kit · $24" },
    { id: "parts", name: "Spare parts", amount: 1, unit: "kit", price: 28, copy: "1 kit · $28" }
  ];

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const setupView = $("#setup-view");
  const gameView = $("#game-view");
  const endView = $("#end-view");
  const startForm = $("#start-form");
  const eventPanel = $("#event-panel");
  const tradePanel = $("#trade-panel");
  const actionPanel = $("#action-panel");
  const toast = $("#toast");
  let state = null;
  let toastTimer = 0;

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function money(value) { return `$${Math.max(0, Math.floor(value)).toLocaleString("en-US")}`; }

  function dateLabel() {
    if (!state) return "";
    return `${MONTHS[state.month]} ${state.calendarDay}, ${state.year}`;
  }

  function partyTitle() {
    return `The ${state.leader.split(/\s+/).at(-1)} party`;
  }

  function currentRouteIndex() {
    let index = 0;
    for (let i = 0; i < ROUTE.length; i += 1) {
      if (state.miles >= ROUTE[i].mile) index = i;
      else break;
    }
    return index;
  }

  function nextRouteStop() { return ROUTE[Math.min(currentRouteIndex() + 1, ROUTE.length - 1)]; }

  function regionName() {
    const mile = state.miles;
    if (mile < 60) return "Independence, Missouri";
    if (mile < 315) return "Kansas River country";
    if (mile < 540) return "The Platte country";
    if (mile < 650) return "The Nebraska bluffs";
    if (mile < 850) return "The high plains";
    if (mile < 1010) return "Sweetwater country";
    if (mile < 1190) return "The Wind River country";
    if (mile < 1390) return "The high desert";
    if (mile < 1580) return "Snake River country";
    if (mile < 1830) return "The Idaho uplands";
    if (mile < 2050) return "The Blue Mountains";
    if (mile < TOTAL_MILES) return "The Columbia country";
    return "Oregon City, Oregon Territory";
  }

  function locationNote() {
    const river = RIVERS.find((entry) => state.pending?.kind === "river" && state.pending.riverId === entry.id);
    if (river) return river.text;
    const index = currentRouteIndex();
    const exact = ROUTE[index];
    if (state.miles === exact.mile) return exact.note;
    const next = ROUTE[Math.min(index + 1, ROUTE.length - 1)];
    return `Open country stretches ahead. ${next.mile - state.miles} miles to ${next.short}.`;
  }

  function aliveParty() { return state.party.filter((member) => member.alive); }

  function accountForDeaths() {
    for (const member of state.party) {
      if (member.alive && member.health <= 0) {
        member.alive = false;
        log(`${member.name} dies after the party runs out of food. The trail turns quiet.`);
      }
    }
  }

  function log(message) {
    state.journal.unshift({ day: state.elapsedDays, date: dateLabel(), message });
    state.journal = state.journal.slice(0, 12);
  }

  function persist() {
    if (!state) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* The journey remains playable when storage is unavailable. */ }
    updateSaveButton();
  }

  function readSaved() {
    try {
      const value = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (value && value.version === 1 && Array.isArray(value.party) && Array.isArray(value.journal) && value.miles >= 0) return value;
    } catch { /* Ignore malformed local saves. */ }
    return null;
  }

  function updateSaveButton() {
    const save = readSaved();
    const button = $("#load-save");
    button.hidden = !(save && !save.over);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2300);
  }

  function startJourney(event) {
    event.preventDefault();
    const formData = new FormData(startForm);
    const leader = String(formData.get("leader") || "Clara Bennett").trim().slice(0, 24) || "Clara Bennett";
    const count = Math.max(3, Math.min(6, Number(formData.get("partySize")) || 4));
    const role = PROFESSIONS[formData.get("role")] ? formData.get("role") : "farmer";
    const month = Math.max(3, Math.min(5, Number(formData.get("month")) || 4));
    const names = [leader, ...COMPANIONS.filter((name) => name.toLowerCase() !== leader.toLowerCase())].slice(0, count);
    const kit = PROFESSIONS[role];
    state = {
      version: 1,
      leader,
      role,
      roleName: kit.name,
      startMonth: month,
      month,
      year: 1848,
      calendarDay: 1,
      elapsedDays: 0,
      miles: 0,
      cash: kit.cash,
      food: kit.food,
      ammo: kit.ammo,
      medicine: kit.medicine,
      parts: kit.parts,
      oxen: kit.oxen,
      clothing: kit.clothing,
      wagon: 100,
      pace: "steady",
      ration: "filling",
      weather: "Clear",
      party: names.map((name) => ({ name, health: 100, alive: true })),
      crossings: [],
      pending: null,
      journal: [],
      over: false,
      outcome: null
    };
    log(`${leader} and ${count - 1} companions leave Independence in a ${kit.name.toLowerCase()}'s outfit. Four oxen are yoked and the road is open.`);
    setupView.hidden = true;
    endView.hidden = true;
    gameView.hidden = false;
    $("#header-date").hidden = false;
    log(`${dateLabel()}: ${count} travelers set out with ${state.food.toLocaleString()} pounds of food and ${money(state.cash)} in cash.`);
    refresh();
    persist();
  }

  function resumeJourney() {
    const saved = readSaved();
    if (!saved || saved.over) return;
    state = saved;
    setupView.hidden = true;
    gameView.hidden = false;
    endView.hidden = true;
    $("#header-date").hidden = false;
    refresh();
    showToast("Saved journey continued.");
  }

  function resetToStart() {
    state = null;
    endView.hidden = true;
    gameView.hidden = true;
    setupView.hidden = false;
    $("#header-date").hidden = true;
    tradePanel.hidden = true;
    eventPanel.hidden = true;
    actionPanel.hidden = false;
    localStorage.removeItem(SAVE_KEY);
    updateSaveButton();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveJourney() {
    persist();
    showToast("Journey saved on this device.");
  }

  function spendFood(days) {
    const perPerson = state.ration === "filling" ? 1.8 : 1.05;
    const need = Math.ceil(aliveParty().length * days * perPerson);
    const used = Math.min(state.food, need);
    state.food -= used;
    if (used < need) {
      const missing = need - used;
      for (const member of aliveParty()) member.health = Math.max(0, member.health - Math.min(18, 5 + Math.ceil(missing / Math.max(1, aliveParty().length))));
      log(`Food ran short by ${missing} pounds. Hunger weakened the party.`);
      accountForDeaths();
    }
  }

  function advanceDays(days) {
    spendFood(days);
    for (let i = 0; i < days; i += 1) {
      state.elapsedDays += 1;
      state.calendarDay += 1;
      if (state.calendarDay > 30) {
        state.calendarDay = 1;
        state.month += 1;
        if (state.month > 11) { state.month = 0; state.year += 1; }
      }
    }
  }

  function checkEnd() {
    if (state.over) return true;
    accountForDeaths();
    if (state.miles >= TOTAL_MILES) {
      state.miles = TOTAL_MILES;
      finish("arrival");
      return true;
    }
    if (!aliveParty().length) {
      finish("loss", "No one in the party is able to continue.");
      return true;
    }
    if (state.wagon <= 0) {
      finish("loss", "The wagon can no longer carry your party west.");
      return true;
    }
    return false;
  }

  function travel() {
    if (state.pending || state.over) return;
    const pace = {
      easy: { miles: [58, 76], days: 5, wear: 0 },
      steady: { miles: [82, 105], days: 5, wear: 2 },
      hard: { miles: [104, 132], days: 5, wear: 6 }
    }[state.pace];
    const previousMiles = state.miles;
    const planned = Math.min(TOTAL_MILES, state.miles + randomInt(...pace.miles));
    const river = RIVERS.find((entry) => !state.crossings.includes(entry.id) && state.miles < entry.mile && planned >= entry.mile);
    const distance = river ? river.mile - state.miles : planned - state.miles;
    state.miles = river ? river.mile : planned;
    state.weather = ["Clear", "Clear", "Clouds", "Rain", "Wind", "Cold snap"][randomInt(0, 5)];
    advanceDays(pace.days);
    const oxenWear = state.pace === "hard" ? randomInt(2, 5) : state.pace === "steady" ? randomInt(0, 2) : 0;
    state.wagon = Math.max(0, state.wagon - pace.wear - (state.weather === "Rain" ? 2 : 0));
    if (state.pace === "hard" && Math.random() < .13) {
      const member = aliveParty()[randomInt(0, aliveParty().length - 1)];
      member.health = Math.max(1, member.health - randomInt(6, 15));
    }
    if (distance < 5 && river) log(`The party reaches the ${river.name} after a short day's march.`);
    else log(`The party travels ${distance} miles west in five days. ${state.weather} skies, ${state.pace} pace.`);
    ROUTE.filter((stop) => stop.mile > previousMiles && stop.mile <= state.miles).forEach((stop) => log(`${stop.short} comes into view. ${stop.note}`));
    if (oxenWear > 0 && Math.random() < .3) state.oxen = Math.max(1, state.oxen - 1);
    if (river) {
      state.pending = { kind: "river", riverId: river.id };
      log(`${river.name} is ahead. The party stops to decide how to cross.`);
    } else if (!checkEnd()) {
      maybeEncounter();
    }
    checkEnd();
    refresh();
    persist();
  }

  function maybeEncounter() {
    const roll = Math.random();
    if (roll < .14) {
      state.pending = { kind: "breakdown" };
      log("A wagon wheel drops into a rut and cracks at the hub.");
    } else if (roll < .27) {
      const sick = aliveParty()[randomInt(0, aliveParty().length - 1)];
      sick.health = Math.max(18, sick.health - randomInt(8, 16));
      state.pending = { kind: "illness", member: sick.name };
      log(`${sick.name} has taken ill after a cold, wet spell.`);
    } else if (roll < .38) {
      state.pending = { kind: "storm" };
      log("A hard storm rolls over the open country. The canvas snaps in the wind.");
    } else if (roll < .51) {
      const foodFound = randomInt(25, 75);
      state.food += foodFound;
      state.pending = { kind: "good-fortune", food: foodFound };
      log(`A family on the trail shares ${foodFound} pounds of food after your team helps free a stuck wagon.`);
    } else if (roll < .63) {
      const wear = randomInt(7, 15);
      state.wagon = Math.max(1, state.wagon - wear);
      state.pending = { kind: "rough-road", wear };
      log("A long stretch of ruts takes its toll on the wagon frame.");
    }
  }

  function rest() {
    if (state.pending || state.over) return;
    advanceDays(3);
    const relief = state.ration === "filling" ? 12 : 5;
    for (const member of aliveParty()) member.health = Math.min(100, member.health + randomInt(relief - 4, relief));
    state.wagon = Math.min(100, state.wagon + 3);
    log(`The party rests for three days. ${state.ration === "filling" ? "A proper meal and sleep" : "A quiet camp"} helps the travelers recover.`);
    checkEnd();
    refresh();
    persist();
  }

  function startHunt() {
    if (state.pending || state.over) return;
    state.pending = { kind: "hunt" };
    refresh();
  }

  function hunt(size) {
    if (state.pending?.kind !== "hunt") return;
    const ammunition = size === "small" ? 3 : 8;
    if (state.ammo < ammunition) { showToast(`You need ${ammunition} rounds for this hunt.`); return; }
    state.ammo -= ammunition;
    advanceDays(1);
    const success = Math.random() < (size === "small" ? .82 : .61);
    if (success) {
      const found = size === "small" ? randomInt(18, 55) : randomInt(65, 165);
      state.food += found;
      log(`A ${size === "small" ? "small game" : "large game"} hunt brings ${found} pounds of meat to camp.`);
      showToast(`${found} pounds of food added.`);
    } else {
      log(`The ${size === "small" ? "small game" : "large game"} hunt turns up nothing. The day and ammunition are spent.`);
      showToast("No game found today.");
    }
    state.pending = null;
    checkEnd();
    refresh();
    persist();
  }

  function openTrade() {
    tradePanel.hidden = false;
    actionPanel.hidden = true;
    renderTrade();
  }

  function closeTrade() {
    tradePanel.hidden = true;
    actionPanel.hidden = Boolean(state.pending);
  }

  function renderTrade() {
    $("#trade-items").innerHTML = TRADE.map((item) => `<div class="trade-item"><strong>${item.name}</strong><small>${item.copy}</small><button type="button" data-buy="${item.id}" ${state.cash < item.price ? "disabled" : ""}>Buy for ${money(item.price)}</button></div>`).join("");
  }

  function buy(itemId) {
    const item = TRADE.find((entry) => entry.id === itemId);
    if (!item || state.cash < item.price || state.pending) return;
    state.cash -= item.price;
    state[item.id] += item.amount;
    log(`At ${ROUTE[currentRouteIndex()].short}, the party buys ${item.copy.toLowerCase()} for ${money(item.price)}.`);
    refresh();
    renderTrade();
    persist();
    showToast(`${item.name} added to the wagon.`);
  }

  function resolveEvent(choice) {
    if (!state.pending) return;
    const event = state.pending;
    if (event.kind === "river") {
      const river = RIVERS.find((entry) => entry.id === event.riverId);
      if (choice === "ferry") {
        if (state.cash < 24) return;
        state.cash -= 24;
        advanceDays(1);
        state.crossings.push(river.id);
        log(`The party pays $24 for a ferry across the ${river.name}. Every wagon and traveler makes it over safely.`);
      } else if (choice === "ford") {
        advanceDays(1);
        state.crossings.push(river.id);
        if (Math.random() < .32) {
          const loss = Math.min(state.food, randomInt(20, 75));
          state.food -= loss;
          state.wagon = Math.max(1, state.wagon - randomInt(2, 9));
          log(`The wagon is pushed through the current. ${loss} pounds of food are soaked, but the party reaches the far bank.`);
        } else {
          log(`The crossing takes a day and careful teamwork. The whole party reaches the far bank safely.`);
        }
      } else if (choice === "caulk") {
        advanceDays(2);
        state.crossings.push(river.id);
        const loss = Math.min(state.food, randomInt(0, 35));
        state.food -= loss;
        log(`The party caulks the wagon and floats it across the ${river.name}. Two days pass; ${loss} pounds of food are lost to the water.`);
      }
    } else if (event.kind === "breakdown") {
      if (choice === "repair" && state.parts > 0) {
        state.parts -= 1;
        advanceDays(1);
        state.wagon = Math.min(100, state.wagon + 24);
        log("Using a spare part, the party repairs the broken wheel and gets back on the trail.");
      } else if (choice === "limp") {
        advanceDays(1);
        state.wagon = Math.max(0, state.wagon - 27);
        const member = aliveParty()[randomInt(0, aliveParty().length - 1)];
        member.health = Math.max(1, member.health - randomInt(3, 9));
        log("The wheel is bound with rawhide. It holds for now, though the wagon frame suffers.");
      }
    } else if (event.kind === "illness") {
      const member = state.party.find((person) => person.name === event.member && person.alive);
      if (choice === "treat" && state.medicine > 0 && member) {
        state.medicine -= 1;
        advanceDays(1);
        member.health = Math.min(100, member.health + 35);
        log(`Medicine and a day's rest help ${member.name} recover.`);
      } else if (choice === "rest" && member) {
        advanceDays(2);
        member.health = Math.min(100, member.health + 19);
        log(`The party rests for two days while ${member.name} recovers without medicine.`);
      }
    } else if (event.kind === "storm") {
      if (choice === "wait") {
        advanceDays(2);
        for (const member of aliveParty()) member.health = Math.min(100, member.health + 3);
        log("The party waits two days for the storm to pass and checks the canvas before moving on.");
      } else if (choice === "press") {
        state.wagon = Math.max(0, state.wagon - 17);
        if (Math.random() < .28 && aliveParty().length) {
          const member = aliveParty()[randomInt(0, aliveParty().length - 1)];
          member.health = Math.max(1, member.health - 15);
        }
        log("The wagons press through the storm. The party saves two days, but a wheel and axle take a beating.");
      }
    } else if (event.kind === "rough-road") {
      if (choice === "patch" && state.parts > 0) {
        state.parts -= 1;
        advanceDays(1);
        state.wagon = Math.min(100, state.wagon + 16);
        log("A spare timber reinforces the wagon frame. The repair costs a day, but the wheels turn true again.");
      } else if (choice === "continue") {
        log("The party continues carefully and saves the spare parts for a worse day.");
      }
    } else if (event.kind === "good-fortune") {
      if (choice === "thanks") log("The families part with a wave. A small kindness carries the party west.");
    } else if (event.kind === "hunt") {
      if (choice === "small") { hunt("small"); return; }
      if (choice === "large") { hunt("large"); return; }
      if (choice === "cancel") { state.pending = null; refresh(); return; }
    }
    state.pending = null;
    checkEnd();
    refresh();
    persist();
  }

  function finish(outcome, reason = "") {
    state.over = true;
    state.outcome = outcome;
    state.pending = null;
    state.endedAt = dateLabel();
    state.endReason = reason;
    persist();
    showEnd();
  }

  function showEnd() {
    gameView.hidden = true;
    setupView.hidden = true;
    endView.hidden = false;
    $("#header-date").hidden = true;
    const arrived = state.outcome === "arrival";
    $("#end-kicker").textContent = arrived ? "OREGON CITY · 1848" : "A HARD END TO THE JOURNEY";
    $("#end-title").textContent = arrived ? "The valley, at last." : "The trail took its toll.";
    $("#end-message").textContent = arrived
      ? `${state.leader} and the party reach Oregon City on ${state.endedAt}, after ${state.elapsedDays} days on the trail. The Willamette lies green below the hills; the road behind you is part of the story now.`
      : `${state.endReason || "The journey cannot continue."} ${state.leader} and the remaining party made it ${state.miles.toLocaleString()} miles west over ${state.elapsedDays} days.`;
    $("#end-stats").innerHTML = `<div class="end-stat"><span>DAYS ON THE TRAIL</span><strong>${state.elapsedDays}</strong></div><div class="end-stat"><span>MILES WEST</span><strong>${state.miles.toLocaleString()}</strong></div><div class="end-stat"><span>TRAVELERS REMAINING</span><strong>${aliveParty().length} / ${state.party.length}</strong></div>`;
    updateSaveButton();
  }

  function eventChoices(event) {
    if (event.kind === "river") {
      const river = RIVERS.find((entry) => entry.id === event.riverId);
      return {
        kicker: "A CROSSING AHEAD",
        title: `Cross the ${river.name}`,
        copy: river.text,
        choices: [
          { id: "ferry", label: "Hire the ferry", detail: "$24 · 1 day · safest", primary: true, disabled: state.cash < 24 },
          { id: "ford", label: "Ford the river", detail: "1 day · risk to food and wagon" },
          { id: "caulk", label: "Caulk and float the wagon", detail: "2 days · a little food may be lost" }
        ]
      };
    }
    if (event.kind === "breakdown") return { kicker: "WAGON TROUBLE", title: "A wheel has cracked.", copy: "The hub is split where the wheel struck a rut. A spare kit can get you moving again, or the team can bind it well enough to keep going.", choices: [{ id: "repair", label: "Repair it here", detail: state.parts > 0 ? "Use 1 spare part · 1 day" : "No spare parts available", primary: state.parts > 0, disabled: state.parts === 0 }, { id: "limp", label: "Bind it and move on", detail: "Save supplies · the wagon will take damage" }] };
    if (event.kind === "illness") return { kicker: "ONE OF THE PARTY IS SICK", title: `${event.member} needs care.`, copy: "A fever has come on after several damp nights. Rest and medicine can help, though the party will lose time if you stop here.", choices: [{ id: "treat", label: "Use medicine", detail: state.medicine ? "Use 1 medicine kit · 1 day" : "No medicine left", primary: state.medicine > 0, disabled: state.medicine === 0 }, { id: "rest", label: "Rest and keep them warm", detail: "2 days · no supplies used" }] };
    if (event.kind === "storm") return { kicker: "WEATHER ON THE TRAIL", title: "A storm is closing in.", copy: "Rain is coming hard across the prairie. The team is tired, and the wagon cover needs checking before the wind arrives.", choices: [{ id: "wait", label: "Wait out the storm", detail: "2 days · safer for the party", primary: true }, { id: "press", label: "Press through the weather", detail: "Save time · risk the wagon and team" }] };
    if (event.kind === "rough-road") return { kicker: "ROUGH COUNTRY", title: "The road is wearing the wagon.", copy: `A long set of ruts has cost about ${event.wear}% of the wagon's strength. Reinforce the frame now or save the spare parts for later.`, choices: [{ id: "patch", label: "Patch the frame", detail: state.parts > 0 ? "Use 1 spare part · 1 day" : "No spare parts available", primary: state.parts > 0, disabled: state.parts === 0 }, { id: "continue", label: "Save the spare parts", detail: "No time or supplies used" }] };
    if (event.kind === "good-fortune") return { kicker: "A KINDNESS ON THE ROAD", title: "A good turn returned.", copy: `Your help with a stuck wagon earns a gift of ${event.food} pounds of food. The other family sends you on with a wave.`, choices: [{ id: "thanks", label: "Share thanks and move on", detail: "The trail has room for kindness", primary: true }] };
    if (event.kind === "hunt") return { kicker: "OUT ON THE HUNT", title: "Choose your quarry.", copy: "Game is scarce this far from a settlement. Small game is easier to find; larger game can fill the larder if your aim is true.", choices: [{ id: "small", label: "Look for small game", detail: "3 rounds · likely 18–55 lb", primary: true, disabled: state.ammo < 3 }, { id: "large", label: "Track large game", detail: "8 rounds · 65–165 lb if successful", disabled: state.ammo < 8 }, { id: "cancel", label: "Return to camp", detail: "No time or ammunition used" }] };
    return null;
  }

  function renderEvent() {
    const event = state.pending ? eventChoices(state.pending) : null;
    eventPanel.hidden = !event;
    actionPanel.hidden = Boolean(event) || !tradePanel.hidden;
    if (!event) { eventPanel.innerHTML = ""; return; }
    const urgent = ["illness", "breakdown"].includes(state.pending.kind);
    eventPanel.classList.toggle("urgent", urgent);
    eventPanel.innerHTML = `<p class="event-kicker">${escapeHTML(event.kicker)}</p><h2>${escapeHTML(event.title)}</h2><p class="event-copy">${escapeHTML(event.copy)}</p><div class="event-choices">${event.choices.map((choice) => `<button class="event-choice ${choice.primary ? "primary-choice" : ""}" type="button" data-choice="${escapeHTML(choice.id)}" ${choice.disabled ? "disabled" : ""}>${escapeHTML(choice.label)}<span class="event-cost">${escapeHTML(choice.detail)}</span></button>`).join("")}</div>`;
  }

  function renderRoute() {
    const stopHost = $("#route-stops");
    const index = currentRouteIndex();
    stopHost.innerHTML = ROUTE.map((stop, stopIndex) => {
      const position = Math.max(1, Math.min(99, (stop.mile / TOTAL_MILES) * 100));
      const status = stopIndex < index ? "done" : stopIndex === index ? "current" : "";
      return `<div class="route-stop ${status}" style="top:${position}%"><span class="route-stop-dot"></span><span class="route-stop-name">${escapeHTML(stop.short)}</span></div>`;
    }).join("");
    $("#route-position").style.top = `${Math.max(1, Math.min(99, (state.miles / TOTAL_MILES) * 100))}%`;
    const progress = Math.floor((state.miles / TOTAL_MILES) * 100);
    $("#route-progress-label").textContent = `${progress}%`;
  }

  function renderParty() {
    $("#party-heading").textContent = partyTitle();
    $("#party-count").textContent = String(aliveParty().length);
    $("#party-list").innerHTML = state.party.map((member) => {
      const status = !member.alive ? "Gone" : member.health > 75 ? "Well" : member.health > 45 ? "Fair" : "Poor";
      const healthClass = member.alive && member.health <= 55 ? "unwell" : "";
      return `<div class="party-member"><span class="member-initial" aria-hidden="true">${escapeHTML(member.name.charAt(0).toUpperCase())}</span><span class="member-name">${escapeHTML(member.name)}${member.name === state.leader ? " <small>(you)</small>" : ""}</span><span class="member-health ${healthClass}">${status}</span></div>`;
    }).join("");
  }

  function renderSupplies() {
    const items = [
      ["Food", `${Math.floor(state.food).toLocaleString()} lb`],
      ["Ammunition", `${state.ammo} rounds`],
      ["Medicine", `${state.medicine} ${state.medicine === 1 ? "kit" : "kits"}`],
      ["Spare parts", `${state.parts} ${state.parts === 1 ? "kit" : "kits"}`],
      ["Oxen", String(state.oxen)]
    ];
    $("#supply-list").innerHTML = items.map(([name, amount]) => `<div class="supply-item"><span>${name}</span><strong>${amount}</strong></div>`).join("");
    $("#money-value").textContent = money(state.cash);
    const atFort = ROUTE[currentRouteIndex()].fort && state.miles < TOTAL_MILES;
    $("#trade-open").hidden = !atFort;
  }

  function renderStats() {
    $("#header-date").textContent = dateLabel();
    $("#trip-kicker").textContent = `${state.roleName.toUpperCase()} · DEPARTED ${MONTHS[state.startMonth ?? 4].toUpperCase()} 1848`;
    $("#journey-title").textContent = `${state.leader.split(/\s+/).at(-1)} and the road west.`;
    $("#day-stat").textContent = String(state.elapsedDays + 1).padStart(2, "0");
    $("#mile-stat").innerHTML = `${state.miles.toLocaleString()} <small>mi</small>`;
    $("#wagon-stat").textContent = state.wagon > 74 ? "Sound" : state.wagon > 39 ? "Worn" : "Poor";
    $("#wagon-stat").classList.toggle("stat-alert", state.wagon <= 39);
    $("#weather-stat").textContent = state.weather;
    $("#scene-date").textContent = dateLabel().toUpperCase();
    $("#location-title").textContent = regionName();
    $("#location-note").textContent = locationNote();
    const next = nextRouteStop();
    $("#next-stop-label").textContent = state.miles >= TOTAL_MILES ? "THE JOURNEY'S END" : `NEXT: ${next.short.toUpperCase()} · ${Math.max(0, next.mile - state.miles)} MI`;
    const travel = { easy: "5 days · around 65 miles", steady: "5 days · around 90 miles", hard: "5 days · around 120 miles" }[state.pace];
    $("#travel-detail").textContent = travel;
    $$("[data-pace]").forEach((button) => button.classList.toggle("selected", button.dataset.pace === state.pace));
    $$("[data-ration]").forEach((button) => button.classList.toggle("selected", button.dataset.ration === state.ration));
    const paceNote = { easy: "An easy pace gives the team room to recover.", steady: "A steady pace keeps the team fresh.", hard: "A hard pace gains miles but wears the wagon." }[state.pace];
    const rationNote = state.ration === "filling" ? "Filling rations use about 1.8 lb per person daily." : "Meager rations stretch the food; the party may tire.";
    $("#condition-note").textContent = `${paceNote} ${rationNote}`;
  }

  function refresh() {
    if (!state) return;
    if (state.over) { showEnd(); return; }
    gameView.hidden = false;
    renderStats();
    renderRoute();
    renderParty();
    renderSupplies();
    $("#journal-list").innerHTML = state.journal.map((entry) => `<li class="journal-entry"><time>${escapeHTML(entry.date)}</time><p>${escapeHTML(entry.message)}</p></li>`).join("");
    renderEvent();
    actionPanel.hidden = Boolean(state.pending) || !tradePanel.hidden;
    if (!tradePanel.hidden) renderTrade();
  }

  function setPace(value) {
    if (!["easy", "steady", "hard"].includes(value) || state.pending) return;
    state.pace = value;
    refresh();
    persist();
  }

  function setRation(value) {
    if (!["meager", "filling"].includes(value) || state.pending) return;
    state.ration = value;
    refresh();
    persist();
  }

  startForm.addEventListener("submit", startJourney);
  $("#load-save").addEventListener("click", resumeJourney);
  $("#save-trip").addEventListener("click", saveJourney);
  $("#new-journey").addEventListener("click", resetToStart);
  $("#trade-open").addEventListener("click", openTrade);
  $("#trade-close").addEventListener("click", closeTrade);

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (action && state && !state.over) {
      if (action.dataset.action === "travel") travel();
      if (action.dataset.action === "rest") rest();
      if (action.dataset.action === "hunt") startHunt();
      return;
    }
    const choice = event.target.closest("[data-choice]");
    if (choice && state && !state.over) { resolveEvent(choice.dataset.choice); return; }
    const purchase = event.target.closest("[data-buy]");
    if (purchase && state && !state.over) { buy(purchase.dataset.buy); return; }
    const pace = event.target.closest("[data-pace]");
    if (pace && state && !state.over) { setPace(pace.dataset.pace); return; }
    const ration = event.target.closest("[data-ration]");
    if (ration && state && !state.over) setRation(ration.dataset.ration);
  });

  const existingSave = readSaved();
  if (existingSave && !existingSave.over) $("#load-save").hidden = false;
})();

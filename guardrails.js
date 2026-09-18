const ALLOWED_TYPES = [
  "solar_reduction",
  "minimum_battery_reserve",
  "no_charge_window",
  "no_discharge_window",
  "max_grid_window",
  "no_op"
];

function validateDirectives(directives, operatorNotes, battery) {
  if (!Array.isArray(directives)) {
    throw new Error("Directives must be an array");
  }

  if (directives.length !== operatorNotes.length) {
    throw new Error("Every operator note must have exactly one directive");
  }

  const sorted = [...directives].sort(
    (a, b) => a.note_index - b.note_index
  );

  for (let i = 0; i < sorted.length; i++) {
    const d = sorted[i];

    if (d.note_index !== i) {
      throw new Error("Invalid note_index order");
    }

    if (!ALLOWED_TYPES.includes(d.directive_type)) {
      throw new Error("Unsupported directive type");
    }

    if (d.directive_type === "no_op") {
      if (d.applies !== false) {
        throw new Error("no_op must have applies=false");
      }

      if (d.structured_adjustment !== null) {
        throw new Error("no_op adjustment must be null");
      }

      continue;
    }

    if (d.applies !== true) {
      throw new Error(
        "Applicable directives must have applies=true"
      );
    }

    if (!d.structured_adjustment) {
      throw new Error(
        "Missing structured adjustment"
      );
    }

    const hours = d.structured_adjustment.hours;

    if (!Array.isArray(hours)) {
      throw new Error("hours must be an array");
    }

    for (let i = 0; i < hours.length; i++) {
      if (
        !Number.isInteger(hours[i]) ||
        hours[i] < 0 ||
        hours[i] > 23
      ) {
        throw new Error("Invalid hour");
      }

      if (
        i > 0 &&
        hours[i] <= hours[i - 1]
      ) {
        throw new Error(
          "Hours must be unique and ascending"
        );
      }
    }

    if (d.directive_type === "solar_reduction") {
      const factor = d.structured_adjustment.factor;

      if (
        typeof factor !== "number" ||
        !Number.isFinite(factor) ||
        factor < 0 ||
        factor > 1
      ) {
        throw new Error("Invalid solar factor");
      }
    }

    if (
      d.directive_type ===
      "minimum_battery_reserve"
    ) {
      const value =
        d.structured_adjustment.minimum_energy_kwh;

      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > battery.capacity_kwh
      ) {
        throw new Error(
          "Invalid battery reserve"
        );
      }
    }

    if (
      d.directive_type ===
      "max_grid_window"
    ) {
      const value =
        d.structured_adjustment.max_grid_kwh;

      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0
      ) {
        throw new Error(
          "Invalid grid cap"
        );
      }
    }
  }

  return sorted;
}

module.exports = {
  validateDirectives
};
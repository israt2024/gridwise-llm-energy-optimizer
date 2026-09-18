const express = require("express");

const { interpretNotes } = require("./llm");
const { validateDirectives } = require("./guardrails");
const { optimizeEnergy } = require("./optimizer");

const app = express();

app.use(express.json());

app.use(express.static("public"));


// =========================
// HEALTH
// =========================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok"
  });
});


// =========================
// OPTIMIZE ENERGY
// =========================

app.post("/optimize-energy", async (req, res) => {
  try {
    const input = req.body;

    // Basic request validation
    if (!input || typeof input !== "object") {
      return res.status(400).json({
        error: "Invalid JSON body"
      });
    }

    if (!input.scenario_id) {
      return res.status(400).json({
        error: "scenario_id is required"
      });
    }

    if (
      !Array.isArray(input.operator_notes) ||
      input.operator_notes.length < 1 ||
      input.operator_notes.length > 3
    ) {
      return res.status(400).json({
        error:
          "operator_notes must contain 1 to 3 notes"
      });
    }

    if (
      !Array.isArray(input.hours) ||
      input.hours.length !== 24
    ) {
      return res.status(400).json({
        error: "hours must contain exactly 24 entries"
      });
    }

    if (!input.battery) {
      return res.status(400).json({
        error: "battery is required"
      });
    }


    // 1. Interpret notes
    const rawDirectives =
  await interpretNotes(input.operator_notes);


    // 2. Guardrails
    const directives =
      validateDirectives(
        rawDirectives,
        input.operator_notes,
        input.battery
      );


    // 3. Optimize
    const result =
      optimizeEnergy(
        input,
        directives
      );


    // 4. Response
    res.status(200).json({
      scenario_id: input.scenario_id,

      directive_interpretation:
        directives,

      hourly_plan:
        result.hourly_plan,

      total_grid_kwh:
        result.total_grid_kwh,

      total_cost_bdt:
        result.total_cost_bdt,

      peak_grid_kwh:
        result.peak_grid_kwh,

      plan_summary:
        "The schedule uses available solar first, manages battery energy according to the interpreted directives, and uses grid electricity for remaining demand."
    });

  } catch (error) {

    console.error("Optimization error:", error.message);

    res.status(500).json({
      error: "Optimization failed"
    });
  }
});


const PORT = process.env.PORT || 3000;


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
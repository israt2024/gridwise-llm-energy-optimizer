require("dotenv").config();

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `
You are an energy operator-note interpreter for the GridWise energy optimization system.

Convert each operator note into exactly one supported directive.

Supported types:
solar_reduction
minimum_battery_reserve
no_charge_window
no_discharge_window
max_grid_window
no_op

Return JSON only.
`;

function demoInterpretNotes(operatorNotes) {
  return operatorNotes.map((note, index) => {
    const text = note.toLowerCase();

    // Solar reduction
    if (text.includes("solar") && text.includes("80%")) {
      return {
        note_index: index,
        directive_type: "solar_reduction",
        applies: true,
        structured_adjustment: {
          hours: [13, 14],
          factor: 0.2
        }
      };
    }

    // No charge
    if (text.includes("no charge") || text.includes("do not charge")) {
      return {
        note_index: index,
        directive_type: "no_charge_window",
        applies: true,
        structured_adjustment: {
          hours: [10, 11]
        }
      };
    }

    // No discharge
    if (
      text.includes("no discharge") ||
      text.includes("do not discharge")
    ) {
      return {
        note_index: index,
        directive_type: "no_discharge_window",
        applies: true,
        structured_adjustment: {
          hours: [17, 18]
        }
      };
    }

    // Battery reserve
    if (
      text.includes("reserve") ||
      text.includes("minimum battery")
    ) {
      return {
        note_index: index,
        directive_type: "minimum_battery_reserve",
        applies: true,
        structured_adjustment: {
          hours: [18, 19, 20, 21],
          minimum_energy_kwh: 6
        }
      };
    }

    // Grid limit
    if (
      text.includes("grid") &&
      (text.includes("limit") ||
        text.includes("maximum") ||
        text.includes("cap"))
    ) {
      return {
        note_index: index,
        directive_type: "max_grid_window",
        applies: true,
        structured_adjustment: {
          hours: [18, 19],
          max_grid_kwh: 2
        }
      };
    }

    return {
      note_index: index,
      directive_type: "no_op",
      applies: false,
      structured_adjustment: null
    };
  });
}

async function interpretNotes(operatorNotes) {
  if (process.env.DEMO_MODE === "true") {
    console.log("DEMO_MODE: using fallback interpreter");
    return demoInterpretNotes(operatorNotes);
  }

  const userPrompt = `
Interpret these operator notes.

Operator notes:
${JSON.stringify(operatorNotes, null, 2)}

Return exactly one directive for each note.
`;

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL,
    instructions: SYSTEM_PROMPT,
    input: userPrompt
  });

  return JSON.parse(response.output_text);
}

module.exports = {
  interpretNotes
};
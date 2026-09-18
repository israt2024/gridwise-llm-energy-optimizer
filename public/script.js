async function optimizeEnergy() {
  const resultBox = document.getElementById("result");

  resultBox.textContent = "Testing connection...";

  const hours = [];

  for (let h = 0; h < 24; h++) {
    let solar = 0;

    if (h >= 6 && h <= 19) {
      solar = Math.max(0, 8 - Math.abs(13 - h));
    }

    hours.push({
      hour: h,
      demand_kwh: 5,
      solar_kwh: solar,
      tariff_bdt_per_kwh: h >= 18 && h <= 20 ? 13 : 10
    });
  }

  const battery = {
    capacity_kwh: 10,
    initial_energy_kwh: 5,
    minimum_energy_kwh: 2,
    max_charge_kwh_per_hour: 3,
    max_discharge_kwh_per_hour: 3
  };

  const scenarioId =
    document.getElementById("scenarioId").value || "GRID-101";

  const notesText =
    document.getElementById("notes").value;

  const operatorNotes = notesText
    .split("\n")
    .map(x => x.trim())
    .filter(x => x.length > 0);

  try {
    const response = await fetch("/optimize-energy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        scenario_id: scenarioId,
        operator_notes: operatorNotes,
        hours,
        battery
      })
    });

    const data = await response.json();

    resultBox.textContent =
      JSON.stringify(data, null, 2);

  } catch (error) {
    resultBox.textContent =
      "Error: " + error.message;
  }
}
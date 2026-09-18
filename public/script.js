async function optimizeEnergy() {

  const resultArea = document.getElementById("resultsArea");
  const emptyState = document.getElementById("emptyState");
  const resultBox = document.getElementById("planTable");
  const button = document.getElementById("optimizeBtn");

  const scenarioId =
    document.getElementById("scenarioId").value.trim() || "GRID-101";

  const notesText =
    document.getElementById("notes").value.trim();

  if (!notesText) {
    alert("Please enter at least one operator instruction.");
    return;
  }

  button.disabled = true;
  button.innerHTML = "⏳ Optimizing...";

  /*
   * Demo energy data
   */
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
      tariff_bdt_per_kwh:
        h >= 18 && h <= 20 ? 13 : 10
    });
  }


  const battery = {
    capacity_kwh: 10,
    initial_energy_kwh: 5,
    minimum_energy_kwh: 2,
    max_charge_kwh_per_hour: 3,
    max_discharge_kwh_per_hour: 3
  };


  const operatorNotes = notesText
    .split("\n")
    .map(note => note.trim())
    .filter(note => note.length > 0);


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


    if (!response.ok) {
      throw new Error(data.error || "Optimization failed");
    }


    /*
     * Show results
     */

    emptyState.classList.add("hidden");
    resultArea.classList.remove("hidden");


    document.getElementById("totalGrid").textContent =
      data.total_grid_kwh ?? "--";

    document.getElementById("totalCost").textContent =
      data.total_cost_bdt ?? "--";

    document.getElementById("peakGrid").textContent =
      data.peak_grid_kwh ?? "--";

    document.getElementById("planSummary").textContent =
      data.plan_summary || "Optimization completed successfully.";


    /*
     * Directives
     */

    const directivesContainer =
      document.getElementById("directives");

    directivesContainer.innerHTML = "";


    if (
      data.directive_interpretation &&
      data.directive_interpretation.length > 0
    ) {

      data.directive_interpretation.forEach(item => {

        const div = document.createElement("div");

        div.className =
          item.applies === false
            ? "directive noop"
            : "directive";

        div.textContent =
          item.directive_type || "unknown";

        directivesContainer.appendChild(div);

      });

    } else {

      directivesContainer.innerHTML =
        '<div class="directive">No directives returned</div>';

    }


    /*
     * 24-hour table
     */

    resultBox.innerHTML = "";


    if (
      data.hourly_plan &&
      Array.isArray(data.hourly_plan)
    ) {

      data.hourly_plan.forEach(row => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${row.hour ?? "-"}</td>
          <td>${row.grid_kwh ?? 0}</td>
          <td>${row.solar_used_kwh ?? 0}</td>
          <td>${row.battery_action ?? "idle"}</td>
          <td>${row.battery_energy_after_kwh ?? 0}</td>
        `;

        resultBox.appendChild(tr);

      });

    }

  } catch (error) {

    emptyState.classList.remove("hidden");
    resultArea.classList.add("hidden");

    alert("Optimization failed: " + error.message);

  } finally {

    button.disabled = false;
    button.innerHTML = "<span>⚡</span> Optimize Energy";

  }

}
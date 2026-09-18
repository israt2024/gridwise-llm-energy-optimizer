function optimizeEnergy(input, directives = []) {
  const hours = input.hours;
  const battery = input.battery;

  const initialEnergy = battery.initial_energy_kwh;
  const capacity = battery.capacity_kwh;
  const minEnergy = battery.minimum_energy_kwh;

  const solarFactors = {};
  const reserveRequirements = {};
  const noChargeHours = new Set();
  const noDischargeHours = new Set();
  const gridCaps = {};

  // --------------------------------
  // Read directives
  // --------------------------------

  for (const d of directives) {
    if (!d.applies) continue;

    const a = d.structured_adjustment;

    if (d.directive_type === "solar_reduction") {
      for (const h of a.hours) {
        solarFactors[h] = a.factor;
      }
    }

    if (d.directive_type === "minimum_battery_reserve") {
      for (const h of a.hours) {
        reserveRequirements[h] = Math.max(
          reserveRequirements[h] || 0,
          a.minimum_energy_kwh
        );
      }
    }

    if (d.directive_type === "no_charge_window") {
      for (const h of a.hours) {
        noChargeHours.add(h);
      }
    }

    if (d.directive_type === "no_discharge_window") {
      for (const h of a.hours) {
        noDischargeHours.add(h);
      }
    }

    if (d.directive_type === "max_grid_window") {
      for (const h of a.hours) {
        gridCaps[h] = a.max_grid_kwh;
      }
    }
  }

  // --------------------------------
  // Prepare hourly data
  // --------------------------------

  const data = hours.map(item => {
    const factor = solarFactors[item.hour] ?? 1;

    return {
      hour: item.hour,
      demand: Number(item.demand_kwh),
      solar: Number(item.solar_kwh) * factor,
      tariff: Number(item.tariff_bdt_per_kwh)
    };
  });

  // --------------------------------
  // Start with simple solar usage
  // --------------------------------

  const plan = [];
  let energy = initialEnergy;

  for (const item of data) {
    const h = item.hour;

    const solarUsed = Math.min(
      item.demand,
      item.solar
    );

    const remainingDemand =
      item.demand - solarUsed;

    let grid = remainingDemand;
    let batteryAction = "idle";
    let batteryAmount = 0;

    const reserve = Math.max(
      minEnergy,
      reserveRequirements[h] || 0
    );

    // --------------------------------
    // Battery discharge
    // --------------------------------

    if (
      remainingDemand > 0 &&
      !noDischargeHours.has(h)
    ) {
      const available =
        Math.max(0, energy - reserve);

      const discharge = Math.min(
        remainingDemand,
        battery.max_discharge_kwh_per_hour,
        available
      );

      if (discharge > 0) {
        grid -= discharge;
        energy -= discharge;

        batteryAction = "discharge";
        batteryAmount = discharge;
      }
    }

    // --------------------------------
    // Grid cap
    // --------------------------------

    if (
      gridCaps[h] !== undefined &&
      grid > gridCaps[h]
    ) {
      const needed =
        grid - gridCaps[h];

      if (!noDischargeHours.has(h)) {
        const available =
          Math.max(0, energy - reserve);

        const extra = Math.min(
          needed,
          battery.max_discharge_kwh_per_hour -
            batteryAmount,
          available
        );

        if (extra > 0) {
          grid -= extra;
          energy -= extra;

          if (batteryAction === "discharge") {
            batteryAmount += extra;
          } else {
            batteryAction = "discharge";
            batteryAmount = extra;
          }
        }
      }
    }

    // --------------------------------
    // Solar surplus → battery
    // --------------------------------

    const surplus =
      Math.max(0, item.solar - solarUsed);

    if (
      surplus > 0 &&
      !noChargeHours.has(h)
    ) {
      const room =
        capacity - energy;

      const charge = Math.min(
        surplus,
        battery.max_charge_kwh_per_hour,
        room
      );

      if (charge > 0) {
        energy += charge;

        if (batteryAction === "idle") {
          batteryAction = "charge";
          batteryAmount = charge;
        }
      }
    }

    plan.push({
      hour: h,
      grid_kwh: Number(
        Math.max(0, grid).toFixed(4)
      ),
      solar_used_kwh: Number(
        solarUsed.toFixed(4)
      ),
      battery_action: batteryAction,
      battery_kwh: Number(
        batteryAmount.toFixed(4)
      ),
      battery_energy_after_kwh: Number(
        energy.toFixed(4)
      )
    });
  }

  // --------------------------------
  // Calculate totals
  // --------------------------------

  const totalGrid = plan.reduce(
    (sum, item) =>
      sum + item.grid_kwh,
    0
  );

  const totalCost = plan.reduce(
    (sum, item, index) =>
      sum +
      item.grid_kwh *
      data[index].tariff,
    0
  );

  const peakGrid = Math.max(
    ...plan.map(x => x.grid_kwh)
  );

  return {
    hourly_plan: plan,
    total_grid_kwh: Number(
      totalGrid.toFixed(4)
    ),
    total_cost_bdt: Number(
      totalCost.toFixed(4)
    ),
    peak_grid_kwh: Number(
      peakGrid.toFixed(4)
    ),
    final_battery_energy_kwh: Number(
      energy.toFixed(4)
    ),
    initial_battery_energy_kwh: initialEnergy
  };
}

module.exports = {
  optimizeEnergy
};
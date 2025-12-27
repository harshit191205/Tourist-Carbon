// src/components/AwarenessInsights.jsx
import React from "react";

const AwarenessInsights = ({ emissions }) => {
  if (!emissions) return null;

  const total = emissions.total; // kg CO2

  // Assumptions (approximate, for education only)
  const CAR_KG_PER_KM = 0.2;          // average passenger vehicle per km
  const TREE_KG_PER_YEAR = 22;        // 1 tree absorbs ~22 kg CO2/year
  const HOME_KG_PER_DAY = 12.6;       // 4.6 t / 365 ≈ 12.6 kg/day [EPA typical car scaled] [web:141]
  const PHONE_KG_PER_YEAR = 6;        // rough average use per year [web:145]
  const WATER_L_PER_KG = 50;          // placeholder; water footprint varies a lot

  const treesNeeded = Math.ceil(total / TREE_KG_PER_YEAR);
  const drivingKm = (total / CAR_KG_PER_KM).toFixed(0);
  const homeDays = (total / HOME_KG_PER_DAY).toFixed(1);
  const phoneYears = (total / PHONE_KG_PER_YEAR).toFixed(1);
  const waterLiters = (total * WATER_L_PER_KG).toFixed(0);

  const equivalentImpacts = [
    {
      icon: "🌳",
      label: "Trees needed (1 year)",
      value: `${treesNeeded}`,
      description: "Approximate trees to absorb this CO₂ over one year",
    },
    {
      icon: "🚗",
      label: "Driving distance",
      value: `${drivingKm} km`,
      description: "Equivalent to driving a typical car",
    },
    {
      icon: "🏠",
      label: "Home energy",
      value: `${homeDays} days`,
      description: "Average household electricity emissions",
    },
    {
      icon: "📱",
      label: "Smartphone use",
      value: `${phoneYears} years`,
      description: "Roughly equivalent to phone use emissions",
    },
    {
      icon: "💧",
      label: "Water footprint",
      value: `${waterLiters} L`,
      description: "Illustrative water use equivalent",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="section-label mb-1">Environmental impact</p>
            <p className="text-sm text-slate-300">
              Real‑world equivalents to help understand this trip’s footprint.
            </p>
          </div>
          <div className="text-xs text-slate-500 text-right">
            Based on simple global averages;{" "}
            <span className="font-medium">not exact</span>.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {equivalentImpacts.map((impact, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 flex flex-col gap-1 text-sm"
            >
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-lg">{impact.icon}</span>
                <span className="font-medium">{impact.label}</span>
              </div>
              <div className="text-base font-semibold mt-1">
                {impact.value}
              </div>
              <p className="text-xs text-slate-500">{impact.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AwarenessInsights;

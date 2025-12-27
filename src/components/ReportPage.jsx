// src/components/ReportPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import ImpactMetrics from "./ImpactMetrics";
import EmissionBreakdown from "./EmissionBreakdown";
import TransportComparison from "./TransportComparison";
import LowCarbonAlternatives from "./LowCarbonAlternatives";
import AwarenessInsights from "./AwarenessInsights";
import ExportReport from "./ExportReport";
import UserFeedback from "./UserFeedback";

const ReportPage = ({ emissions, tripData }) => {
  const navigate = useNavigate();

  if (!emissions || !tripData || !tripData.tripDetails) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-2">No report available</h2>
        <p className="text-sm text-slate-400 mb-4">
          Please calculate a trip first to see the carbon footprint report.
        </p>
        <button
          onClick={() => navigate("/")}
          className="btn-primary text-xs px-4 py-2"
        >
          Go to calculator
        </button>
      </div>
    );
  }

  const { origin, destination, purpose } = tripData.tripDetails;
  const { distance, mode } = tripData.transportData;
  const nights = tripData.accommodationData?.nights ?? 0;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-1">Report</p>
          <h2 className="text-lg font-semibold">
            {origin} → {destination}
          </h2>
          <p className="text-xs text-slate-400">
            {distance} km · {nights} nights · {purpose}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500"
          >
            New calculation
          </button>
          <span className="text-[11px] text-slate-500">
            {new Date().toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">
              Trip overview
            </p>
            <p className="text-sm text-slate-300">
              Mode: <span className="font-semibold">{mode.toUpperCase()}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900">
              <p className="text-slate-400">Total CO₂</p>
              <p className="text-base font-semibold text-emerald-400">
                {emissions.total} kg
              </p>
            </div>
            <div className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900">
              <p className="text-slate-400">Per day</p>
              <p className="text-base font-semibold">
                {emissions.perDay} kg
              </p>
            </div>
            <div className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900">
              <p className="text-slate-400">Trees to offset</p>
              <p className="text-base font-semibold">
                {emissions.treesNeeded}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs + main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <ImpactMetrics emissions={emissions} />
          </div>
          <div className="card p-5">
            <EmissionBreakdown emissions={emissions} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-5 h-full">
            <TransportComparison distance={distance} />
          </div>
        </div>
      </div>

      {/* Recommendations & insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <LowCarbonAlternatives emissions={emissions} tripData={tripData} />
        </div>
        <div className="card p-5">
          <AwarenessInsights emissions={emissions} />
        </div>
      </div>

      {/* Export & feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <ExportReport emissions={emissions} tripData={tripData} />
        </div>
        <div className="card p-5">
          <UserFeedback />
        </div>
      </div>
    </div>
  );
};

export default ReportPage;

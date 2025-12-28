// Enhanced Report Page Component
import React from "react";
import { calculateAlternativeScenario, calculateEcoScore } from "../utils/carbonCalculator";

const EnhancedReportPage = ({ emissions, tripData }) => {
  if (!emissions || !tripData) return null;

  const { origin, destination, purpose, travelFrequency, sustainabilityImportance, budgetFlexibility } = tripData.tripDetails;
  const { distance, mode, cabinClass, passengers } = tripData.transportData;
  const { type, nights, roomSharing } = tripData.accommodationData;
  const { mealsPerDay, dietType } = tripData.activityData;
  
  const ecoScore = calculateEcoScore(parseFloat(emissions.total), emissions.days);

  // PERSONALIZED RECOMMENDATIONS ENGINE
  const getPersonalizedRecommendations = () => {
    const recs = [];
    const transport = parseFloat(emissions.transport);
    const accommodation = parseFloat(emissions.accommodation);
    const perDay = parseFloat(emissions.perDay);
    
    // HIGH PRIORITY - Transport (biggest impact)
    if (mode === 'flight' && distance < 1500) {
      const trainSavings = transport * 0.88;
      recs.push({
        priority: 'critical',
        category: 'Transport',
        icon: '🚆',
        title: 'Take the train instead',
        why: `Your ${distance}km flight produced ${transport.toFixed(0)}kg CO₂. Trains emit 88% less.`,
        action: 'Book train tickets for your next trip',
        savings: trainSavings.toFixed(0),
        savingsPercent: 88,
        difficulty: 'Easy',
        cost: budgetFlexibility === 'high' ? 'Similar cost' : 'Often cheaper',
        timeImpact: distance < 500 ? 'Similar time' : '2-4 hours longer',
        personalFit: sustainabilityImportance === 'high' ? 'Perfect for you' : 'Worth considering'
      });
    }

    if (mode === 'flight' && distance >= 1500 && cabinClass !== 'economy') {
      const economySavings = transport * 0.67;
      recs.push({
        priority: 'high',
        category: 'Transport',
        icon: '💺',
        title: 'Fly economy class',
        why: `${cabinClass} class uses ${cabinClass === 'business' ? '3x' : '4x'} more space per passenger`,
        action: 'Choose economy for your next long-haul flight',
        savings: economySavings.toFixed(0),
        savingsPercent: 67,
        difficulty: 'Easy',
        cost: 'Major cost savings',
        timeImpact: 'No difference',
        personalFit: budgetFlexibility === 'low' ? 'Great cost saver' : 'Consider it'
      });
    }

    if (mode === 'car' && passengers === 1 && distance > 100) {
      recs.push({
        priority: 'high',
        category: 'Transport',
        icon: '👥',
        title: 'Carpool or use public transport',
        why: `Solo driving is inefficient. With 3 passengers, emissions drop by 67% per person`,
        action: 'Find carpooling partners or take intercity buses',
        savings: (transport * 0.60).toFixed(0),
        savingsPercent: 60,
        difficulty: 'Medium',
        cost: 'Share fuel costs',
        timeImpact: 'Similar',
        personalFit: purpose === 'business' ? 'Check company policy' : 'Great option'
      });
    }

    // MEDIUM PRIORITY - Accommodation
    if (type === 'hotel' && nights > 2) {
      const ecoSavings = accommodation * 0.72;
      recs.push({
        priority: 'medium',
        category: 'Accommodation',
        icon: '🌿',
        title: 'Stay at eco-certified hotels',
        why: `Standard hotels emit ${(accommodation / nights).toFixed(0)}kg/night. Eco-hotels: ${(accommodation * 0.28 / nights).toFixed(0)}kg/night`,
        action: 'Look for LEED, Green Key, or EarthCheck certified properties',
        savings: ecoSavings.toFixed(0),
        savingsPercent: 72,
        difficulty: 'Easy',
        cost: budgetFlexibility === 'high' ? 'Comparable' : 'Slightly more',
        timeImpact: 'None',
        personalFit: sustainabilityImportance === 'high' ? 'Highly recommended' : 'Good option'
      });
    }

    if (roomSharing === 'alone' && nights > 3) {
      recs.push({
        priority: 'medium',
        category: 'Accommodation',
        icon: '🏠',
        title: 'Try hostels or shared accommodation',
        why: 'Shared facilities have 50% lower emissions per person',
        action: 'Book hostels or shared Airbnbs',
        savings: (accommodation * 0.45).toFixed(0),
        savingsPercent: 45,
        difficulty: 'Easy',
        cost: 'Major savings',
        timeImpact: 'None',
        personalFit: purpose === 'leisure' && budgetFlexibility !== 'high' ? 'Perfect fit' : 'Consider it'
      });
    }

    // DIET RECOMMENDATIONS
    if (dietType === 'meat-heavy' || dietType === 'mixed') {
      const mealEmissions = mealsPerDay * nights * (dietType === 'meat-heavy' ? 5.8 : 2.5);
      const veganMealEmissions = mealsPerDay * nights * 0.9;
      const savings = mealEmissions - veganMealEmissions;
      
      recs.push({
        priority: 'medium',
        category: 'Food',
        icon: '🥗',
        title: dietType === 'meat-heavy' ? 'Reduce meat consumption' : 'Try more plant-based meals',
        why: `Your ${dietType} diet adds ~${mealEmissions.toFixed(0)}kg CO₂. Plant-based: ~${veganMealEmissions.toFixed(0)}kg`,
        action: 'Choose vegetarian or vegan options for some meals',
        savings: savings.toFixed(0),
        savingsPercent: ((savings / mealEmissions) * 100).toFixed(0),
        difficulty: 'Easy',
        cost: 'Often cheaper',
        timeImpact: 'None',
        personalFit: 'Easy daily action'
      });
    }

    // TRAVEL FREQUENCY
    if (travelFrequency === 'frequent' && perDay > 40) {
      recs.push({
        priority: 'high',
        category: 'Lifestyle',
        icon: '🌍',
        title: 'Consolidate trips or use virtual alternatives',
        why: `As a frequent traveler (${travelFrequency}), your annual footprint is significant`,
        action: 'Combine business trips, use video calls when possible',
        savings: 'Varies',
        savingsPercent: 'Up to 80%',
        difficulty: 'Medium',
        cost: 'Saves money',
        timeImpact: 'More efficient',
        personalFit: purpose === 'business' ? 'Highly relevant' : 'Consider it'
      });
    }

    // CARBON OFFSET (Always include)
    recs.push({
      priority: 'low',
      category: 'Offset',
      icon: '💚',
      title: 'Offset your unavoidable emissions',
      why: `Offset ${emissions.total}kg CO₂ through verified projects`,
      action: `Invest $${emissions.offsetCost} in Gold Standard carbon credits`,
      savings: emissions.total,
      savingsPercent: 100,
      difficulty: 'Very Easy',
      cost: `$${emissions.offsetCost}`,
      timeImpact: 'None',
      personalFit: 'Everyone can do this'
    });

    // Sort by priority and user preferences
    return recs.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // If sustainability is important, prioritize high-savings
      if (sustainabilityImportance === 'high') {
        return parseFloat(b.savingsPercent) - parseFloat(a.savingsPercent);
      }
      return 0;
    });
  };

  const recommendations = getPersonalizedRecommendations();

  // VISUAL EMISSION BREAKDOWN
  const EmissionBreakdownVisual = () => {
    const total = parseFloat(emissions.total);
    const components = [
      { 
        name: 'Transport', 
        value: parseFloat(emissions.transport), 
        color: 'from-red-500 to-red-600',
        icon: mode === 'flight' ? '✈️' : mode === 'train' ? '🚆' : mode === 'car' ? '🚗' : '🚌',
        details: `${distance}km via ${mode}${mode === 'flight' && cabinClass !== 'economy' ? ` (${cabinClass})` : ''}`
      },
      { 
        name: 'Accommodation', 
        value: parseFloat(emissions.accommodation), 
        color: 'from-amber-500 to-amber-600',
        icon: type === 'hotel' ? '🏨' : type === 'hostel' ? '🏠' : type === 'ecoresort' ? '🌿' : '🏡',
        details: `${nights} nights at ${type}`
      },
      { 
        name: 'Activities', 
        value: parseFloat(emissions.activities), 
        color: 'from-blue-500 to-blue-600',
        icon: '🎯',
        details: `${emissions.totalActivities || 0} activities + ${nights * mealsPerDay} meals`
      }
    ].filter(c => c.value > 0);

    return (
      <div className="card p-6 mb-6">
        <h3 className="text-2xl font-bold mb-6 gradient-text">
          🔍 Detailed Emission Breakdown
        </h3>
        
        {/* Visual Bar */}
        <div className="mb-8">
          <div className="flex h-16 rounded-xl overflow-hidden shadow-lg">
            {components.map((comp, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${comp.color} flex items-center justify-center text-white font-bold transition-all hover:opacity-80 cursor-pointer group relative`}
                style={{ width: `${(comp.value / total) * 100}%` }}
              >
                <span className="text-2xl group-hover:scale-125 transition-transform">
                  {comp.icon}
                </span>
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 rounded-lg p-3 text-xs whitespace-nowrap z-10 shadow-xl">
                  <div className="font-bold">{comp.name}</div>
                  <div className="text-slate-300">{comp.value.toFixed(1)} kg CO₂e</div>
                  <div className="text-slate-400">{((comp.value / total) * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {components.map((comp, i) => (
              <div key={i} className="card p-4 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{comp.icon}</span>
                  <div className={`text-2xl font-bold bg-gradient-to-r ${comp.color} bg-clip-text text-transparent`}>
                    {comp.value.toFixed(0)}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-300 mb-1">{comp.name}</div>
                <div className="text-xs text-slate-400 mb-2">{comp.details}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{((comp.value / total) * 100).toFixed(1)}% of total</span>
                  <span className={`font-bold bg-gradient-to-r ${comp.color} bg-clip-text text-transparent`}>
                    {comp.value.toFixed(2)} kg
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Breakdown */}
        <div className="card p-5 bg-slate-800/50">
          <h4 className="font-bold text-slate-200 mb-3 flex items-center">
            <span className="mr-2">📅</span> Daily Impact Analysis
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{emissions.perDay}</div>
              <div className="text-xs text-slate-400">kg CO₂e/day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{(parseFloat(emissions.transport) / emissions.days).toFixed(1)}</div>
              <div className="text-xs text-slate-400">transport/day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{emissions.perNight}</div>
              <div className="text-xs text-slate-400">per night stay</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{emissions.perKm}</div>
              <div className="text-xs text-slate-400">kg per km</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // PERSONALIZED RECOMMENDATIONS DISPLAY
  const PersonalizedRecommendations = () => (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold gradient-text">
            🎯 Your Personalized Action Plan
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Based on your trip, preferences, and sustainability goals
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-emerald-400">
            {recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length}
          </div>
          <div className="text-xs text-slate-400">High-impact actions</div>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const priorityColors = {
            critical: 'border-red-500 bg-red-500/5',
            high: 'border-amber-500 bg-amber-500/5',
            medium: 'border-blue-500 bg-blue-500/5',
            low: 'border-emerald-500 bg-emerald-500/5'
          };

          const priorityBadges = {
            critical: { label: 'CRITICAL', color: 'bg-red-500' },
            high: { label: 'HIGH IMPACT', color: 'bg-amber-500' },
            medium: { label: 'MEDIUM', color: 'bg-blue-500' },
            low: { label: 'OPTIONAL', color: 'bg-emerald-500' }
          };

          return (
            <div
              key={index}
              className={`card p-6 border-l-4 ${priorityColors[rec.priority]} hover:scale-[1.02] transition-all`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-5xl">{rec.icon}</div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-bold text-slate-100">{rec.title}</h4>
                        <span className={`${priorityBadges[rec.priority].color} text-white text-xs px-2 py-1 rounded-full font-bold`}>
                          {priorityBadges[rec.priority].label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{rec.why}</p>
                      <p className="text-sm text-emerald-400 font-semibold">
                        ✓ {rec.action}
                      </p>
                    </div>
                    
                    {/* Savings Badge */}
                    {rec.savings !== 'Varies' && (
                      <div className="text-right bg-emerald-500/20 rounded-xl p-4 min-w-[120px]">
                        <div className="text-3xl font-bold text-emerald-400">
                          -{rec.savingsPercent}%
                        </div>
                        <div className="text-sm text-emerald-300">
                          {rec.savings} kg saved
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div className="card p-3 bg-slate-800/50">
                      <div className="text-xs text-slate-400 mb-1">Difficulty</div>
                      <div className="text-sm font-semibold text-slate-200">{rec.difficulty}</div>
                    </div>
                    <div className="card p-3 bg-slate-800/50">
                      <div className="text-xs text-slate-400 mb-1">Cost</div>
                      <div className="text-sm font-semibold text-slate-200">{rec.cost}</div>
                    </div>
                    <div className="card p-3 bg-slate-800/50">
                      <div className="text-xs text-slate-400 mb-1">Time Impact</div>
                      <div className="text-sm font-semibold text-slate-200">{rec.timeImpact}</div>
                    </div>
                    <div className="card p-3 bg-slate-800/50">
                      <div className="text-xs text-slate-400 mb-1">For You</div>
                      <div className="text-sm font-semibold text-emerald-400">{rec.personalFit}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Summary */}
      <div className="card p-8 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold gradient-text mb-2">
              {origin} → {destination}
            </h1>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <span>📍 {distance} km</span>
              <span>•</span>
              <span>🗓️ {nights} nights</span>
              <span>•</span>
              <span className="capitalize">🎒 {purpose}</span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-6xl font-bold gradient-text mb-2">
              {emissions.total}
            </div>
            <div className="text-slate-400 mb-3">kg CO₂e total</div>
            <div className={`badge ${
              parseFloat(emissions.perDay) <= 28.5 ? 'badge-success' : 
              parseFloat(emissions.perDay) <= 45 ? 'badge-warning' : 'badge-danger'
            }`}>
              {emissions.category}
            </div>
          </div>
        </div>
      </div>

      <EmissionBreakdownVisual />
      <PersonalizedRecommendations />
    </div>
  );
};

export default EnhancedReportPage;
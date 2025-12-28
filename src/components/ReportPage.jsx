import React from "react";
import carbonCalculator from "../utils/carbonCalculator";

const { calculateEcoScore } = carbonCalculator;

const EnhancedReportPage = ({ emissions, tripData }) => {
  if (!emissions || !tripData) return null;

  const { origin, destination, purpose, travelFrequency, sustainabilityImportance, budgetFlexibility } = tripData.tripDetails;
  const { distance, mode, cabinClass, passengers } = tripData.transportData;
  const { type, nights, roomSharing } = tripData.accommodationData;
  const { mealsPerDay, dietType } = tripData.activityData;
  
  const ecoScore = calculateEcoScore(parseFloat(emissions.total), emissions.days);

  const getPersonalizedRecommendations = () => {
    const recs = [];
    const transport = parseFloat(emissions.transport);
    const accommodation = parseFloat(emissions.accommodation);
    const activities = parseFloat(emissions.activities);
    const total = parseFloat(emissions.total);
    const perDay = parseFloat(emissions.perDay);
    
    if (mode === 'flight' && distance < 1500) {
      const trainSavings = transport * 0.88;
      recs.push({
        priority: 'critical',
        category: 'Transport',
        icon: '🚆',
        title: 'Switch to Train for This Route',
        why: `Your ${distance}km flight produced ${transport.toFixed(0)}kg CO₂. Trains emit up to 88% less for this distance.`,
        action: `Book train tickets from ${origin} to ${destination}. Consider high-speed rail options for comfort.`,
        savings: trainSavings.toFixed(0),
        savingsPercent: 88,
        difficulty: distance < 500 ? 'Very Easy' : 'Easy',
        cost: budgetFlexibility === 'high' ? 'Similar or cheaper' : 'Often 20-40% cheaper',
        timeImpact: distance < 500 ? 'Similar time (1-2h difference)' : 'Add 3-5 hours',
        personalFit: sustainabilityImportance === 'high' ? '⭐ Perfect for your eco-goals' : 'Worth considering',
        implementationTips: [
          'Book early for best prices',
          'Choose direct routes when possible',
          'Premium coaches offer comfort similar to business class'
        ]
      });
    }

    if (mode === 'flight' && distance >= 1500 && cabinClass !== 'economy') {
      const economySavings = transport * (cabinClass === 'business' ? 0.67 : 0.75);
      recs.push({
        priority: 'high',
        category: 'Transport',
        icon: '💺',
        title: 'Fly Economy Class',
        why: `${cabinClass} class uses ${cabinClass === 'business' ? '3x' : '4x'} more space per passenger, increasing your footprint.`,
        action: `Choose economy class for future long-haul flights. Your savings: ${economySavings.toFixed(0)}kg CO₂`,
        savings: economySavings.toFixed(0),
        savingsPercent: cabinClass === 'business' ? 67 : 75,
        difficulty: 'Very Easy',
        cost: `Save ₹${cabinClass === 'business' ? '50,000-1,50,000' : '1,00,000-3,00,000'} per ticket`,
        timeImpact: 'No difference in travel time',
        personalFit: budgetFlexibility === 'low' ? '💰 Major cost & carbon savings' : 'Consider for environmental impact',
        implementationTips: [
          'Book extra legroom economy seats for more comfort',
          'Use airline lounges for pre-flight comfort',
          'Bring your own entertainment and comfort items'
        ]
      });
    }

    if (mode === 'car' && passengers === 1 && distance > 100) {
      const carpoolSavings = transport * 0.60;
      recs.push({
        priority: 'high',
        category: 'Transport',
        icon: '👥',
        title: 'Carpool or Take Public Transport',
        why: `Solo driving emitted ${transport.toFixed(0)}kg CO₂. With 3 passengers, your per-person emissions drop 67%.`,
        action: 'Use BlaBlaCar, QuickRide, or coordinate with colleagues/friends traveling the same route.',
        savings: carpoolSavings.toFixed(0),
        savingsPercent: 60,
        difficulty: 'Medium',
        cost: 'Share fuel costs - save 50-70% on transport',
        timeImpact: 'Similar, slight pickup/dropoff detours',
        personalFit: purpose === 'business' ? 'Check company carpooling programs' : '✅ Great for leisure trips',
        implementationTips: [
          'Use carpooling apps like BlaBlaCar, sRide',
          'Join Facebook travel groups for your route',
          'Consider bus/train for intercity if available'
        ]
      });
    }

    if (mode === 'flight' && distance < 500) {
      recs.push({
        priority: 'critical',
        category: 'Transport',
        icon: '🚌',
        title: 'Take a Bus for Short Distances',
        why: `For distances under 500km, buses are 75% cleaner and often more convenient than flying (no airport hassle).`,
        action: `Book AC sleeper/seater bus tickets. Save ${(transport * 0.75).toFixed(0)}kg CO₂ + ₹3,000-8,000 per ticket.`,
        savings: (transport * 0.75).toFixed(0),
        savingsPercent: 75,
        difficulty: 'Easy',
        cost: '60-80% cheaper than flights',
        timeImpact: distance < 300 ? 'Similar total time' : 'Add 2-4 hours',
        personalFit: 'Perfect for budget travelers',
        implementationTips: [
          'Book Volvo/Mercedes sleeper coaches for comfort',
          'Travel overnight to save accommodation costs',
          'Use redBus, AbhiBus for best deals'
        ]
      });
    }

    if (type === 'hotel' && nights > 2) {
      const ecoSavings = accommodation * 0.72;
      recs.push({
        priority: 'medium',
        category: 'Accommodation',
        icon: '🌿',
        title: 'Choose Eco-Certified Hotels',
        why: `Standard hotels emit ${(accommodation / nights).toFixed(0)}kg/night. Eco-hotels with LEED/Green Key certification: ${(accommodation * 0.28 / nights).toFixed(0)}kg/night.`,
        action: `Filter for "eco-friendly" or "sustainable" properties on Booking.com, Airbnb. Look for solar power, water recycling, local sourcing.`,
        savings: ecoSavings.toFixed(0),
        savingsPercent: 72,
        difficulty: 'Very Easy',
        cost: budgetFlexibility === 'high' ? 'Comparable pricing' : '10-20% premium (offset by quality)',
        timeImpact: 'None - book like any hotel',
        personalFit: sustainabilityImportance === 'high' ? '⭐⭐⭐ Highly recommended' : 'Easy improvement',
        implementationTips: [
          'Search "LEED certified hotels in [destination]"',
          'Check for EarthCheck, Green Globe certifications',
          'Read reviews mentioning sustainability practices'
        ]
      });
    }

    if (roomSharing === 'alone' && nights > 2 && purpose !== 'business') {
      const sharingSavings = accommodation * 0.45;
      recs.push({
        priority: 'medium',
        category: 'Accommodation',
        icon: '🏠',
        title: 'Share Accommodation',
        why: `Shared facilities use 50% less energy per person. Plus huge cost savings!`,
        action: `Book hostels, shared Airbnbs, or bring a travel companion to split room costs.`,
        savings: sharingSavings.toFixed(0),
        savingsPercent: 45,
        difficulty: 'Easy',
        cost: 'Save 50-70% on accommodation',
        timeImpact: 'None',
        personalFit: purpose === 'leisure' && budgetFlexibility !== 'high' ? '💰 Perfect fit' : 'Consider it',
        implementationTips: [
          'Hostels often have private rooms too',
          'Use Hostelworld, Zostel for quality hostels',
          'Join travel buddy groups on FB/Reddit'
        ]
      });
    }

    if (dietType === 'meat-heavy' || dietType === 'mixed') {
      const mealEmissions = mealsPerDay * nights * (dietType === 'meat-heavy' ? 5.8 : 2.5);
      const veganMealEmissions = mealsPerDay * nights * 0.9;
      const savings = mealEmissions - veganMealEmissions;
      
      recs.push({
        priority: 'medium',
        category: 'Food & Lifestyle',
        icon: '🥗',
        title: dietType === 'meat-heavy' ? 'Reduce Meat Consumption' : 'Try Plant-Based Meals',
        why: `Your ${dietType} diet added ~${mealEmissions.toFixed(0)}kg CO₂ this trip. Plant-based alternatives: ~${veganMealEmissions.toFixed(0)}kg - that's ${savings.toFixed(0)}kg less!`,
        action: `Start small: Choose vegetarian/vegan options for 1-2 meals per day. Try local plant-based cuisine.`,
        savings: savings.toFixed(0),
        savingsPercent: ((savings / mealEmissions) * 100).toFixed(0),
        difficulty: 'Easy',
        cost: 'Usually 20-40% cheaper than meat dishes',
        timeImpact: 'None - available everywhere',
        personalFit: 'Everyone can start small',
        implementationTips: [
          'Try "Meatless Mondays" or similar habits',
          'Explore local vegetarian restaurants',
          'Indian cuisine has amazing veg options',
          'Gradually reduce, not eliminate entirely'
        ]
      });
    }

    if (travelFrequency === 'frequent' && perDay > 35) {
      recs.push({
        priority: 'high',
        category: 'Lifestyle Change',
        icon: '🌍',
        title: 'Consolidate Trips & Use Virtual Alternatives',
        why: `As a frequent traveler (${travelFrequency}), your annual footprint is ${(total * (travelFrequency === 'frequent' ? 10 : 5)).toFixed(0)}kg CO₂. That's ${(total * (travelFrequency === 'frequent' ? 10 : 5) / 1000).toFixed(1)} tonnes/year!`,
        action: `Combine multiple trips into one longer trip. Use Zoom/Teams for meetings when possible. Take 1-2 fewer trips per year.`,
        savings: (total * 2).toFixed(0),
        savingsPercent: travelFrequency === 'frequent' ? 20 : 40,
        difficulty: 'Medium',
        cost: `Save ₹${travelFrequency === 'frequent' ? '50,000-2,00,000' : '30,000-1,00,000'}/year`,
        timeImpact: 'Massive time savings',
        personalFit: purpose === 'business' ? 'Perfect for remote work era' : 'Consider "slow travel"',
        implementationTips: [
          'Batch meetings during fewer trips',
          'Stay longer to reduce travel frequency',
          'Advocate for virtual meetings at work',
          'Plan quarterly trips instead of monthly'
        ]
      });
    }

    recs.push({
      priority: 'low',
      category: 'Carbon Offset',
      icon: '💚',
      title: 'Offset Your Unavoidable Emissions',
      why: `Even after all reductions, you can neutralize remaining emissions through verified carbon credits.`,
      action: `Invest ₹${(parseFloat(emissions.offsetCost) * 83).toFixed(0)} ($${emissions.offsetCost}) in Gold Standard projects (reforestation, renewable energy).`,
      savings: total.toFixed(0),
      savingsPercent: 100,
      difficulty: 'Very Easy',
      cost: `₹${(parseFloat(emissions.offsetCost) * 83).toFixed(0)} (₹${((parseFloat(emissions.offsetCost) * 83) / nights).toFixed(0)}/night)`,
      timeImpact: '5 minutes online',
      personalFit: '✅ Everyone should do this',
      implementationTips: [
        'Use GoldStandard.org for verified credits',
        'Choose India-based projects if possible',
        'Some airlines offer offset at booking',
        'Offset annually for all travel'
      ]
    });

    if (destination.toLowerCase().includes('india')) {
      recs.push({
        priority: 'low',
        category: 'Local Actions',
        icon: '🇮🇳',
        title: 'Support Local & Sustainable Tourism',
        why: `In India, support eco-tourism initiatives, stay with locals, and use public transport.`,
        action: `Use Indian Railways (electrified routes), stay in homestays, eat at local dhabas, carry reusable bottles.`,
        savings: '50-100',
        savingsPercent: 'Varies',
        difficulty: 'Easy',
        cost: 'Often cheaper than touristy options',
        timeImpact: 'Enriches experience',
        personalFit: 'Cultural immersion + sustainability',
        implementationTips: [
          'Book trains on IRCTC (electrified routes are green)',
          'Use Ola/Uber Share, not individual cabs',
          'Avoid plastic - carry your own water bottle',
          'Support local artisans and businesses'
        ]
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sustainabilityImportance === 'high') {
        return parseFloat(b.savingsPercent) - parseFloat(a.savingsPercent);
      }
      return 0;
    });
  };

  const recommendations = getPersonalizedRecommendations();

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
        name: 'Activities & Food', 
        value: parseFloat(emissions.activities), 
        color: 'from-blue-500 to-blue-600',
        icon: '🎯',
        details: `${emissions.totalActivities || 0} activities + ${nights * mealsPerDay} meals (${dietType})`
      }
    ].filter(c => c.value > 0);

    return (
      <div className="card p-6 mb-6">
        <h3 className="text-2xl font-bold mb-6 gradient-text">
          🔍 Your Emission Breakdown
        </h3>
        
        <div className="mb-8">
          <div className="flex h-20 rounded-xl overflow-hidden shadow-2xl">
            {components.map((comp, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${comp.color} flex items-center justify-center text-white font-bold transition-all hover:scale-105 cursor-pointer group relative`}
                style={{ width: `${(comp.value / total) * 100}%` }}
              >
                <span className="text-3xl group-hover:scale-125 transition-transform">
                  {comp.icon}
                </span>
                
                <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 rounded-lg p-4 text-xs whitespace-nowrap z-10 shadow-xl">
                  <div className="font-bold text-base">{comp.name}</div>
                  <div className="text-slate-300">{comp.value.toFixed(1)} kg CO₂e</div>
                  <div className="text-slate-400">{((comp.value / total) * 100).toFixed(1)}%</div>
                  <div className="text-slate-500 text-[10px] mt-1">{comp.details}</div>
                </div>
              </div>
            ))}
          </div>
          
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
                  <span className="text-slate-500">{((comp.value / total) * 100).toFixed(1)}%</span>
                  <span className={`font-bold bg-gradient-to-r ${comp.color} bg-clip-text text-transparent`}>
                    {comp.value.toFixed(2)} kg
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

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
              <div className="text-xs text-slate-400">per night</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{parseFloat(emissions.perKm).toFixed(3)}</div>
              <div className="text-xs text-slate-400">kg/km</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PersonalizedRecommendations = () => (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold gradient-text">
            🎯 Your Personalized Action Plan
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Tailored specifically for your trip from {origin} to {destination}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-emerald-400">
            {recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length}
          </div>
          <div className="text-xs text-slate-400">High-priority actions</div>
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
            critical: { label: '🚨 CRITICAL', color: 'bg-red-500' },
            high: { label: '⚡ HIGH IMPACT', color: 'bg-amber-500' },
            medium: { label: '📊 MEDIUM', color: 'bg-blue-500' },
            low: { label: '✅ OPTIONAL', color: 'bg-emerald-500' }
          };

          return (
            <div
              key={index}
              className={`card p-6 border-l-4 ${priorityColors[rec.priority]} hover:scale-[1.01] transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className="text-5xl flex-shrink-0">{rec.icon}</div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="text-xl font-bold text-slate-100">{rec.title}</h4>
                        <span className={`${priorityBadges[rec.priority].color} text-white text-xs px-3 py-1 rounded-full font-bold`}>
                          {priorityBadges[rec.priority].label}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                          {rec.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2 leading-relaxed">{rec.why}</p>
                      <p className="text-sm text-emerald-400 font-semibold">
                        ✓ {rec.action}
                      </p>
                    </div>
                    
                    {rec.savings && rec.savings !== 'Varies' && (
                      <div className="text-right bg-emerald-500/20 rounded-xl p-4 min-w-[120px] flex-shrink-0">
                        <div className="text-3xl font-bold text-emerald-400">
                          -{rec.savingsPercent}%
                        </div>
                        <div className="text-sm text-emerald-300">
                          {rec.savings} kg saved
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div className="card p-3 bg-slate-800/50">
                      <div className="text-xs text-slate-400 mb-1">Difficulty</div>
                      <div className="text-sm font-semibold text-slate-200">{rec.difficulty}</div>
                    </div>
                    <div className="card p-3 bg-slate-800/50">
                      <div className="text-xs text-slate-400 mb-1">Cost Impact</div>
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
                  
                  {rec.implementationTips && rec.implementationTips.length > 0 && (
                    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                      <div className="text-xs font-semibold text-emerald-400 mb-2">💡 How to Implement:</div>
                      <ul className="text-xs text-slate-300 space-y-1">
                        {rec.implementationTips.map((tip, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-emerald-500 mr-2">▸</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
              <span>•</span>
              <span>✈️ {mode}</span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-6xl font-bold gradient-text mb-2">
              {emissions.total}
            </div>
            <div className="text-slate-400 mb-3">kg CO₂e total</div>
            <div className={`inline-block px-4 py-2 rounded-full font-semibold ${
              parseFloat(emissions.perDay) <= 28.5 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' 
                : parseFloat(emissions.perDay) <= 45
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500'
                : 'bg-red-500/20 text-red-400 border border-red-500'
            }`}>
              {emissions.category}
            </div>
          </div>
        </div>
      </div>

      <EmissionBreakdownVisual />
      <PersonalizedRecommendations />
      
      <div className="card p-6 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-100 mb-1">
              🌟 Your Eco-Score
            </h3>
            <p className="text-sm text-slate-400">
              Based on emissions, choices, and sustainability practices
            </p>
          </div>
          <div className="text-center">
            <div className="text-6xl font-bold text-emerald-400">{ecoScore}</div>
            <div className="text-sm text-slate-400">/100</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedReportPage;

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import carbonCalculator from "../utils/carbonCalculator";

const { calculateEcoScore } = carbonCalculator;

const SimplifiedReportPage = ({ emissions, tripData }) => {
    if (!emissions || !tripData) return null;

    const { origin, destination } = tripData.tripDetails;
    const { distance, mode, cabinClass, vehicleType, passengers } = tripData.transportData;
    const { type, nights, starRating } = tripData.accommodationData;
    const { mealsPerDay, dietType, activities, shoppingIntensity } = tripData.activityData;

    const ecoScore = calculateEcoScore(parseFloat(emissions.total), emissions.days);

    // Pie chart data
    const pieChartData = [
        {
            name: 'Transport',
            value: parseFloat(emissions.transport) || 0,
            percentage: parseFloat(emissions.transportPercentage) || 0,
            color: '#ef4444'
        },
        {
            name: 'Accommodation',
            value: parseFloat(emissions.accommodation) || 0,
            percentage: parseFloat(emissions.accommodationPercentage) || 0,
            color: '#f59e0b'
        },
        {
            name: 'Food & Activities',
            value: parseFloat(emissions.activities) || 0,
            percentage: parseFloat(emissions.activitiesPercentage) || 0,
            color: '#3b82f6'
        }
    ];

    // Category-wise comparison data
    const userDailyEmission = parseFloat(emissions.perDay);
    const userTransportDaily = parseFloat(emissions.transport) / emissions.days;
    const userAccommodationDaily = parseFloat(emissions.accommodation) / emissions.days;
    const userActivitiesDaily = parseFloat(emissions.activities) / emissions.days;

    // Global average breakdown (per person per day in kg CO2e)
    const globalTransportDaily = 6;      // ~20% of 30 kg
    const globalHousingDaily = 9;        // ~30% of 30 kg (housing/accommodation)
    const globalFoodDaily = 6;           // ~20% of 30 kg

    const categoryComparisonData = [
        {
            category: 'Transport',
            'Global Average': globalTransportDaily,
            'Your Trip': userTransportDaily,
        },
        {
            category: 'Accommodation',
            'Global Average': globalHousingDaily,
            'Your Trip': userAccommodationDaily,
        },
        {
            category: 'Food & Activities',
            'Global Average': globalFoodDaily,
            'Your Trip': userActivitiesDaily,
        }
    ];

    // Custom label for pie chart
    const renderLabel = (entry) => {
        return `${entry.percentage.toFixed(0)}%`;
    };

    // Custom tooltip for pie chart
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
                    <p className="text-slate-200 font-semibold">{payload[0].name}</p>
                    <p className="text-emerald-400">{payload[0].value.toFixed(1)} kg CO₂e</p>
                    <p className="text-slate-400 text-xs">{payload[0].payload.percentage.toFixed(0)}%</p>
                </div>
            );
        }
        return null;
    };

    // Custom tooltip for bar chart
    const CustomBarTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-xl">
                    <p className="text-slate-200 font-semibold mb-2">{payload[0].payload.category}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 mb-1">
                            <span className="text-slate-400 text-sm">{entry.name}:</span>
                            <span className={`font-bold ${entry.name === 'Your Trip' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                {entry.value.toFixed(1)} kg/day
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Generate dynamic recommendations based on trip data
    const getRecommendations = () => {
        const recommendations = [];

        // TRANSPORT RECOMMENDATIONS
        const transportEmissions = parseFloat(emissions.transport);

        if (mode === 'flight') {
            if (distance < 500) {
                recommendations.push({
                    icon: '🚆',
                    title: 'Take Train Instead of Flight',
                    description: `For distances under 500 km, trains emit 80-90% less CO₂. You could save approximately ${(transportEmissions * 0.85).toFixed(0)} kg CO₂e by choosing rail travel!`,
                    category: 'transport',
                    priority: 'high',
                    color: 'red'
                });
            } else if (distance < 1500) {
                recommendations.push({
                    icon: '🚄',
                    title: 'Consider High-Speed Rail',
                    description: `High-speed trains could reduce your emissions by 75%. Potential savings: ${(transportEmissions * 0.75).toFixed(0)} kg CO₂e.`,
                    category: 'transport',
                    priority: 'medium',
                    color: 'red'
                });
            }

            if (cabinClass === 'business' || cabinClass === 'first') {
                const savingsPotential = cabinClass === 'first' ? 0.75 : 0.50;
                recommendations.push({
                    icon: '💺',
                    title: 'Fly Economy Class',
                    description: `${cabinClass === 'first' ? 'First' : 'Business'} class seats take up more space, increasing emissions per passenger. Flying economy could save ${(transportEmissions * savingsPotential).toFixed(0)} kg CO₂e.`,
                    category: 'transport',
                    priority: 'high',
                    color: 'red'
                });
            }

            recommendations.push({
                icon: '✈️',
                title: 'Choose Direct Flights',
                description: 'Takeoffs and landings produce the most emissions. Direct flights can reduce CO₂ by 20-30% compared to connecting flights.',
                category: 'transport',
                priority: 'medium',
                color: 'red'
            });
        }

        if (mode === 'car') {
            if (vehicleType === 'petrol' || vehicleType === 'diesel') {
                recommendations.push({
                    icon: '⚡',
                    title: 'Consider Electric or Hybrid Vehicles',
                    description: `Switching to electric/hybrid could reduce emissions by 60-80%. Potential savings: ${(transportEmissions * 0.7).toFixed(0)} kg CO₂e.`,
                    category: 'transport',
                    priority: 'high',
                    color: 'red'
                });
            }

            if (passengers === 1) {
                recommendations.push({
                    icon: '👥',
                    title: 'Carpool with Others',
                    description: 'Sharing rides splits emissions per person. With 3 passengers, you could reduce your personal footprint by 67%!',
                    category: 'transport',
                    priority: 'medium',
                    color: 'red'
                });
            }

            if (distance < 100) {
                recommendations.push({
                    icon: '🚌',
                    title: 'Use Public Transport',
                    description: 'Buses emit 50-70% less CO₂ per passenger than private cars for short distances.',
                    category: 'transport',
                    priority: 'medium',
                    color: 'red'
                });
            }
        }

        if (mode === 'bus' || mode === 'train') {
            recommendations.push({
                icon: '🌟',
                title: 'Great Choice!',
                description: 'You\'re already using one of the most eco-friendly transport options. Keep it up!',
                category: 'transport',
                priority: 'positive',
                color: 'emerald'
            });
        }

        // ACCOMMODATION RECOMMENDATIONS
        const accommodationEmissions = parseFloat(emissions.accommodation);

        if (type === 'hotel') {
            if (starRating >= 4) {
                recommendations.push({
                    icon: '🌿',
                    title: 'Choose Eco-Certified Hotels',
                    description: `Luxury hotels use more energy. Eco-certified 3-star hotels could save ${(accommodationEmissions * 0.4).toFixed(0)} kg CO₂e through renewable energy and efficient systems.`,
                    category: 'accommodation',
                    priority: 'high',
                    color: 'amber'
                });
            } else {
                recommendations.push({
                    icon: '🏨',
                    title: 'Look for Green Certifications',
                    description: 'Choose hotels with LEED, Green Key, or EarthCheck certifications for 30-50% lower emissions.',
                    category: 'accommodation',
                    priority: 'medium',
                    color: 'amber'
                });
            }

            recommendations.push({
                icon: '💧',
                title: 'Reuse Towels & Linens',
                description: 'Skipping daily laundry service can reduce hotel energy use by up to 17%. Request towel reuse during your stay.',
                category: 'accommodation',
                priority: 'low',
                color: 'amber'
            });

            recommendations.push({
                icon: '❄️',
                title: 'Moderate AC/Heating Use',
                description: 'Set AC to 24°C (75°F) and turn off when leaving. This alone can cut room emissions by 20-30%.',
                category: 'accommodation',
                priority: 'medium',
                color: 'amber'
            });
        }

        if (type === 'Homestay') {
            recommendations.push({
                icon: '🏡',
                title: 'Choose Hosts with Eco Practices',
                description: 'Look for Homestay hosts who use renewable energy, provide recycling, and have energy-efficient appliances.',
                category: 'accommodation',
                priority: 'medium',
                color: 'amber'
            });
        }

        if (type === 'ecoresort') {
            recommendations.push({
                icon: '🌟',
                title: 'Excellent Choice!',
                description: 'Eco-resorts typically use 60-80% less energy than conventional hotels. You\'re making a real difference!',
                category: 'accommodation',
                priority: 'positive',
                color: 'emerald'
            });
        }

        // FOOD & LIFESTYLE RECOMMENDATIONS
        if (dietType === 'meat-heavy') {
            recommendations.push({
                icon: '🥗',
                title: 'Try Plant-Based Meals',
                description: `Even 2-3 vegetarian days could save ${(nights * mealsPerDay * 2.5).toFixed(0)} kg CO₂e. Beef produces 10x more emissions than plant proteins.`,
                category: 'food',
                priority: 'high',
                color: 'blue'
            });
        } else if (dietType === 'mixed' || dietType === 'pescatarian') {
            recommendations.push({
                icon: '🌱',
                title: 'Increase Plant-Based Options',
                description: 'Plant-based meals emit 62% less CO₂. Try one extra veggie meal per day to make a significant impact.',
                category: 'food',
                priority: 'medium',
                color: 'blue'
            });
        } else if (dietType === 'vegetarian' || dietType === 'vegan') {
            recommendations.push({
                icon: '🌟',
                title: 'Amazing Dietary Choice!',
                description: 'Your plant-based diet is already saving tons of CO₂. Keep making this positive impact!',
                category: 'food',
                priority: 'positive',
                color: 'emerald'
            });
        }

        recommendations.push({
            icon: '🍴',
            title: 'Choose Local & Seasonal Foods',
            description: 'Local produce travels less distance, reducing food transportation emissions by up to 70%.',
            category: 'food',
            priority: 'medium',
            color: 'blue'
        });

        recommendations.push({
            icon: '🚰',
            title: 'Use Refillable Water Bottles',
            description: 'Skip single-use plastic bottles. Bring a reusable bottle and refill with filtered or tap water.',
            category: 'lifestyle',
            priority: 'medium',
            color: 'purple'
        });

        // ACTIVITIES RECOMMENDATIONS
        if (activities && activities.length > 0) {
            if (activities.includes('water-sports') || activities.includes('skiing')) {
                recommendations.push({
                    icon: '🏊',
                    title: 'Choose Low-Impact Activities',
                    description: 'Opt for kayaking over jet skiing, or hiking over helicopter tours. Human-powered activities have near-zero emissions.',
                    category: 'activities',
                    priority: 'medium',
                    color: 'indigo'
                });
            }

            if (activities.includes('sightseeing')) {
                recommendations.push({
                    icon: '🚴',
                    title: 'Bike or Walk for Sightseeing',
                    description: 'Rent bikes or join walking tours instead of bus tours. Great for the environment and your health!',
                    category: 'activities',
                    priority: 'medium',
                    color: 'indigo'
                });
            }
        }

        if (shoppingIntensity === 'heavy') {
            recommendations.push({
                icon: '🛍️',
                title: 'Buy Local & Sustainable',
                description: 'Choose locally-made products over imports, and bring reusable shopping bags. Avoid fast fashion and single-use items.',
                category: 'shopping',
                priority: 'medium',
                color: 'pink'
            });
        }

        // GENERAL BEST PRACTICES
        recommendations.push({
            icon: '♻️',
            title: 'Reduce, Reuse, Recycle',
            description: 'Separate your waste, avoid single-use plastics, and carry reusable utensils and bags throughout your trip.',
            category: 'lifestyle',
            priority: 'low',
            color: 'teal'
        });

        recommendations.push({
            icon: '📱',
            title: 'Go Digital',
            description: 'Use digital tickets, mobile boarding passes, and e-receipts instead of printing to save paper and reduce waste.',
            category: 'lifestyle',
            priority: 'low',
            color: 'cyan'
        });

        // CARBON OFFSET (Always show)
        recommendations.push({
            icon: '💚',
            title: 'Offset Your Remaining Emissions',
            description: `Invest ₹${emissions.offsetCostINR} (${emissions.offsetCostUSD}) in verified carbon offset programs like tree planting, renewable energy projects, or reforestation to neutralize your ${emissions.total} kg CO₂e impact.`,
            category: 'offset',
            priority: 'high',
            color: 'emerald'
        });

        return recommendations;
    };

    const recommendations = getRecommendations();

    // Group recommendations by priority
    const highPriority = recommendations.filter(r => r.priority === 'high');
    const mediumPriority = recommendations.filter(r => r.priority === 'medium');
    const lowPriority = recommendations.filter(r => r.priority === 'low');
    const positive = recommendations.filter(r => r.priority === 'positive');

    const colorMap = {
        red: { bg: 'bg-red-500/5', border: 'border-red-500' },
        amber: { bg: 'bg-amber-500/5', border: 'border-amber-500' },
        blue: { bg: 'bg-blue-500/5', border: 'border-blue-500' },
        emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500' },
        purple: { bg: 'bg-purple-500/5', border: 'border-purple-500' },
        indigo: { bg: 'bg-indigo-500/5', border: 'border-indigo-500' },
        pink: { bg: 'bg-pink-500/5', border: 'border-pink-500' },
        teal: { bg: 'bg-teal-500/5', border: 'border-teal-500' },
        cyan: { bg: 'bg-cyan-500/5', border: 'border-cyan-500' }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {/* Header Card */}
            <div className="card p-8 bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="text-center">
                    <h1 className="text-4xl font-bold gradient-text mb-4">
                        {origin} → {destination}
                    </h1>
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-300 mb-6">
                        <span>📍 {distance} km</span>
                        <span>•</span>
                        <span>🗓️ {nights} nights</span>
                        <span>•</span>
                        <span>✈️ {mode}</span>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl p-8 inline-block">
                        <div className="text-7xl font-bold gradient-text mb-2">
                            {emissions.total}
                        </div>
                        <div className="text-2xl text-slate-400 mb-4">kg CO₂e</div>
                        <div className={`inline-block px-6 py-3 rounded-full font-bold text-lg ${parseFloat(emissions.perDay) <= 30
                                ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500'
                                : parseFloat(emissions.perDay) <= 50
                                    ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500'
                                    : 'bg-red-500/20 text-red-400 border-2 border-red-500'
                            }`}>
                            {emissions.category}
                        </div>
                    </div>
                </div>
            </div>

            {/* Emission Breakdown - PIE CHART */}
            <div className="card p-8">
                <h2 className="text-3xl font-bold gradient-text mb-6 text-center">
                    🔍 Emission Breakdown
                </h2>

                {/* PIE CHART */}
                <div className="w-full mb-8" style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderLabel}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '20px' }}
                                formatter={(value) => (
                                    <span style={{ color: '#cbd5e1', fontSize: '14px' }}>
                                        {value}
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Detailed Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Transport Card */}
                    <div className="card p-6 border-l-4 border-red-500">
                        <div className="text-4xl mb-3">🚗</div>
                        <h3 className="text-xl font-bold text-slate-100 mb-2">Transport</h3>
                        <div className="text-4xl font-bold text-red-500 mb-2">{emissions.transport}</div>
                        <div className="text-sm text-slate-400 mb-4">kg CO₂e</div>
                        <div className="text-xs text-slate-500 leading-relaxed">
                            <div className="mb-2 font-semibold text-slate-400">Formula:</div>
                            <div>{emissions.transportFormula}</div>
                        </div>
                    </div>

                    {/* Accommodation Card */}
                    <div className="card p-6 border-l-4 border-amber-500">
                        <div className="text-4xl mb-3">🏨</div>
                        <h3 className="text-xl font-bold text-slate-100 mb-2">Accommodation</h3>
                        <div className="text-4xl font-bold text-amber-500 mb-2">{emissions.accommodation}</div>
                        <div className="text-sm text-slate-400 mb-4">kg CO₂e</div>
                        <div className="text-xs text-slate-500 leading-relaxed">
                            <div className="mb-2 font-semibold text-slate-400">Formula:</div>
                            <div>{emissions.accommodationFormula}</div>
                        </div>
                    </div>

                    {/* Activities Card */}
                    <div className="card p-6 border-l-4 border-blue-500">
                        <div className="text-4xl mb-3">🍽️</div>
                        <h3 className="text-xl font-bold text-slate-100 mb-2">Food & Activities</h3>
                        <div className="text-4xl font-bold text-blue-500 mb-2">{emissions.activities}</div>
                        <div className="text-sm text-slate-400 mb-4">kg CO₂e</div>
                        <div className="text-xs text-slate-500 leading-relaxed">
                            <div className="mb-2 font-semibold text-slate-400">Formula:</div>
                            <div>{emissions.activitiesFormula}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="flex justify-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
                    <div className="card p-5 text-center">
                        <div className="text-3xl font-bold text-emerald-400">{emissions.perDay}</div>
                        <div className="text-sm text-slate-400 mt-1">kg CO₂e per day</div>
                    </div>
                    <div className="card p-5 text-center">
                        <div className="text-3xl font-bold text-purple-400">{ecoScore}</div>
                        <div className="text-sm text-slate-400 mt-1">Eco Score (out of 100)</div>
                    </div>
                    <div className="card p-5 text-center hover:scale-105 transition-transform cursor-pointer group">
                        <div className="text-3xl font-bold text-amber-400">₹{emissions.offsetCostINR}</div>
                        <div className="text-sm text-slate-400 mt-1">Carbon Offset Cost</div>
                        <div className="text-xs text-slate-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            ≈ {emissions.offsetCostUSD}
                        </div>
                    </div>
                </div>
            </div>


            {/* CATEGORY-WISE BAR CHART - Global Average vs Your Trip */}
            <div className="card p-8">
                <h2 className="text-3xl font-bold gradient-text mb-6 text-center">
                    📊 Category-wise Comparison
                </h2>
                <p className="text-center text-slate-400 mb-6">
                    Daily emissions per category: Your trip vs Global average
                </p>

                <div className="w-full" style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={categoryComparisonData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis
                                dataKey="category"
                                stroke="#cbd5e1"
                                style={{ fontSize: '14px', fontWeight: '600' }}
                            />
                            <YAxis
                                stroke="#cbd5e1"
                                label={{
                                    value: 'kg CO₂e per day',
                                    angle: -90,
                                    position: 'insideLeft',
                                    style: { fill: '#cbd5e1', fontSize: '14px' }
                                }}
                                domain={[0, 'auto']}
                                allowDataOverflow={false}
                            />
                            <Tooltip content={<CustomBarTooltip />} />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="square"
                                formatter={(value) => (
                                    <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>
                                        {value}
                                    </span>
                                )}
                            />
                            <Bar dataKey="Global Average" fill="#64748b" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="Your Trip" fill="#10b981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Comparison Summary Cards */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Transport Comparison */}
                    <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-300 font-semibold">🚗 Transport</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${userTransportDaily > globalTransportDaily
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                {userTransportDaily > globalTransportDaily ? '↑' : '↓'}
                                {Math.abs(((userTransportDaily / globalTransportDaily - 1) * 100)).toFixed(0)}%
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <div>
                                <div className="text-slate-500">Global</div>
                                <div className="text-slate-300 font-bold">{globalTransportDaily} kg/day</div>
                            </div>
                            <div className="text-right">
                                <div className="text-slate-500">Your Trip</div>
                                <div className="text-emerald-400 font-bold">{userTransportDaily.toFixed(1)} kg/day</div>
                            </div>
                        </div>
                    </div>

                    {/* Accommodation Comparison */}
                    <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-300 font-semibold">🏨 Accommodation</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${userAccommodationDaily > globalHousingDaily
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                {userAccommodationDaily > globalHousingDaily ? '↑' : '↓'}
                                {Math.abs(((userAccommodationDaily / globalHousingDaily - 1) * 100)).toFixed(0)}%
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <div>
                                <div className="text-slate-500">Global</div>
                                <div className="text-slate-300 font-bold">{globalHousingDaily} kg/day</div>
                            </div>
                            <div className="text-right">
                                <div className="text-slate-500">Your Trip</div>
                                <div className="text-emerald-400 font-bold">{userAccommodationDaily.toFixed(1)} kg/day</div>
                            </div>
                        </div>
                    </div>

                    {/* Food & Activities Comparison */}
                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-300 font-semibold">🍽️ Food & Activities</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${userActivitiesDaily > globalFoodDaily
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                {userActivitiesDaily > globalFoodDaily ? '↑' : '↓'}
                                {Math.abs(((userActivitiesDaily / globalFoodDaily - 1) * 100)).toFixed(0)}%
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <div>
                                <div className="text-slate-500">Global</div>
                                <div className="text-slate-300 font-bold">{globalFoodDaily} kg/day</div>
                            </div>
                            <div className="text-right">
                                <div className="text-slate-500">Your Trip</div>
                                <div className="text-emerald-400 font-bold">{userActivitiesDaily.toFixed(1)} kg/day</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-blue-500/5 border border-blue-500/30">
                    <p className="text-sm text-slate-300 text-center">
                        <span className="font-semibold text-blue-400">💡 Note:</span> Global averages represent typical daily emissions across all activities. Travel often concentrates emissions into shorter periods.
                    </p>
                </div>
            </div>

            {/* What You're Doing Right */}
            {positive.length > 0 && (
                <div className="card p-8 bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-2 border-emerald-500/30">
                    <h2 className="text-3xl font-bold text-emerald-400 mb-6 text-center">
                        ⭐ What You're Doing Right!
                    </h2>

                    <div className="space-y-4">
                        {positive.map((rec, index) => (
                            <div key={index} className="card p-5 bg-emerald-500/10 border-l-4 border-emerald-500">
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl">{rec.icon}</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-emerald-100 mb-2">{rec.title}</h4>
                                        <p className="text-sm text-emerald-200">{rec.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            <div className="card p-8">
                <h2 className="text-3xl font-bold gradient-text mb-6 text-center">
                    💡 How to Reduce Your Impact
                </h2>

                {/* High Priority */}
                {highPriority.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                            <span>🔴</span> High Impact Actions
                        </h3>
                        <div className="space-y-4">
                            {highPriority.map((rec, index) => (
                                <div key={index} className={`card p-5 ${colorMap[rec.color].bg} border-l-4 ${colorMap[rec.color].border}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="text-4xl flex-shrink-0">{rec.icon}</div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-100 mb-2">{rec.title}</h4>
                                            <p className="text-sm text-slate-300">{rec.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Medium Priority */}
                {mediumPriority.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                            <span>🟡</span> Moderate Impact Actions
                        </h3>
                        <div className="space-y-4">
                            {mediumPriority.map((rec, index) => (
                                <div key={index} className={`card p-5 ${colorMap[rec.color].bg} border-l-4 ${colorMap[rec.color].border}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="text-4xl flex-shrink-0">{rec.icon}</div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-100 mb-2">{rec.title}</h4>
                                            <p className="text-sm text-slate-300">{rec.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Low Priority */}
                {lowPriority.length > 0 && (
                    <div>
                        <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                            <span>🔵</span> Easy Wins
                        </h3>
                        <div className="space-y-4">
                            {lowPriority.map((rec, index) => (
                                <div key={index} className={`card p-5 ${colorMap[rec.color].bg} border-l-4 ${colorMap[rec.color].border}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="text-4xl flex-shrink-0">{rec.icon}</div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-100 mb-2">{rec.title}</h4>
                                            <p className="text-sm text-slate-300">{rec.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pb-8">
                <button
                    onClick={() => window.location.href = '/'}
                    className="btn-secondary px-8 py-4 text-lg"
                >
                    ← Calculate Another Trip
                </button>

                <button
                    onClick={() => window.print()}
                    className="btn-primary px-8 py-4 text-lg"
                >
                    🖨️ Print Report
                </button>
            </div>
        </div>
    );
};

export default SimplifiedReportPage;

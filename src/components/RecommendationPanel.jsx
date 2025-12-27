import React from 'react';
import { lowCarbonTips } from '../data/emissionFactors';

const RecommendationPanel = ({ emissions }) => {
  if (!emissions) return null;
  
  const getSavingsRecommendations = () => {
    const recommendations = [];
    
    if (emissions.transport > 100) {
      recommendations.push({
        title: 'Switch to Train Travel',
        saving: (emissions.transport * 0.75).toFixed(1),
        description: 'Taking a train instead of flying can reduce transport emissions by up to 75%'
      });
    }
    
    if (emissions.accommodation > 50) {
      recommendations.push({
        title: 'Choose Eco-friendly Lodging',
        saving: (emissions.accommodation * 0.65).toFixed(1),
        description: 'Stay at eco-lodges or guesthouses to cut accommodation emissions by 65%'
      });
    }
    
    recommendations.push({
      title: 'Use Public Transport',
      saving: (emissions.total * 0.15).toFixed(1),
      description: 'Use buses or metros at your destination instead of taxis'
    });
    
    return recommendations;
  };
  
  const recommendations = getSavingsRecommendations();

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-3xl font-bold text-secondary mb-6 text-center">
        🌱 Low-Carbon Recommendations
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {recommendations.map((rec, index) => (
          <div 
            key={index} 
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-l-4 border-primary hover:shadow-lg transition-shadow duration-300"
          >
            <h3 className="text-lg font-bold text-primary mb-3">{rec.title}</h3>
            <div className="inline-block bg-primary text-white px-4 py-1 rounded-full text-sm font-bold mb-3">
              Save {rec.saving} kg CO₂
            </div>
            <p className="text-gray-700 leading-relaxed">{rec.description}</p>
          </div>
        ))}
      </div>
      
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-l-4 border-accent">
        <h3 className="text-xl font-bold text-accent mb-4 flex items-center">
          <span className="mr-2">💡</span> Quick Tips for Sustainable Travel
        </h3>
        <ul className="space-y-3">
          {lowCarbonTips.map((tip, index) => (
            <li key={index} className="flex items-start">
              <span className="text-primary font-bold mr-3 text-xl">✓</span>
              <span className="text-gray-700 pt-1">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RecommendationPanel;

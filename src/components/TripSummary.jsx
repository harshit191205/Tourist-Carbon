import React from 'react';
import { emissionFactors } from '../data/emissionFactors';

const TripSummary = ({ tripData }) => {
  const { transportData, accommodationData, activityData } = tripData;

  const getTransportLabel = (mode) => {
    const labels = {
      airplane_economy: 'Airplane (Economy)',
      airplane_business: 'Airplane (Business)',
      car: 'Car',
      train: 'Train',
      bus: 'Bus',
      ferry: 'Ferry'
    };
    return labels[mode] || mode;
  };

  const getAccommodationLabel = (type) => {
    const labels = {
      resort: 'Resort/Large Hotel',
      hotel: 'Mid-size Hotel',
      guesthouse: 'Guesthouse/Homestay',
      ecolodge: 'Eco-lodge'
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-3xl font-bold text-secondary mb-6">Trip Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Transport Details */}
        <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-500">
          <h3 className="text-xl font-bold text-red-600 mb-3 flex items-center">
            <span className="mr-2">🚗</span> Transportation
          </h3>
          <div className="space-y-2 text-gray-700">
            <p><strong>Mode:</strong> {getTransportLabel(transportData.mode)}</p>
            <p><strong>Distance:</strong> {transportData.distance} km</p>
            <p><strong>Passengers:</strong> {transportData.passengers}</p>
          </div>
        </div>

        {/* Accommodation Details */}
        <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-500">
          <h3 className="text-xl font-bold text-yellow-600 mb-3 flex items-center">
            <span className="mr-2">🏨</span> Accommodation
          </h3>
          <div className="space-y-2 text-gray-700">
            <p><strong>Type:</strong> {getAccommodationLabel(accommodationData.type)}</p>
            <p><strong>Nights:</strong> {accommodationData.nights}</p>
          </div>
        </div>

        {/* Activities Details */}
        <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
          <h3 className="text-xl font-bold text-blue-600 mb-3 flex items-center">
            <span className="mr-2">🎯</span> Activities
          </h3>
          <div className="space-y-2 text-gray-700">
            {activityData.map((activity, index) => (
              activity.count > 0 && (
                <p key={index}>
                  <strong>{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}:</strong> {activity.count}
                </p>
              )
            ))}
            {activityData.every(a => a.count === 0) && (
              <p className="text-gray-500 italic">No activities selected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripSummary;

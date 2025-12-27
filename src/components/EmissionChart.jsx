import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const COLORS = ['#e74c3c', '#f39c12', '#3498db'];

const EmissionChart = ({ emissions }) => {
  if (!emissions) return null;
  
  const pieData = [
    { name: 'Transport', value: parseFloat(emissions.transport) },
    { name: 'Accommodation', value: parseFloat(emissions.accommodation) },
    { name: 'Activities', value: parseFloat(emissions.activities) }
  ];
  
  const barData = pieData.map(item => ({
    name: item.name,
    emissions: item.value
  }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-3xl font-bold text-secondary mb-6 text-center">
        Your Carbon Footprint Breakdown
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            Emission Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value} kg`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Bar Chart */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            Emission Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'kg CO₂', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="emissions" fill="#27ae60" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EmissionChart;

import React, { useState } from 'react';

const UserFeedback = ({ ecoMode }) => {
  const [feedback, setFeedback] = useState({
    useful: '',
    improvements: '',
    rating: 5
  });
  
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Feedback submitted:', feedback);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className={`glass-card p-8 hover-lift animate-slideUp delay-700 ${
      ecoMode ? 'glow-green' : 'glow-blue'
    }`}>
      <h2 className="text-2xl font-bold text-text-primary mb-3 flex items-center text-glow-white">
        <span className="mr-3 floating">💬</span>
        Your Feedback Matters
      </h2>
      <p className="text-text-secondary mb-6">
        Help us improve this dashboard for sustainable tourism
      </p>
      
      {submitted ? (
        <div className={`glass-card p-12 text-center animate-scaleIn ${
          ecoMode ? 'glow-green' : 'glow-blue'
        }`}>
          <div className="text-8xl mb-6 floating">✅</div>
          <h3 className={`text-3xl font-bold mb-3 ${
            ecoMode ? 'text-eco-primary text-glow-green' : 'text-accent-blue'
          }`}>
            Thank You!
          </h3>
          <p className="text-text-secondary">Your feedback has been submitted successfully.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Stars - Apple Style */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-3">
              Rate Your Experience
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedback({...feedback, rating: star})}
                  className={`text-5xl transition-all duration-300 button-press ${
                    star <= feedback.rating 
                      ? 'text-accent-yellow scale-125' 
                      : 'text-text-muted hover:text-accent-yellow/50 hover:scale-110'
                  }`}
                  style={{
                    filter: star <= feedback.rating ? 'drop-shadow(0 0 10px #FACC15)' : 'none'
                  }}
                >
                  ⭐
                </button>
              ))}
              <span className="ml-4 text-text-secondary font-semibold text-lg">
                {feedback.rating}/5
              </span>
            </div>
          </div>
          
          {/* What was useful */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              What was most useful?
            </label>
            <textarea
              value={feedback.useful}
              onChange={(e) => setFeedback({...feedback, useful: e.target.value})}
              className="w-full px-4 py-3 glass-card text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-eco-primary/50 transition-all duration-400"
              rows="3"
              placeholder="Tell us what you found helpful..."
            />
          </div>
          
          {/* Improvements */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              What can we improve?
            </label>
            <textarea
              value={feedback.improvements}
              onChange={(e) => setFeedback({...feedback, improvements: e.target.value})}
              className="w-full px-4 py-3 glass-card text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-eco-primary/50 transition-all duration-400"
              rows="3"
              placeholder="Suggest improvements..."
            />
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-4 glass-card font-bold text-lg hover-lift button-press ${
              ecoMode ? 'text-eco-primary glow-green' : 'text-accent-blue glow-blue'
            }`}
          >
            <span className="flex items-center justify-center">
              <span className="mr-2">✨</span>
              Submit Feedback
            </span>
          </button>
        </form>
      )}
    </div>
  );
};

export default UserFeedback;


import { AstranovSignal, UserSignalPreferences, MandatoryLevel, SignalExplanation } from '../../types/signals';

export class SignalPriorityEngine {
  private static MANDATORY_WEIGHTS: Record<MandatoryLevel, number> = {
    critical_alert: 20.0,
    major_global_news: 12.0,
    regional_important: 8.0,
    standard_mandatory: 5.0,
    none: 0.0
  };

  static calculateScore(
    signal: AstranovSignal,
    preferences: UserSignalPreferences | null,
    userLat?: number,
    userLng?: number
  ): { score: number; explanation: SignalExplanation } {
    const weights = {
      preference: 6.0,
      proximity: 4.0,
      freshness: 3.0,
      trust: 2.0,
      popularity: 1.5
    };

    let score = 0;
    const explanation: SignalExplanation = {
      matchedPreferences: [],
      scoreBreakdown: {}
    };

    // 1. Tiered Mandatory Score
    const mLevel = signal.metadata?.mandatoryLevel || (signal.metadata?.isMandatory ? 'standard_mandatory' : 'none');
    const mScore = this.MANDATORY_WEIGHTS[mLevel] || 0;
    if (mScore > 0) {
      score += mScore;
      explanation.mandatoryReason = `Mandatory level: ${mLevel.replace(/_/g, ' ')}`;
      explanation.scoreBreakdown!.mandatory = mScore;
    }

    // 2. Expanded Preference & Blocking Logic
    if (preferences) {
      let prefScore = 0;
      
      // Category matching
      if (preferences.preferredCategories.includes(signal.type)) {
        prefScore += weights.preference;
        explanation.matchedPreferences!.push(`Preferred category: ${signal.type}`);
      }
      if (preferences.blockedCategories?.includes(signal.type)) {
        prefScore -= weights.preference * 5;
      }

      // Source matching
      if (preferences.preferredSources?.includes(signal.source)) {
        prefScore += weights.preference * 0.8;
        explanation.matchedPreferences!.push(`Trusted source: ${signal.source}`);
      }
      if (preferences.blockedSources?.includes(signal.source)) {
        prefScore -= weights.preference * 5;
      }

      // Author/Creator matching
      if (signal.authorId && preferences.followedCreators.includes(signal.authorId)) {
        prefScore += weights.preference * 1.2;
        explanation.matchedPreferences!.push(`Followed creator: ${signal.authorName || signal.authorId}`);
      }
      if (signal.authorId && preferences.blockedCreators?.includes(signal.authorId)) {
        prefScore -= weights.preference * 5;
      }

      // Topic/Tag/Label matching
      const signalTokens = new Set([
        ...(signal.tags || []),
        ...(signal.topicLabels || []),
        ...signal.title.toLowerCase().split(/\s+/),
        ...signal.description.toLowerCase().split(/\s+/)
      ]);

      preferences.followedTopics.forEach(topic => {
        if (signalTokens.has(topic.toLowerCase())) {
          prefScore += weights.preference * 0.5;
          explanation.matchedPreferences!.push(`Matches topic: ${topic}`);
        }
      });

      preferences.blockedTopics.forEach(topic => {
        if (signalTokens.has(topic.toLowerCase())) {
          if (signal.metadata?.mandatoryLevel === 'critical_alert' || signal.metadata?.mandatoryLevel === 'major_global_news') {
            prefScore -= weights.preference * 5; // Penalty but might survive
          } else {
            prefScore -= weights.preference * 50; // Effectively filter out
            explanation.selectionNote = `Hidden because it matched blocked topic: ${topic}`;
          }
        }
      });

      score += prefScore;
      explanation.scoreBreakdown!.preferences = prefScore;
    }

    // 3. Proximity Score
    if (userLat !== undefined && userLng !== undefined) {
      const distance = this.calculateDistance(userLat, userLng, signal.lat, signal.lng);
      const proximityFactor = Math.max(0, 1 - distance / 5000); 
      const proximityScore = proximityFactor * weights.proximity;
      score += proximityScore;
      explanation.scoreBreakdown!.proximity = proximityScore;
      if (proximityFactor > 0.8) explanation.proximityReason = "Very close to your location";
      else if (proximityFactor > 0.5) explanation.proximityReason = "In your general region";
    }

    // 4. Freshness Score
    const ageInHours = (Date.now() - signal.createdAt) / (1000 * 60 * 60);
    const freshnessFactor = Math.max(0, 1 - ageInHours / 72); // 72h window
    const freshnessScore = freshnessFactor * weights.freshness;
    score += freshnessScore;
    explanation.scoreBreakdown!.freshness = freshnessScore;
    if (freshnessFactor > 0.9) explanation.freshnessReason = "Just released";
    else if (freshnessFactor > 0.7) explanation.freshnessReason = "Recent update";

    // 5. Trust & Popularity
    const trustScore = (signal.metadata?.trustworthiness || 0.5) * weights.trust;
    const popScore = (signal.metadata?.popularity || 0.5) * weights.popularity;
    score += trustScore + popScore;
    explanation.scoreBreakdown!.trust = trustScore;
    explanation.scoreBreakdown!.popularity = popScore;

    return { score, explanation };
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}


import crypto from 'crypto';
import { AstranovSignal } from '../../types/signals';

export class SignalDeduplicationService {
  /**
   * Generates a unique hash for a signal to identify duplicates.
   */
  static generateDuplicateHash(signal: Partial<AstranovSignal>): string {
    // If we have a strong unique identifier like sourceId or canonicalUrl, use that primarily
    if (signal.sourceId && signal.source !== 'unknown') {
      return `sid-${signal.source}-${signal.sourceId}`;
    }
    if (signal.canonicalUrl) {
      return `url-${signal.canonicalUrl}`;
    }

    const components = [
      signal.clusterId || '', // Semantic/News cluster grouping
      this.normalizeTitle(signal.title || ''),
      this.getSpatialBucket(signal.lat || 0, signal.lng || 0),
      this.getTimeBucket(signal.createdAt || Date.now()),
    ];
    
    return crypto.createHash('md5').update(components.filter(Boolean).join('|')).digest('hex');
  }

  private static normalizeTitle(title: string): string {
    // Remove common stop words and noise for better semantic matching
    return title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .sort()
      .join('')
      .substring(0, 100);
  }

  private static getSpatialBucket(lat: number, lng: number): string {
    // 0.05 degrees is roughly 5km - better for clustering regional news
    const latBucket = Math.round(lat * 20) / 20;
    const lngBucket = Math.round(lng * 20) / 20;
    return `${latBucket},${lngBucket}`;
  }

  private static getTimeBucket(timestamp: number): string {
    // 6-hour buckets to group same-day events
    const sixHours = 6 * 60 * 60 * 1000;
    return Math.floor(timestamp / sixHours).toString();
  }

  /**
   * Filters out duplicate signals from a list.
   */
  static deduplicate(signals: AstranovSignal[]): AstranovSignal[] {
    const seen = new Set<string>();
    const result: AstranovSignal[] = [];

    // Sort by priority so we keep the best version of a duplicate
    const sorted = [...signals].sort((a, b) => b.priorityScore - a.priorityScore);

    for (const signal of sorted) {
      if (!seen.has(signal.duplicateHash)) {
        seen.add(signal.duplicateHash);
        result.push(signal);
      } else {
        // Optionally log that we deduplicated this signal
        if (signal.explanation) {
          signal.explanation.selectionNote = "Deduplicated: A higher-priority version of this signal is already shown.";
        }
      }
    }

    return result;
  }
}

import ngeohash from 'ngeohash';

export class GeoIndexService {
  /**
   * Generates a geohash for a given latitude and longitude.
   * @param lat Latitude
   * @param lng Longitude
   * @param precision Precision of the geohash (default 9)
   * @returns Geohash string
   */
  static generateGeohash(lat: number, lng: number, precision: number = 9): string {
    return ngeohash.encode(lat, lng, precision);
  }

  /**
   * Assigns a region key based on the geohash (e.g., first 3 characters).
   * @param geohash Geohash string
   * @returns Region key
   */
  static getRegionKey(geohash: string): string {
    return geohash.substring(0, 3); // Approx 150km x 150km
  }

  /**
   * Assigns a city key based on the geohash (e.g., first 5 characters).
   * @param geohash Geohash string
   * @returns City key
   */
  static getCityKey(geohash: string): string {
    return geohash.substring(0, 5); // Approx 5km x 5km
  }

  /**
   * Returns the geohash range for a given center and radius.
   * Useful for Firestore queries.
   * @param lat Center latitude
   * @param lng Center longitude
   * @param radiusInKm Radius in kilometers
   * @returns Array of geohash ranges [start, end]
   */
  static getGeohashRanges(lat: number, lng: number, radiusInKm: number): [string, string][] {
    // Simple implementation: get neighbors at a certain precision
    // For a real implementation, we'd calculate the precision based on radius
    const precision = this.getPrecisionForRadius(radiusInKm);
    const hash = ngeohash.encode(lat, lng, precision);
    const neighbors = ngeohash.neighbors(hash);
    
    const allHashes = [hash, ...neighbors].sort();
    const ranges: [string, string][] = allHashes.map(h => [h, h + '\uffff']);
    
    return ranges;
  }

  private static getPrecisionForRadius(radiusInKm: number): number {
    if (radiusInKm > 2500) return 1;
    if (radiusInKm > 600) return 2;
    if (radiusInKm > 70) return 3;
    if (radiusInKm > 20) return 4;
    if (radiusInKm > 2) return 5;
    if (radiusInKm > 0.6) return 6;
    if (radiusInKm > 0.07) return 7;
    return 8;
  }

  /**
   * Determines the zoom band for map signals.
   * @param zoom Current map zoom level
   * @returns Zoom band index
   */
  static getZoomBand(zoom: number): number {
    if (zoom < 4) return 0; // Global
    if (zoom < 8) return 1; // Regional
    if (zoom < 12) return 2; // City
    return 3; // Local
  }
}

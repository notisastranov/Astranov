import firestore, { safeFirestore, isFirestoreDisabled } from '../../../firestore';
import { YouTubeBackendService } from './YouTubeBackendService';
import { LocationResolutionService } from './LocationResolutionService';
import { GeoIndexService } from './GeoIndexService';
import { VideoSignal, OrbitalSignal, MapSignal, IngestionJob } from '../../types/youtube';
import { APICostProtectionService } from '../signals/APICostProtectionService';
import { SignalCacheService } from '../signals/SignalCacheService';
import { SignalDeduplicationService } from '../signals/SignalDeduplicationService';

export class YouTubeSignalHarvester {
  private static CATEGORIES = [
    'travel', 'city vlog', 'street food', 'events', 'music',
    'technology', 'breaking news', 'local culture', 'nightlife',
    'sports', 'drone footage'
  ];

  /**
   * Runs a harvesting cycle for a given category and region.
   * @param category Search category
   * @param region Optional region code
   */
  static async runHarvestCycle(category: string, region?: string): Promise<IngestionJob | null> {
    const cooldownId = `youtube_harvest_${category}_${region || 'global'}`;
    const canRun = await APICostProtectionService.checkCooldown(cooldownId);
    if (!canRun) {
      console.log(`Harvest cycle for ${category} is on cooldown.`);
      return null;
    }

    return safeFirestore(async (db) => {
      const jobId = `job_${Date.now()}`;
      const jobRef = db.collection('youtube_ingestion_jobs').doc(jobId);
      
      const job: IngestionJob = {
        id: jobId,
        query: category,
        region: region || 'global',
        startedAt: Date.now(),
        status: 'running',
        videosFetched: 0,
        videosStored: 0,
        errors: []
      };

      await jobRef.set(job);

      try {
        const videos = await YouTubeBackendService.searchVideos(category, region, 50);
        job.videosFetched = videos.length;
        await jobRef.update({ videosFetched: job.videosFetched });

        for (const video of videos) {
          try {
            await this.processVideo(video, 'harvester', 'system');
            job.videosStored++;
            await jobRef.update({ videosStored: job.videosStored });
          } catch (err: any) {
            console.error(`Error processing video ${video.videoId}:`, err.message);
            job.errors.push(`Video ${video.videoId}: ${err.message}`);
            await jobRef.update({ errors: job.errors });
          }
        }

        job.status = 'completed';
        job.finishedAt = Date.now();
        await jobRef.update({ status: job.status, finishedAt: job.finishedAt });

        // Set cooldown (e.g., 6 hours)
        await APICostProtectionService.setCooldown(cooldownId, 6 * 60 * 60 * 1000);
        
        // Log API usage
        await APICostProtectionService.logUsage({
          apiName: 'YouTube Data API v3',
          endpoint: 'search.list',
          timestamp: Date.now(),
          cost: 100, // Search cost is 100 units
          status: 'success'
        });

      } catch (err: any) {
        console.error("Harvest cycle failed:", err.message);
        job.status = 'failed';
        job.finishedAt = Date.now();
        job.errors.push(`Cycle failed: ${err.message}`);
        try {
          await jobRef.update({ status: job.status, finishedAt: job.finishedAt, errors: job.errors });
        } catch (e) {}
      }

      return job;
    }, null);
  }

  /**
   * Processes a single YouTube video and stores it in Firestore.
   * @param metadata YouTube video metadata
   * @param authorType Author type (user or harvester)
   * @param authorId Author ID
   */
  static async processVideo(metadata: any, authorType: 'user' | 'harvester', authorId: string): Promise<string> {
    return safeFirestore(async (db) => {
      // 1. Check cache first
      const cached = await SignalCacheService.get('youtube', metadata.videoId);
      if (cached) {
        console.log(`Using cached data for video ${metadata.videoId}`);
        // We still might want to update the signal if it's old, but for now we skip
      }

      // 2. Deduplicate by videoId
      const existing = await db.collection('video_signals')
        .where('videoId', '==', metadata.videoId)
        .limit(1)
        .get();

      if (!existing.empty) {
        return existing.docs[0].id;
      }

      // 3. Resolve location
      const location = await LocationResolutionService.resolveLocation(metadata);
      
      // 4. Generate geohash and keys
      const geohash = GeoIndexService.generateGeohash(location.lat, location.lng);
      const regionKey = GeoIndexService.getRegionKey(geohash);
      const cityKey = GeoIndexService.getCityKey(geohash);

      // 5. Create video signal
      const signalId = `sig_${metadata.videoId}`;
      const duplicateHash = SignalDeduplicationService.generateDuplicateHash({
        sourceId: metadata.videoId,
        title: metadata.title,
        lat: location.lat,
        lng: location.lng
      });

      const signal: any = {
        id: signalId,
        sourceType: 'youtube',
        videoId: metadata.videoId,
        youtubeUrl: metadata.youtubeUrl,
        title: metadata.title,
        description: metadata.description,
        thumbnailUrl: metadata.thumbnailUrl,
        channelTitle: metadata.channelTitle,
        publishedAt: metadata.publishedAt,
        createdAt: Date.now(),
        authorType,
        authorId,
        signalType: 'video',
        type: 'youtube_video', // For new engine
        visibility: 'public',
        locationSource: location.source,
        locationConfidence: location.confidence,
        lat: location.lat,
        lng: location.lng,
        geopoint: { latitude: location.lat, longitude: location.lng },
        geohash,
        regionKey,
        cityKey,
        duplicateHash,
        priorityScore: 1.0,
        signalStatus: 'active',
        engagementSummary: {
          views: parseInt(metadata.statistics?.viewCount || '0'),
          likes: parseInt(metadata.statistics?.likeCount || '0'),
          shares: 0
        },
        moderationStatus: 'approved',
        embedAllowed: metadata.contentDetails?.licensedContent !== false,
        madeForKidsStatus: false,
        previewDuration: 0
      };

      await db.collection('video_signals').doc(signalId).set(signal);

      // Cache the result
      await SignalCacheService.set({
        sourceType: 'youtube',
        sourceId: metadata.videoId,
        fetchedAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24h cache
        normalizedPayload: signal,
        qualityScore: 1.0
      });

      // 5. Create orbital signal (only if location is resolved)
      if (location.source !== 'unresolved') {
        const orbitalSignal: OrbitalSignal = {
          id: `orb_${signalId}`,
          sourceCollection: 'video_signals',
          sourceId: signalId,
          type: 'video',
          title: signal.title,
          thumbnailUrl: signal.thumbnailUrl,
          lat: signal.lat,
          lng: signal.lng,
          geohash: signal.geohash,
          priority: 1,
          renderMode: 'orbital',
          createdAt: signal.createdAt,
          freshnessScore: 1.0,
          popularityScore: signal.engagementSummary.views / 1000000 // Simple score
        };
        await db.collection('orbital_signals').doc(orbitalSignal.id).set(orbitalSignal);

        // 6. Create map signal
        const mapSignal: MapSignal = {
          id: `map_${signalId}`,
          sourceCollection: 'video_signals',
          sourceId: signalId,
          type: 'video',
          title: signal.title,
          thumbnailUrl: signal.thumbnailUrl,
          lat: signal.lat,
          lng: signal.lng,
          geopoint: signal.geopoint,
          geohash: signal.geohash,
          zoomBand: 1,
          cityKey: signal.cityKey,
          regionKey: signal.regionKey,
          createdAt: signal.createdAt,
          status: 'active'
        };
        await db.collection('map_signals').doc(mapSignal.id).set(mapSignal);
      }

      return signalId;
    }, '');
  }
}

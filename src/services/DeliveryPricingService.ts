import { DeliveryPricingResult } from '../types/operational';

export interface PricingInputs {
  distanceKm: number;
  withinCity: boolean;
  hourOfDay: number;
  totalVolumeLiters: number;
  totalWeightKg: number;
  weatherSeverity: 'clear' | 'bad';
  shopShareRule: number; // 0 to 1
  customerShareRule: number; // 0 to 1
}

export class DeliveryPricingService {
  static calculatePricing(inputs: PricingInputs): DeliveryPricingResult {
    const {
      distanceKm,
      withinCity,
      hourOfDay,
      totalVolumeLiters,
      totalWeightKg,
      weatherSeverity,
      shopShareRule,
      customerShareRule
    } = inputs;

    let basePrice = 3.0; // Minimum delivery for 0-3km
    let surchargeDistance = 0;
    let surchargeTime = 0;
    let surchargeVolume = 0;
    let surchargeWeight = 0;
    let surchargeWeather = 0;
    let returnDistanceCharge = 0;

    // Distance surcharge
    if (distanceKm > 3) {
      surchargeDistance = Math.ceil(distanceKm - 3) * 1.0;
    }

    // Time surcharges
    if (hourOfDay >= 22 || hourOfDay < 7) {
      surchargeTime += 1.0; // After 22:00
    }
    if (hourOfDay >= 7 && hourOfDay <= 10) {
      surchargeTime += 1.0; // Between 07:00 and 10:00
    }

    // Volume surcharge
    if (totalVolumeLiters > 3) {
      surchargeVolume = 1.0;
    }
    // Max volume check (handled by UI/Validation usually, but good to have)
    if (totalVolumeLiters > 30) {
      // Could throw error or cap it
    }

    // Weight surcharge
    if (totalWeightKg > 3) {
      surchargeWeight = 1.0;
    }
    // Max weight check
    if (totalWeightKg > 30) {
      // Could throw error or cap it
    }

    // Weather surcharge
    if (weatherSeverity === 'bad') {
      surchargeWeather = 1.0;
    }

    // Outside city surcharge
    if (!withinCity) {
      // Charge return distance too (assuming return distance is same as delivery distance)
      returnDistanceCharge = distanceKm * 1.0; 
    }

    const totalDeliveryPrice = 
      basePrice + 
      surchargeDistance + 
      surchargeTime + 
      surchargeVolume + 
      surchargeWeight + 
      surchargeWeather + 
      returnDistanceCharge;

    const shopContribution = totalDeliveryPrice * shopShareRule;
    const customerContribution = totalDeliveryPrice * customerShareRule;

    return {
      basePrice,
      surchargeDistance,
      surchargeTime,
      surchargeVolume,
      surchargeWeight,
      surchargeWeather,
      returnDistanceCharge,
      totalDeliveryPrice,
      shopContribution,
      customerContribution
    };
  }
}

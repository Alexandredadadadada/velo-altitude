import React from 'react';
import { render, screen } from '@testing-library/react';
import FTPService from '../../../services/FTPEstimationService';

describe('Tests des calculs FTP', () => {
  test('Calcul FTP à partir du test de 20 minutes', () => {
    // Test avec une valeur connue : 300W au test de 20min doit donner 285W de FTP
    const testValue = 300;
    const expectedFTP = 285; // 300 * 0.95
    
    const result = FTPService.estimateFTPFrom20MinTest(testValue);
    expect(result).toBe(expectedFTP);
    
    // Test avec valeur null/invalide
    expect(FTPService.estimateFTPFrom20MinTest(null)).toBeNull();
    expect(FTPService.estimateFTPFrom20MinTest(-10)).toBeNull();
    expect(FTPService.estimateFTPFrom20MinTest('abc')).toBeNull();
  });
  
  test('Calcul FTP à partir du test de 8 minutes', () => {
    // Test avec une valeur connue : 330W au test de 8min doit donner 297W de FTP
    const testValue = 330;
    const expectedFTP = 297; // 330 * 0.9
    
    const result = FTPService.estimateFTPFrom8MinTest(testValue);
    expect(result).toBe(expectedFTP);
    
    // Test avec facteur personnalisé (85%)
    expect(FTPService.estimateFTPFrom8MinTest(330, 0.85)).toBe(281); // 330 * 0.85
    
    // Test avec valeur null/invalide
    expect(FTPService.estimateFTPFrom8MinTest(null)).toBeNull();
    expect(FTPService.estimateFTPFrom8MinTest(-10)).toBeNull();
  });
  
  test('Calcul FTP à partir du test de 5 minutes', () => {
    // Test avec une valeur connue : 350W au test de 5min doit donner 298W de FTP (0.85)
    const testValue = 350;
    const expectedFTP = 298; // 350 * 0.85 = 297.5, arrondi à 298
    
    const result = FTPService.estimateFTPFrom5MinTest(testValue);
    expect(result).toBe(expectedFTP);
    
    // Test avec facteur personnalisé (0.82)
    expect(FTPService.estimateFTPFrom5MinTest(350, 0.82)).toBe(287); // 350 * 0.82
  });
  
  test('Calcul du Critical Power (CP) à partir des tests 5min et 1min', () => {
    // Test avec des valeurs connues:
    // 400W sur 5min (300s) et 600W sur 1min (60s)
    const power5min = 400;
    const power1min = 600;
    
    // CP = (P5 × t5 - P1 × t1) / (t5 - t1)
    // CP = (400 × 300 - 600 × 60) / (300 - 60)
    // CP = (120000 - 36000) / 240
    // CP = 84000 / 240 = 350
    const expectedCP = 350;
    
    // AWC = (P1 - CP) × t1
    // AWC = (600 - 350) × 60
    // AWC = 250 × 60 = 15000 J
    const expectedAWC = 15000;
    
    const result = FTPService.calculateCP(power5min, power1min);
    expect(result.cp).toBe(expectedCP);
    expect(result.awc).toBe(expectedAWC);
    
    // Test avec valeurs invalides
    expect(FTPService.calculateCP(null, 600)).toBeNull();
    expect(FTPService.calculateCP(400, null)).toBeNull();
    expect(FTPService.calculateCP(400, 400)).toBeNull(); // P1 doit être > P5
  });
  
  test('Calcul de FTP à partir de CP', () => {
    // Test avec une valeur connue : CP = 300 doit donner 291W de FTP (300 * 0.97)
    const cpValue = 300;
    const expectedFTP = 291; // 300 * 0.97
    
    const result = FTPService.estimateFTPFromCP(cpValue);
    expect(result).toBe(expectedFTP);
    
    // Test avec valeur null/invalide
    expect(FTPService.estimateFTPFromCP(null)).toBeNull();
    expect(FTPService.estimateFTPFromCP(-10)).toBeNull();
  });
  
  test('Calcul des zones de puissance', () => {
    // Test avec FTP = 300W
    const ftp = 300;
    const zones = FTPService.calculatePowerZones(ftp);
    
    // Vérifier chaque zone
    expect(zones.zone1.min).toBe(0);
    expect(zones.zone1.max).toBe(165); // 0.55 * 300
    
    expect(zones.zone2.min).toBe(168); // 0.56 * 300
    expect(zones.zone2.max).toBe(225); // 0.75 * 300
    
    expect(zones.zone3.min).toBe(228); // 0.76 * 300
    expect(zones.zone3.max).toBe(270); // 0.9 * 300
    
    expect(zones.zone4.min).toBe(273); // 0.91 * 300
    expect(zones.zone4.max).toBe(315); // 1.05 * 300
    
    expect(zones.zone5.min).toBe(318); // 1.06 * 300
    expect(zones.zone5.max).toBe(360); // 1.2 * 300
    
    expect(zones.zone6.min).toBe(363); // 1.21 * 300
    expect(zones.zone6.max).toBe(450); // 1.5 * 300
    
    expect(zones.zone7.min).toBe(453); // 1.51 * 300
    expect(zones.zone7.max).toBe(Infinity);
  });
  
  test('Calcul des zones cardiaques', () => {
    // Test avec des valeurs connues :
    // FCmax = 180, FCrepos = 60
    // Réserve cardiaque = 180 - 60 = 120
    const maxHR = 180;
    const restingHR = 60;
    
    const zones = FTPService.calculateHeartRateZones(maxHR, restingHR);
    
    // Zone 1: 50-60% de la réserve cardiaque + FC repos
    // 60 + (0.5 * 120) = 60 + 60 = 120
    // 60 + (0.6 * 120) = 60 + 72 = 132
    expect(zones.zone1.min).toBe(120);
    expect(zones.zone1.max).toBe(132);
    
    // Zone 2: 60-70% de la réserve cardiaque + FC repos
    // 60 + (0.6 * 120) + 1 = 60 + 72 + 1 = 133
    // 60 + (0.7 * 120) = 60 + 84 = 144
    expect(zones.zone2.min).toBe(133);
    expect(zones.zone2.max).toBe(144);
    
    // Zone 3: 70-80% de la réserve cardiaque + FC repos
    // 60 + (0.7 * 120) + 1 = 60 + 84 + 1 = 145
    // 60 + (0.8 * 120) = 60 + 96 = 156
    expect(zones.zone3.min).toBe(145);
    expect(zones.zone3.max).toBe(156);
    
    // Zone 4: 80-90% de la réserve cardiaque + FC repos
    // 60 + (0.8 * 120) + 1 = 60 + 96 + 1 = 157
    // 60 + (0.9 * 120) = 60 + 108 = 168
    expect(zones.zone4.min).toBe(157);
    expect(zones.zone4.max).toBe(168);
    
    // Zone 5: 90-100% de la réserve cardiaque + FC repos
    // 60 + (0.9 * 120) + 1 = 60 + 108 + 1 = 169
    // 60 + (1.0 * 120) = 60 + 120 = 180
    expect(zones.zone5.min).toBe(169);
    expect(zones.zone5.max).toBe(180);
    
    // Test avec valeurs invalides
    expect(FTPService.calculateHeartRateZones(null, 60)).toBeNull();
    expect(FTPService.calculateHeartRateZones(180, null)).toBeNull();
    expect(FTPService.calculateHeartRateZones(50, 60)).toBeNull(); // FCmax doit être > FCrepos
  });
  
  test('Calcul FTP à partir du test Ramp', () => {
    // Test avec une valeur connue : 400W max au test ramp doit donner 300W de FTP (400 * 0.75)
    const rampMaxPower = 400;
    const expectedFTP = 300; // 400 * 0.75
    
    const result = FTPService.estimateFTPFromRampTest(rampMaxPower);
    expect(result).toBe(expectedFTP);
    
    // Test avec facteur personnalisé
    expect(FTPService.estimateFTPFromRampTest(400, 0.73)).toBe(292); // 400 * 0.73
    
    // Test avec valeur null/invalide
    expect(FTPService.estimateFTPFromRampTest(null)).toBeNull();
    expect(FTPService.estimateFTPFromRampTest(-10)).toBeNull();
  });
  
  test('Calcul FTP à partir du poids et niveau', () => {
    // Test avec poids = 70kg, niveau avancé
    const weight = 70;
    const level = 'advanced';
    
    const result = FTPService.estimateFTPFromWeight(weight, level);
    expect(result).toBe(280); // 70 * 4.0 (coefficient moyen pour niveau avancé)
    
    // Test avec différents niveaux
    expect(FTPService.estimateFTPFromWeight(70, 'beginner')).toBe(140); // 70 * 2.0
    expect(FTPService.estimateFTPFromWeight(70, 'intermediate')).toBe(210); // 70 * 3.0
    expect(FTPService.estimateFTPFromWeight(70, 'elite')).toBe(364); // 70 * 5.2
    
    // Test avec valeur null/invalide
    expect(FTPService.estimateFTPFromWeight(null)).toBeNull();
    expect(FTPService.estimateFTPFromWeight(-10)).toBeNull();
  });
  
  test('Validation FTP avec valeurs valides et invalides', () => {
    // Validation avec valeur valide
    expect(FTPService.validateFTP(300)).toBe(300);
    
    // Validation avec valeur invalide et profil utilisateur
    const userProfile = {
      weight: 75,
      level: 'intermediate'
    };
    
    expect(FTPService.validateFTP(null, userProfile)).toBe(225); // 75 * 3.0
    expect(FTPService.validateFTP(-10, userProfile)).toBe(225);
    expect(FTPService.validateFTP('abc', userProfile)).toBe(225);
    
    // Validation avec valeur invalide sans profil
    jest.spyOn(console, 'warn').mockImplementation();
    const defaultFtp = FTPService.validateFTP(null);
    expect(defaultFtp).toBeGreaterThan(0); // Doit retourner une valeur par défaut
    jest.restoreAllMocks();
  });
});

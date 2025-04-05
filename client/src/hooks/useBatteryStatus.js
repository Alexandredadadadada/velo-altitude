/**
 * Hook personnalisé pour surveiller l'état de la batterie
 * Permet d'optimiser les rendus 3D et animations selon le niveau de batterie
 */
import { useState, useEffect } from 'react';

export const useBatteryStatus = () => {
  const [batteryData, setBatteryData] = useState({
    batteryLevel: 100,
    isCharging: true,
    chargingTime: 0,
    dischargingTime: Infinity,
    supported: false,
  });

  useEffect(() => {
    // Vérifier si l'API Battery est supportée
    if (!('getBattery' in navigator)) {
      console.log('Battery API non supportée, utilisation des valeurs par défaut');
      return;
    }

    let battery = null;
    
    // Fonction de mise à jour des données de batterie
    const updateBatteryData = (batteryObj) => {
      setBatteryData({
        batteryLevel: Math.round(batteryObj.level * 100),
        isCharging: batteryObj.charging,
        chargingTime: batteryObj.chargingTime,
        dischargingTime: batteryObj.dischargingTime,
        supported: true,
      });
    };

    // Initialisation et configuration des listeners
    const setupBattery = async () => {
      try {
        battery = await navigator.getBattery();
        updateBatteryData(battery);

        // Événements de changement d'état de la batterie
        battery.addEventListener('levelchange', () => updateBatteryData(battery));
        battery.addEventListener('chargingchange', () => updateBatteryData(battery));
        battery.addEventListener('chargingtimechange', () => updateBatteryData(battery));
        battery.addEventListener('dischargingtimechange', () => updateBatteryData(battery));
      } catch (error) {
        console.error('Erreur lors de l\'accès à l\'API Battery:', error);
      }
    };

    setupBattery();

    // Nettoyage des listeners lors du démontage
    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', updateBatteryData);
        battery.removeEventListener('chargingchange', updateBatteryData);
        battery.removeEventListener('chargingtimechange', updateBatteryData);
        battery.removeEventListener('dischargingtimechange', updateBatteryData);
      }
    };
  }, []);

  // Fonction utilitaire pour déterminer l'état de la batterie
  const getBatteryStatus = () => {
    const { batteryLevel, isCharging } = batteryData;
    
    if (isCharging) return 'charging';
    if (batteryLevel <= 10) return 'critical';
    if (batteryLevel <= 20) return 'low';
    if (batteryLevel <= 50) return 'medium';
    return 'high';
  };

  return { 
    ...batteryData, 
    batteryStatus: getBatteryStatus()
  };
};

export default useBatteryStatus;

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type BluetoothCharacteristicLike = {
  value: DataView | null;
  startNotifications: () => Promise<unknown>;
  stopNotifications: () => Promise<unknown>;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
};

type BluetoothServiceLike = {
  getCharacteristic: (characteristic: string) => Promise<BluetoothCharacteristicLike>;
};

type BluetoothServerLike = {
  getPrimaryService: (service: string) => Promise<BluetoothServiceLike>;
};

type BluetoothDeviceLike = {
  gatt?: {
    connect: () => Promise<BluetoothServerLike>;
    connected?: boolean;
    disconnect: () => void;
  };
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

type BluetoothLike = {
  requestDevice: (options: unknown) => Promise<BluetoothDeviceLike>;
};

type HeartRateCharacteristicEvent = Event & {
  target: {
    value: DataView | null;
  };
};

export const useHeartRate = () => {
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const characteristicRef = useRef<BluetoothCharacteristicLike | null>(null);
  const disconnectRef = useRef<(() => void) | null>(null);

  const handleValueChanged = useCallback((event: HeartRateCharacteristicEvent) => {
    const value = event.target.value;
    if (!value) return;

    // Bluetooth Heart Rate Measurement format:
    // bit 0 of first byte decides if HR is uint8 (0) or uint16 (1).
    const flags = value.getUint8(0);
    const isUint16 = (flags & 0x01) === 0x01;
    const rate = isUint16 ? value.getUint16(1, true) : value.getUint8(1);
    setHeartRate(rate);
  }, []);

  const disconnect = useCallback(() => {
    const characteristic = characteristicRef.current;
    if (characteristic) {
      characteristic.removeEventListener(
        'characteristicvaluechanged',
        handleValueChanged as EventListener,
      );
      void characteristic.stopNotifications().catch(() => undefined);
    }
    characteristicRef.current = null;
    if (disconnectRef.current) {
      disconnectRef.current();
      disconnectRef.current = null;
    }
  }, [handleValueChanged]);

  const connect = useCallback(async () => {
    const nav = navigator as Navigator & { bluetooth?: BluetoothLike };
    if (!nav.bluetooth) {
      setError('Web Bluetooth is not supported in this browser.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      disconnect();

      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
      });

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Could not connect to Bluetooth GATT server.');
      }

      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      await characteristic.startNotifications();

      characteristic.addEventListener(
        'characteristicvaluechanged',
        handleValueChanged as EventListener,
      );
      characteristicRef.current = characteristic;

      const onDisconnected = () => {
        setHeartRate(null);
        characteristicRef.current = null;
      };
      device.addEventListener('gattserverdisconnected', onDisconnected);
      disconnectRef.current = () => {
        device.removeEventListener('gattserverdisconnected', onDisconnected);
        if (device.gatt?.connected) {
          device.gatt.disconnect();
        }
      };
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Connection failed';
      setError(message);
      console.error('Connection failed', caughtError);
    } finally {
      setIsConnecting(false);
    }
  }, [disconnect, handleValueChanged]);

  useEffect(() => () => disconnect(), [disconnect]);

  return { heartRate, connect, disconnect, isConnecting, error };
};

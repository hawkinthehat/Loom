'use client';

import { useState } from 'react';

type HeartRateConnection = {
  deviceName: string;
  bpm?: number;
};

type BluetoothButtonProps = {
  onConnected: (connection: HeartRateConnection) => void;
  onHeartRate?: (connection: { bpm: number }) => void;
};

const HEART_RATE_SERVICE = 'heart_rate';
const HEART_RATE_MEASUREMENT = 'heart_rate_measurement';

const parseHeartRate = (dataView: DataView): number | undefined => {
  const flags = dataView.getUint8(0);
  const isUint16 = (flags & 0x01) === 0x01;
  if (isUint16) {
    if (dataView.byteLength < 3) return undefined;
    return dataView.getUint16(1, true);
  }
  if (dataView.byteLength < 2) return undefined;
  return dataView.getUint8(1);
};

export const BluetoothButton = ({ onConnected, onHeartRate }: BluetoothButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    if (!navigator.bluetooth) {
      setError('Web Bluetooth is not supported in this browser.');
      return;
    }

    setError(null);
    setIsConnecting(true);

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HEART_RATE_SERVICE] }],
        optionalServices: [HEART_RATE_SERVICE],
      });
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server.');
      }

      const service = await server.getPrimaryService(HEART_RATE_SERVICE);
      const characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT);
      const initialValue = await characteristic.readValue();
      const bpm = parseHeartRate(initialValue);

      characteristic.addEventListener(
        'characteristicvaluechanged',
        (event: Event) => {
          const target = event.target as BluetoothRemoteGATTCharacteristic;
          const value = target.value;
          if (!value) return;
          const nextBpm = parseHeartRate(value);
          if (typeof nextBpm === 'number') {
            onHeartRate?.({ bpm: nextBpm });
          }
          onConnected({
            deviceName: device.name || 'Heart Rate Device',
            bpm: nextBpm,
          });
        },
      );

      await characteristic.startNotifications();

      onConnected({
        deviceName: device.name || 'Heart Rate Device',
        bpm,
      });
      if (typeof bpm === 'number') {
        onHeartRate?.({ bpm });
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Bluetooth connection failed.';
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => {
          void connect();
        }}
        disabled={isConnecting}
        className="rounded-full border border-sky-300 px-5 py-2 text-xs uppercase tracking-[0.22em] text-sky-50 transition-colors hover:bg-sky-100/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isConnecting ? 'Connecting...' : 'Connect Heart Rate'}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
};

'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCodeDisplay({ value, size = 200, className }: QRCodeDisplayProps) {
  return (
    <div className={className}>
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        includeMargin={false}
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </div>
  );
}

QRCodeDisplay.displayName = 'QRCodeDisplay';

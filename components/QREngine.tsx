import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Circle, Polygon, Defs, LinearGradient, RadialGradient, Stop, Image as SvgImage, Text as SvgText } from 'react-native-svg';
import qrcode from 'qrcode';

interface QREngineProps {
  value: string;
  design?: number; // 1-16
  size?: number;
  fgColor?: string;
  bgColor?: string;
  gradColor?: string;
  ecLevel?: 'L'|'M'|'Q'|'H';
  quietZone?: number;
  logo?: string | null;
  logoSizePct?: number; 
  frame?: 'none'|'box'|'text';
  frameColor?: string;
  frameText?: string;
}

export default function QREngine({
  value = 'https://mosgen-mobile.dev',
  design = 1,
  size = 220,
  fgColor = '#000000',
  bgColor = '#ffffff',
  gradColor = '#6366f1',
  ecLevel = 'M',
  quietZone = 4,
  logo = null,
  logoSizePct = 20,
  frame = 'none',
  frameColor = '#6366f1',
  frameText = 'SCAN ME'
}: QREngineProps) {

  // Generate logical grid
  const matrix = useMemo(() => {
    try {
      const qr = qrcode.create(value || " ", { errorCorrectionLevel: ecLevel, margin: quietZone });
      const sz = qr.modules.size;
      const data = qr.modules.data;
      const res = [];
      for (let y = 0; y < sz; y++) {
        for (let x = 0; x < sz; x++) {
          if (data[y * sz + x]) res.push({ x, y });
        }
      }
      return { modules: res, count: sz };
    } catch (e) {
      return { modules: [], count: 21 }; // Fallback
    }
  }, [value, ecLevel, quietZone]);

  const N = matrix.count;
  const cSize = size / N;

  const renderModule = (x: number, y: number, key: string) => {
    const cx = x * cSize;
    const cy = y * cSize;
    const fill = (design >= 7 && design <= 10) ? 'url(#grad)' : fgColor;

    // Optional: Avoid rendering under logo dynamically
    if (logo) {
       const lPct = logoSizePct / 100;
       const holeStart = N / 2 - (N * lPct) / 2;
       const holeEnd = N / 2 + (N * lPct) / 2;
       if (x >= holeStart && x <= holeEnd && y >= holeStart && y <= holeEnd) {
           return null; // Skip drawing module under logo
       }
    }

    switch (design) {
      case 2: return <Rect key={key} x={cx+cSize*0.05} y={cy+cSize*0.05} width={cSize*0.9} height={cSize*0.9} rx={cSize*0.25} fill={fill} />;
      case 3: return <Circle key={key} cx={cx+cSize/2} cy={cy+cSize/2} r={cSize*0.45} fill={fill} />;
      case 4: return <Rect key={key} x={cx+cSize*0.1} y={cy+cSize*0.1} width={cSize*0.8} height={cSize*0.8} fill={fill} />;
      case 5: return <Rect key={key} x={cx+cSize*0.1} y={cy-0.1} width={cSize*0.8} height={cSize+0.2} fill={fill} />;
      case 6: return <Rect key={key} x={cx-0.1} y={cy+cSize*0.1} width={cSize+0.2} height={cSize*0.8} fill={fill} />;
      case 11: return <Polygon key={key} fill={fgColor} points={`${cx+cSize/2},${cy} ${cx+cSize},${cy+cSize/2} ${cx+cSize/2},${cy+cSize} ${cx},${cy+cSize/2}`} />;
      case 12: return <React.Fragment key={key}><Rect x={cx+cSize*0.3} y={cy} width={cSize*0.4} height={cSize} fill={fgColor} /><Rect x={cx} y={cy+cSize*0.3} width={cSize} height={cSize*0.4} fill={fgColor} /></React.Fragment>;
      case 13: return <Polygon key={key} fill={fgColor} points={`${cx+cSize/2},${cy+cSize*0.1} ${cx+cSize*0.6},${cy+cSize*0.4} ${cx+cSize*0.9},${cy+cSize*0.4} ${cx+cSize*0.7},${cy+cSize*0.6} ${cx+cSize*0.8},${cy+cSize*0.9} ${cx+cSize/2},${cy+cSize*0.75} ${cx+cSize*0.2},${cy+cSize*0.9} ${cx+cSize*0.3},${cy+cSize*0.6} ${cx+cSize*0.1},${cy+cSize*0.4} ${cx+cSize*0.4},${cy+cSize*0.4}`} />;
      case 14: return <Polygon key={key} fill={fgColor} points={`${cx+cSize/2},${cy+cSize*0.1} ${cx+cSize*0.9},${cy+cSize*0.9} ${cx+cSize*0.1},${cy+cSize*0.9}`} />;
      case 15: return <Circle key={key} cx={cx+cSize/2} cy={cy+cSize/2} r={cSize*0.35} stroke={fgColor} strokeWidth={cSize*0.2} fill="none" />;
      case 16: return <Rect key={key} x={cx+cSize*0.2} y={cy+cSize*0.2} width={cSize*0.6} height={cSize*0.6} fill={fgColor} />;
      default: return <Rect key={key} x={cx} y={cy} width={cSize} height={cSize} fill={fill} />;
    }
  };

  const pad = frame !== 'none' ? 40 : 0;
  const drawSize = size + (pad * 2);

  return (
    <View style={{ overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={drawSize} height={drawSize + (frame === 'text' ? 20 : 0)} viewBox={`0 0 ${drawSize} ${drawSize + (frame === 'text' ? 20 : 0)}`}>
        <Defs>
           {design === 9 && <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0"><Stop offset="0%" stopColor={fgColor} /><Stop offset="100%" stopColor={gradColor} /></LinearGradient>}
           {design === 10 && <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><Stop offset="0%" stopColor={fgColor} /><Stop offset="100%" stopColor={gradColor} /></LinearGradient>}
           {(design === 7 || design === 8) && <RadialGradient id="grad" cx="50%" cy="50%" r="50%"><Stop offset="0%" stopColor={fgColor} /><Stop offset="100%" stopColor={gradColor} /></RadialGradient>}
        </Defs>

        {/* Frame Outer Box */}
        {frame !== 'none' && (
          <Rect x={0} y={0} width={drawSize} height={drawSize + (frame === 'text' ? 20 : 0)} rx={20} fill={frameColor} />
        )}

        {/* Inner SVG Safe Container background */}
        <Rect x={pad} y={pad} width={size} height={size} rx={frame !== 'none' ? 10 : 0} fill={bgColor} />
        
        {/* Draw Custom QR Vector Math */}
        {matrix.modules.map((m, i) => (
            <React.Fragment key={`qr_m_${i}`}>
               {/* Shift matrix origin by padding if Frame exists */}
               <Svg key={`g_${i}`} x={pad} y={pad}>{renderModule(m.x, m.y, `qr_mod_${i}`)}</Svg>
            </React.Fragment>
        ))}

        {/* Embedded Dynamic Image Overlay Logo */}
        {logo && (
          <SvgImage 
             href={logo}
             x={pad + (size / 2) - ((size * (logoSizePct/100)) / 2)}
             y={pad + (size / 2) - ((size * (logoSizePct/100)) / 2)}
             width={size * (logoSizePct/100)}
             height={size * (logoSizePct/100)}
             preserveAspectRatio="xMidYMid slice"
          />
        )}

        {/* Frame Outer Text Bottom Overlay */}
        {frame === 'text' && (
          <SvgText x={drawSize/2} y={drawSize + 5} fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle">
             {frameText}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

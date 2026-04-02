import React, { useState, createElement } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import QREngine from './components/QREngine';

export default function App() {
  // HTML => PDF States
  const [htmlContent, setHtmlContent] = useState('');
  const [pageSize, setPageSize] = useState('A4');
  const [htmlFileName, setHtmlFileName] = useState('');

  // QR Engine States
  const [qrText, setQrText] = useState('https://mosgen-mobile.dev');
  const [qrDesign, setQrDesign] = useState(1);
  const [qrSize, setQrSize] = useState(250);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [gradColor, setGradColor] = useState('#6366f1');
  const [ecLevel, setEcLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [quietZone, setQuietZone] = useState(4);
  const [logoBase64, setLogoBase64] = useState<string|null>(null);
  const [logoSizePct, setLogoSizePct] = useState(20);
  const [frame, setFrame] = useState<'none'|'box'|'text'>('none');
  const [frameColor, setFrameColor] = useState('#6366f1');
  const [frameText, setFrameText] = useState('SCAN ME');

  const uploadHTML = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['text/html', 'text/plain'] });
      if (result.canceled) return;
      const file = result.assets[0];
      if (typeof window !== 'undefined') { 
        const response = await fetch(file.uri);
        const textStr = await response.text();
        setHtmlContent(textStr);
        setHtmlFileName(file.name);
      } else {
         Alert.alert("Native Notice", "Document loaded: " + file.name);
      }
    } catch (err) { Alert.alert('Error', 'Failed to read document'); }
  };

  const uploadLogo = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, base64: true, quality: 0.8
      });
      if(!res.canceled && res.assets && res.assets[0].base64) {
         setLogoBase64(`data:${res.assets[0].type || 'image/png'};base64,${res.assets[0].base64}`);
      }
    } catch (e) {}
  };

  const generatePDF = async () => {
    if(!htmlContent) return Alert.alert("Wait!", "Please enter HTML first.");
    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent, base64: false,
        height: pageSize === 'A4' ? 842 : 792, width: pageSize === 'A4' ? 595 : 612,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else { Alert.alert('PDF Built!', `Access file at: ${uri}`); }
    } catch (err: any) { Alert.alert('PDF Error', err.message); }
  };

  const downloadQRAsSVG = () => {
    if (typeof document === 'undefined') return Alert.alert('Not available', 'Download only works in browser.');
    const container = document.getElementById('qr-svg-container');
    const svgEl = container?.querySelector('svg');
    if (!svgEl) return Alert.alert('Error', 'QR not ready yet.');
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mosgen_qr_style${qrDesign}.svg`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const downloadQRAsPNG = () => {
    if (typeof document === 'undefined') return Alert.alert('Not available', 'Download only works in browser.');
    const container = document.getElementById('qr-svg-container');
    const svgEl = container?.querySelector('svg');
    if (!svgEl) return Alert.alert('Error', 'QR not ready yet.');
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svgBlob);
    const img = new Image();
    const svgW = svgEl.width?.baseVal?.value || qrSize;
    const svgH = svgEl.height?.baseVal?.value || qrSize;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgW * 2; canvas.height = svgH * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      DOMURL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `mosgen_qr_style${qrDesign}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };
    img.src = url;
  };

  // Cross-Platform Native OS Color Wheel Picker Component
  const NativeColorPicker = ({ color, onChange, label }: { color: string, onChange: (c:string)=>void, label: string }) => {
     if (Platform.OS === 'web') {
         return (
             <View style={{flex: 1, alignItems: 'center'}}>
                <Text style={styles.lbl}>{label}</Text>
                {createElement('input', {
                    type: 'color', value: color,
                    onChange: (e: any) => onChange(e.target.value),
                    style: { width: '100%', height: 40, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 8, backgroundColor: 'transparent' }
                })}
             </View>
         );
     }
     return (
         <View style={{flex: 1}}>
             <Text style={styles.lbl}>{label}</Text>
             <TextInput style={styles.input} value={color} onChangeText={onChange} />
         </View>
     );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>MOSGen Web</Text>
      
      {/* HTML to PDF Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>HTML to PDF System</Text>
        <TouchableOpacity style={styles.btnSecondary} onPress={uploadHTML}>
          <Text style={styles.btnSecondaryText}>{htmlFileName ? `Loaded: ${htmlFileName}` : '📂 Upload HTML File (Offline)'}</Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top', marginTop: 10 }]} multiline
          value={htmlContent} onChangeText={setHtmlContent} placeholder="<html><body>... HTML code</body></html>"
        />
        <View style={styles.row}>
          <TouchableOpacity style={styles.btnOutline} onPress={() => setPageSize(pageSize === 'A4' ? 'Letter' : 'A4')}>
             <Text style={styles.btnOutlineText}>Format: {pageSize}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={generatePDF}>
          <Text style={styles.btnPrimaryText}>Print HTML Document</Text>
        </TouchableOpacity>
      </View>

      {/* QR Code Demo Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>QR Matrix Generator</Text>
        
        <Text style={styles.lbl}>QR Data String / URL</Text>
        <TextInput style={styles.input} value={qrText} onChangeText={setQrText} placeholder="Destination URL..." />
        
        <Text style={styles.lbl}>Vector Style (1-16)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
           <View style={{flexDirection: 'row', gap: 6}}>
             {Array.from({length: 16}, (_, i) => i + 1).map(id => (
                <TouchableOpacity key={`d${id}`} style={[styles.btnOutline, qrDesign === id && styles.btnActive, {paddingVertical: 6, paddingHorizontal: 10}]} onPress={() => setQrDesign(id)}>
                  <Text style={[styles.btnOutlineText, qrDesign === id && styles.btnActiveText]}>#{id}</Text>
                </TouchableOpacity>
             ))}
           </View>
        </ScrollView>

        {/* Sliders */}
        <Text style={styles.lbl}>Output Size ({qrSize}px)</Text>
        <Slider style={styles.slider} minimumValue={100} maximumValue={800} step={10} value={qrSize} onValueChange={setQrSize} minimumTrackTintColor="#6366f1" />

        <Text style={styles.lbl}>Quiet Zone Margin Padding ({quietZone})</Text>
        <Slider style={styles.slider} minimumValue={0} maximumValue={10} step={1} value={quietZone} onValueChange={setQuietZone} minimumTrackTintColor="#6366f1" />

        <View style={{flexDirection: 'row', gap: 15, marginBottom: 15, zIndex: 99}}>
           <NativeColorPicker label="Foreground" color={fgColor} onChange={setFgColor} />
           <NativeColorPicker label="Background" color={bgColor} onChange={setBgColor} />
           <NativeColorPicker label="Gradient" color={gradColor} onChange={setGradColor} />
        </View>

        <Text style={styles.lbl}>Error Correction Limit (Heavier = Safer Data)</Text>
        <View style={styles.row}>
           {(['L','M','Q','H'] as const).map(lev => (
              <TouchableOpacity key={lev} style={[styles.btnOutline, ecLevel === lev && styles.btnActive, {flex: 1, alignItems: 'center'}]} onPress={() => setEcLevel(lev)}>
                 <Text style={[styles.btnOutlineText, ecLevel === lev && styles.btnActiveText]}>{lev}</Text>
              </TouchableOpacity>
           ))}
        </View>

        <Text style={styles.lbl}>Dynamic Logo Upload</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.btnSecondary} onPress={uploadLogo}>
             <Text style={styles.btnSecondaryText}>{logoBase64 ? '✓ Logo Attached' : '🖼️ Pick Image'}</Text>
          </TouchableOpacity>
          {logoBase64 && <TouchableOpacity style={styles.btnCancel} onPress={() => setLogoBase64(null)}><Text style={{color: 'red'}}>X</Text></TouchableOpacity>}
        </View>

        {logoBase64 && (
           <>
             <Text style={styles.lbl}>Logo Scale ({logoSizePct}%)</Text>
             <Slider style={styles.slider} minimumValue={10} maximumValue={40} step={1} value={logoSizePct} onValueChange={setLogoSizePct} minimumTrackTintColor="#6366f1" />
           </>
        )}

        <Text style={styles.lbl}>Outer Visual Frame</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btnOutline, frame!=='none' && styles.btnActive]} onPress={() => setFrame(frame === 'none' ? 'text' : 'none')}>
             <Text style={frame!=='none'? styles.btnActiveText : styles.btnOutlineText}>Enable Frame Overlay</Text>
          </TouchableOpacity>
          {frame !== 'none' && <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} value={frameText} onChangeText={setFrameText} placeholder="Label..." />}
        </View>
        {frame !== 'none' && (
           <View style={{flexDirection: 'row', width: '31%', marginBottom: 15}}>
              <NativeColorPicker label="Frame Bagckground" color={frameColor} onChange={setFrameColor} />
           </View>
        )}

        {/* Extracted SVG Container */}
        <View style={styles.qrContainer}>
           <QREngine 
             value={qrText} design={qrDesign} size={qrSize} 
             fgColor={fgColor} bgColor={bgColor} gradColor={gradColor}
             logo={logoBase64} logoSizePct={logoSizePct}
             frame={frame} frameText={frameText} frameColor={frameColor}
             ecLevel={ecLevel} quietZone={quietZone}
           />
        </View>

        {/* Download Buttons */}
        <View style={[styles.row, {marginTop: 16}]}>
          <TouchableOpacity style={[styles.btnPrimary, {flex: 1}]} onPress={downloadQRAsPNG}>
            <Text style={styles.btnPrimaryText}>⬇ Download PNG</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnOutline, {flex: 1, alignItems: 'center'}]} onPress={downloadQRAsSVG}>
            <Text style={styles.btnOutlineText}>⬇ Download SVG</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingTop: 40, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 24, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 16 },
  lbl: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  slider: { width: '100%', height: 40, marginBottom: 15 },
  input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 13, color: '#1f2937', marginBottom: 15, backgroundColor: '#f9fafb' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  btnOutline: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1.5, borderColor: '#a5b4fc', backgroundColor: '#e0e7ff' },
  btnOutlineText: { color: '#4f46e5', fontWeight: '600', fontSize: 13 },
  btnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  btnActiveText: { color: '#fff' },
  btnSecondary: { backgroundColor: '#f3f4f6', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, flex: 1 },
  btnSecondaryText: { color: '#4b5563', fontWeight: '600', textAlign: 'center' },
  btnCancel: { borderWidth: 1.5, borderColor: '#fca5a5', padding: 10, borderRadius: 8 },
  btnPrimary: { backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 10, alignItems: 'center', shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  qrContainer: { alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 12, backgroundColor: '#fafafa', overflow: 'hidden' }
});

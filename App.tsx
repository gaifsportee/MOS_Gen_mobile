import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import QREngine from './components/QREngine';

export default function App() {
  // HTML => PDF States
  const [htmlContent, setHtmlContent] = useState('');
  const [pageSize, setPageSize] = useState('A4');
  const [htmlFileName, setHtmlFileName] = useState('');

  // QR Engine States
  const [qrText, setQrText] = useState('https://mosgen-mobile.dev');
  const [qrDesign, setQrDesign] = useState(1);
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

  // Document Handler
  const uploadHTML = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/html', 'text/plain']
      });
      if (result.canceled) return;
      const file = result.assets[0];
      
      // On Web, file.uri is an object URL, but file.file is the actual Blob
      // React Native doesn't easily read raw text without expo-file-system unless on web:
      if (typeof window !== 'undefined') { // If PWA web build
        const response = await fetch(file.uri);
        const textStr = await response.text();
        setHtmlContent(textStr);
        setHtmlFileName(file.name);
      } else {
         // Expo Native requires expo-file-system, mock it if undefined or throw error
         Alert.alert("Native Notice", "Document loaded: " + file.name);
         setHtmlContent("<h1>Mobile App Loading Not configured yet...</h1>");
      }
    } catch (err) {
      Alert.alert('Upload Error', 'Failed to read document');
    }
  };

  const uploadLogo = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: true,
        quality: 0.8
      });
      if(!res.canceled && res.assets && res.assets[0].base64) {
         setLogoBase64(`data:${res.assets[0].type || 'image/png'};base64,${res.assets[0].base64}`);
      }
    } catch (e) { Alert.alert('Error', 'Image upload failed'); }
  };

  const generatePDF = async () => {
    if(!htmlContent) return Alert.alert("Wait!", "Please enter or upload HTML first.");
    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        height: pageSize === 'A4' ? 842 : 792,
        width: pageSize === 'A4' ? 595 : 612,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        Alert.alert('PDF Built!', `File successfully constructed offline at: ${uri}`);
      }
    } catch (err: any) {
      Alert.alert('PDF Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>MOSGen Web</Text>
      
      {/* HTML to PDF Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>HTML to PDF System</Text>
        <TouchableOpacity style={styles.btnSecondary} onPress={uploadHTML}>
          <Text style={styles.btnSecondaryText}>
             {htmlFileName ? `Loaded: ${htmlFileName}` : '📂 Upload HTML File (Offline)'}
          </Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top', marginTop: 10 }]}
          multiline
          value={htmlContent}
          onChangeText={setHtmlContent}
          placeholder="<html><body>... or paste raw code!</body></html>"
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

      {/* QR Code Demo Layout Placeholder */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>QR Matrix Generator</Text>
        <TextInput style={styles.input} value={qrText} onChangeText={setQrText} placeholder="Destination URL..." />
        
        <View style={styles.rowWrap}>
           {[1,2,3,4,5,11,13,14,16].map(id => (
              <TouchableOpacity key={`d${id}`} style={[styles.btnOutline, qrDesign === id && styles.btnActive]} onPress={() => setQrDesign(id)}>
                <Text style={[styles.btnOutlineText, qrDesign === id && styles.btnActiveText]}>Mode {id}</Text>
              </TouchableOpacity>
           ))}
        </View>

        <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
          <TextInput style={[styles.input, {flex: 1}]} value={fgColor} onChangeText={setFgColor} placeholder="FG #" />
          <TextInput style={[styles.input, {flex: 1}]} value={bgColor} onChangeText={setBgColor} placeholder="BG #" />
          <TextInput style={[styles.input, {flex: 1}]} value={gradColor} onChangeText={setGradColor} placeholder="Grad #" />
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={styles.btnSecondary} onPress={uploadLogo}>
             <Text style={styles.btnSecondaryText}>{logoBase64 ? '✓ Logo Attached' : '🖼️ Attach Dynamic Logo'}</Text>
          </TouchableOpacity>
          {logoBase64 && <TouchableOpacity style={styles.btnCancel} onPress={() => setLogoBase64(null)}><Text style={{color: 'red'}}>X</Text></TouchableOpacity>}
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={[styles.btnOutline, frame==='text' && styles.btnActive]} onPress={() => setFrame(frame === 'text' ? 'none' : 'text')}>
            <Text style={frame==='text'? styles.btnActiveText : styles.btnOutlineText}>Toggle Text Boundary</Text>
          </TouchableOpacity>
          {frame === 'text' && <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} value={frameText} onChangeText={setFrameText} />}
        </View>

        <View style={styles.qrContainer}>
           <QREngine 
             value={qrText} 
             design={qrDesign} 
             size={220} 
             fgColor={fgColor}
             bgColor={bgColor}
             gradColor={gradColor}
             logo={logoBase64}
             logoSizePct={logoSizePct}
             frame={frame}
             frameText={frameText}
             frameColor={frameColor}
             ecLevel={ecLevel}
             quietZone={quietZone}
           />
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
  input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 13, color: '#1f2937', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 8 },
  btnOutline: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1.5, borderColor: '#6366f1' },
  btnOutlineText: { color: '#6366f1', fontWeight: '600', fontSize: 13 },
  btnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  btnActiveText: { color: '#fff' },
  btnSecondary: { backgroundColor: '#f3f4f6', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, flex: 1 },
  btnSecondaryText: { color: '#4b5563', fontWeight: '600', textAlign: 'center' },
  btnCancel: { borderWidth: 1.5, borderColor: '#fca5a5', padding: 10, borderRadius: 8 },
  btnPrimary: { backgroundColor: '#6366f1', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  qrContainer: { alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 12, backgroundColor: '#fafafa' }
});

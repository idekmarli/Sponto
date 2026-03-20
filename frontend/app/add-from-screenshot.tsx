import React, { useState, useEffect } from 'react';
import { useTheme } from '../src/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows } from '../src/theme';
import { useCurrency } from '../src/currency';
import { api } from '../src/api';
import { ImageCropper } from '../src/components/ImageCropper';

// Compress a base64 image to reduce payload size for saving
async function compressForSave(uri: string): Promise<string> {
  try {
    // If it's a base64 data URI, manipulate it
    if (uri.startsWith('data:')) {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      return `data:image/jpeg;base64,${result.base64}`;
    }
    return uri;
  } catch {
    return uri; // Return original on error
  }
}

// ─── Types ───
interface ExtractedField {
  value: string | number | null;
  confidence: 'high' | 'medium' | 'low';
}

interface ExtractionResult {
  title: ExtractedField;
  brand: ExtractedField;
  listed_price: ExtractedField;
  size: ExtractedField;
  condition: ExtractedField;
  category: ExtractedField;
  color: ExtractedField;
}

type ScreenState = 'upload' | 'analyzing' | 'review';

// ─── Confidence Badge ───
function ConfidenceBadge({ level }: { level: string }) {
  const config = {
    high: { label: 'High confidence', color: colors.success, bg: colors.successLight },
    medium: { label: 'Review suggested', color: colors.warning, bg: colors.warningLight },
    low: { label: 'Needs review', color: colors.error, bg: colors.errorLight },
  }[level] || { label: 'Unknown', color: colors.textMuted, bg: colors.surfaceMuted };

  return (
    <View style={[styles.confidenceBadge, { backgroundColor: config.bg }]}>
      <View style={[styles.confidenceDot, { backgroundColor: config.color }]} />
      <Text style={[styles.confidenceText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// ─── Editable Field ───
function EditableField({
  label,
  value,
  confidence,
  onChangeText,
  keyboardType = 'default',
  prefix,
}: {
  label: string;
  value: string;
  confidence: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric';
  prefix?: string;
}) {
  const showReviewIndicator = confidence === 'low' || confidence === 'medium';
  
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {showReviewIndicator && <ConfidenceBadge level={confidence} />}
      </View>
      <View style={[styles.fieldInputWrap, showReviewIndicator && styles.fieldInputNeedsReview]}>
        {prefix && <Text style={styles.fieldPrefix}>{prefix}</Text>}
        <TextInput
          style={[styles.fieldInput, prefix && styles.fieldInputWithPrefix]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor={colors.textMuted}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        {showReviewIndicator && (
          <Feather name="edit-3" size={16} color={colors.warning} style={styles.editIcon} />
        )}
      </View>
    </View>
  );
}

// ─── Analyzing Animation ───
function AnalyzingState() {
  const [dots, setDots] = useState('');
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
    
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.analyzingContainer}>
      <Animated.View style={[styles.analyzingIcon, { transform: [{ scale: pulseAnim }] }]}>
        <Feather name="cpu" size={32} color={colors.brand} />
      </Animated.View>
      <Text style={styles.analyzingTitle}>Extracting listing data{dots}</Text>
      <Text style={styles.analyzingSubtitle}>Reading text from your screenshot</Text>
      
      <View style={styles.analyzingSteps}>
        <View style={styles.analyzingStep}>
          <Feather name="check-circle" size={16} color={colors.success} />
          <Text style={styles.analyzingStepText}>Image received</Text>
        </View>
        <View style={styles.analyzingStep}>
          <ActivityIndicator size="small" color={colors.brand} />
          <Text style={styles.analyzingStepText}>Running OCR extraction</Text>
        </View>
        <View style={[styles.analyzingStep, { opacity: 0.4 }]}>
          <Feather name="circle" size={16} color={colors.textMuted} />
          <Text style={styles.analyzingStepText}>Parsing fields</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Component ───
export default function AddFromScreenshotScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { formatAmount, currency } = useCurrency();

  // State
  const [screenState, setScreenState] = useState<ScreenState>('upload');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [listedPrice, setListedPrice] = useState('');
  const [size, setSize] = useState('');
  const [condition, setCondition] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');

  // Confidence levels
  const [confidences, setConfidences] = useState<Record<string, string>>({});
  
  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [originalFileUri, setOriginalFileUri] = useState<string | null>(null);

  // Pick images
  const pickImages = async () => {
    try {
      setError(null);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        
        if (!asset.base64) {
          setError('Failed to read image data. Please try again.');
          return;
        }
        
        // Store both the file URI (for cropping) and base64 (for display/analysis)
        const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
        setSelectedImages([base64Uri]);
        
        // Store the original file URI for cropping (needed on iOS)
        setOriginalFileUri(asset.uri);
        
        // Show crop option first before analysis
        setShowCropper(true);
      }
    } catch (e) {
      console.error('Image picker error:', e);
      setError('Failed to select image. Please try again.');
    }
  };
  
  // Handle cropped image and continue to analysis
  const handleCrop = async (croppedUri: string) => {
    setCroppedImage(croppedUri);
    setShowCropper(false);
    
    // Now analyze the cropped image
    await analyzeImages([croppedUri]);
  };
  
  // Skip crop and analyze original
  const skipCropAndAnalyze = () => {
    setShowCropper(false);
    if (selectedImages[0]) {
      analyzeImages(selectedImages);
    }
  };

  // Analyze images
  const analyzeImages = async (images: string[]) => {
    setScreenState('analyzing');
    setError(null);

    try {
      const response = await api.analyzeScreenshot(images);
      
      if (response.success) {
        setExtractedData(response.extracted_data);
        setDetectedPlatform(response.detected_platform);
        setRawText(response.raw_text || '');
        
        // Populate editable fields
        const data = response.extracted_data;
        setTitle(data.title?.value || '');
        setBrand(data.brand?.value || '');
        setListedPrice(data.listed_price?.value?.toString() || '');
        setSize(data.size?.value || '');
        setCondition(data.condition?.value || '');
        setCategory(data.category?.value || '');
        setColor(data.color?.value || '');
        
        // Store confidences
        setConfidences({
          title: data.title?.confidence || 'low',
          brand: data.brand?.confidence || 'low',
          listed_price: data.listed_price?.confidence || 'low',
          size: data.size?.confidence || 'low',
          condition: data.condition?.confidence || 'low',
          category: data.category?.confidence || 'low',
          color: data.color?.confidence || 'low',
        });
        
        setScreenState('review');
      } else {
        setError('Failed to extract data from screenshot');
        setScreenState('upload');
      }
    } catch (e) {
      console.error('Analysis error:', e);
      setError('Failed to analyze screenshot. Please try again.');
      setScreenState('upload');
    }
  };

  // Save to inventory
  const saveToInventory = async () => {
    if (saving) return;
    setSaving(true);

    try {
      // Use cropped image if available, otherwise use first selected image
      const rawPhoto = croppedImage || selectedImages[0];
      const photoToSave = rawPhoto ? await compressForSave(rawPhoto) : null;

      const itemData = {
        title: title.trim() || 'Untitled Item',
        brand: brand.trim(),
        category: category.trim(),
        size: size.trim(),
        condition: condition.trim(),
        purchase_price: parseFloat(purchasePrice) || 0,
        target_list_price: parseFloat(listedPrice) || 0,
        platforms: detectedPlatform ? [detectedPlatform.toLowerCase()] : [],
        color: color.trim(),
        status: 'sourced',
        date_acquired: new Date().toISOString().split('T')[0],
        notes: (notes.trim() ? notes.trim() + '\n\n' : '') + '[Extracted from screenshot]',
        photos: photoToSave ? [photoToSave] : [],
        is_draft: false,
      };

      await api.createItem(itemData);
      router.back();
    } catch (e) {
      console.error('Save error:', e);
      setError('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  // Open in Source Calculator
  const openInSourceCalc = () => {
    router.replace({
      pathname: '/source',
      params: {
        purchasePrice: purchasePrice || '0',
        expectedPrice: listedPrice || '0',
        platform: detectedPlatform || 'eBay',
      },
    });
  };

  // Save as draft
  const saveAsDraft = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const itemData = {
        title: title.trim() || 'Draft Item',
        brand: brand.trim(),
        category: category.trim(),
        size: size.trim(),
        condition: condition.trim(),
        purchase_price: parseFloat(purchasePrice) || 0,
        target_list_price: parseFloat(listedPrice) || 0,
        platforms: detectedPlatform ? [detectedPlatform.toLowerCase()] : [],
        status: 'sourced',
        date_acquired: new Date().toISOString().split('T')[0],
        color: color.trim(),
        notes: (notes.trim() ? notes.trim() + '\n\n' : '') + '[Draft - Extracted from screenshot]',
        photos: await (async () => {
          const raw = croppedImage || selectedImages[0];
          return raw ? [await compressForSave(raw)] : [];
        })(),
        is_draft: true,
      };

      await api.createItem(itemData);
      router.back();
    } catch (e) {
      console.error('Save draft error:', e);
      setError('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  // Reset
  const reset = () => {
    setScreenState('upload');
    setSelectedImages([]);
    setExtractedData(null);
    setDetectedPlatform(null);
    setError(null);
    setTitle('');
    setBrand('');
    setListedPrice('');
    setSize('');
    setCondition('');
    setCategory('');
    setColor('');
    setPurchasePrice('');
    setNotes('');
    setCroppedImage(null);
    setOriginalFileUri(null);
    setShowCropper(false);
  };

  // ─── Render Upload State ───
  const renderUploadState = () => (
    <View style={styles.uploadContainer}>
      <View style={styles.uploadHeader}>
        <View style={styles.uploadIconWrap}>
          <Feather name="image" size={28} color={colors.brand} />
        </View>
        <Text style={styles.uploadTitle}>Add from Screenshot</Text>
        <Text style={styles.uploadSubtitle}>
          Upload a screenshot from a marketplace listing and we'll extract the details automatically
        </Text>
      </View>

      <TouchableOpacity style={styles.uploadArea} onPress={pickImages} activeOpacity={0.7}>
        <View style={styles.uploadAreaInner}>
          <View style={styles.uploadAreaIcon}>
            <Feather name="upload-cloud" size={32} color={colors.textTertiary} />
          </View>
          <Text style={styles.uploadAreaTitle}>Tap to select screenshots</Text>
          <Text style={styles.uploadAreaHint}>You can select multiple images</Text>
        </View>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.supportedPlatforms}>
        <Text style={styles.supportedTitle}>Supported platforms</Text>
        <View style={styles.platformLogos}>
          {['Vinted', 'Depop', 'eBay', 'Poshmark', 'Vestiaire', 'Etsy'].map(p => (
            <View key={p} style={styles.platformTag}>
              <Text style={styles.platformTagText}>{p}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // ─── Render Review State ───
  const renderReviewState = () => (
    <ScrollView style={styles.reviewScroll} showsVerticalScrollIndicator={false}>
      {/* Screenshot/Cropped Image Preview */}
      {selectedImages[0] && (
        <View style={styles.screenshotPreview}>
          <Image 
            source={{ uri: croppedImage || selectedImages[0] }} 
            style={styles.screenshotImage} 
            resizeMode="cover" 
          />
          <View style={styles.screenshotOverlay}>
            {detectedPlatform && (
              <View style={styles.detectedPlatformBadge}>
                <Feather name="check-circle" size={12} color={colors.success} />
                <Text style={styles.detectedPlatformText}>Detected: {detectedPlatform}</Text>
              </View>
            )}
            <View style={styles.imageActions}>
              {!croppedImage && (
                <TouchableOpacity style={styles.cropImageBtn} onPress={() => setShowCropper(true)}>
                  <Feather name="crop" size={14} color={colors.textInverse} />
                  <Text style={styles.cropImageText}>Crop</Text>
                </TouchableOpacity>
              )}
              {croppedImage && (
                <View style={styles.croppedBadge}>
                  <Feather name="check" size={12} color={colors.success} />
                  <Text style={styles.croppedBadgeText}>Cropped</Text>
                </View>
              )}
              <TouchableOpacity style={styles.changeImageBtn} onPress={reset}>
                <Feather name="refresh-cw" size={14} color={colors.textInverse} />
                <Text style={styles.changeImageText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Extraction Summary */}
      <View style={styles.extractionSummary}>
        <Feather name="cpu" size={16} color={colors.success} />
        <Text style={styles.extractionSummaryText}>
          Extracted {Object.values(confidences).filter(c => c !== 'low').length} of 7 fields with confidence
        </Text>
      </View>

      {/* Editable Fields */}
      <View style={styles.fieldsSection}>
        <Text style={styles.sectionTitle}>Listing Details</Text>
        
        <EditableField
          label="Title"
          value={title}
          confidence={confidences.title}
          onChangeText={setTitle}
        />
        
        <EditableField
          label="Brand"
          value={brand}
          confidence={confidences.brand}
          onChangeText={setBrand}
        />

        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <EditableField
              label="Size"
              value={size}
              confidence={confidences.size}
              onChangeText={setSize}
            />
          </View>
          <View style={styles.fieldHalf}>
            <EditableField
              label="Condition"
              value={condition}
              confidence={confidences.condition}
              onChangeText={setCondition}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <EditableField
              label="Category"
              value={category}
              confidence={confidences.category}
              onChangeText={setCategory}
            />
          </View>
          <View style={styles.fieldHalf}>
            <EditableField
              label="Color"
              value={color}
              confidence={confidences.color}
              onChangeText={setColor}
            />
          </View>
        </View>
      </View>

      {/* Pricing Section */}
      <View style={styles.fieldsSection}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Listed Price</Text>
              <View style={styles.priceInputWrap}>
                <Text style={styles.pricePrefix}>{currency.symbol}</Text>
                <TextInput
                  style={styles.priceInput}
                  value={listedPrice}
                  onChangeText={setListedPrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              {confidences.listed_price !== 'high' && (
                <ConfidenceBadge level={confidences.listed_price || 'low'} />
              )}
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Your Buy Price</Text>
              <View style={styles.priceInputWrap}>
                <Text style={styles.pricePrefix}>{currency.symbol}</Text>
                <TextInput
                  style={styles.priceInput}
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <Text style={styles.priceHint}>What you'd pay</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Notes */}
      <View style={styles.fieldsSection}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes about this item..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Raw Text Toggle */}
      {rawText && (
        <TouchableOpacity style={styles.rawTextToggle}>
          <Feather name="file-text" size={14} color={colors.textTertiary} />
          <Text style={styles.rawTextToggleText}>View extracted text</Text>
          <Feather name="chevron-down" size={14} color={colors.textTertiary} />
        </TouchableOpacity>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, { paddingTop: insets.top + space[2] }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
            activeOpacity={0.6}
          >
            <Feather name="x" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {screenState === 'upload' ? 'Add from Screenshot' : 
             screenState === 'analyzing' ? 'Analyzing...' : 'Review & Save'}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Content */}
        {screenState === 'upload' && renderUploadState()}
        {screenState === 'analyzing' && <AnalyzingState />}
        {screenState === 'review' && renderReviewState()}

        {/* Actions (Review state only) */}
        {screenState === 'review' && (
          <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, space[4]) }]}>
            <TouchableOpacity style={styles.actionSecondary} onPress={saveAsDraft} disabled={saving}>
              <Text style={styles.actionSecondaryText}>Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTertiary} onPress={openInSourceCalc} disabled={saving}>
              <Feather name="zap" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionPrimary} onPress={saveToInventory} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Feather name="check" size={18} color={colors.textInverse} />
                  <Text style={styles.actionPrimaryText}>Save to Inventory</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Image Cropper Modal */}
        {(selectedImages[0] || originalFileUri) && (
          <ImageCropper
            visible={showCropper}
            imageUri={originalFileUri || selectedImages[0]}
            onClose={() => setShowCropper(false)}
            onCrop={handleCrop}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: space[4],
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },

  // Upload State
  uploadContainer: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  uploadHeader: {
    alignItems: 'center',
    marginBottom: space[6],
  },
  uploadIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[4],
  },
  uploadTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    marginBottom: space[2],
  },
  uploadSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    padding: space[8],
    marginBottom: space[5],
  },
  uploadAreaInner: {
    alignItems: 'center',
  },
  uploadAreaIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[4],
  },
  uploadAreaTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: space[1],
  },
  uploadAreaHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    padding: space[3],
    marginBottom: space[4],
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.error,
  },
  supportedPlatforms: {
    marginTop: 'auto',
    paddingBottom: space[8],
  },
  supportedTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: space[3],
    textAlign: 'center',
  },
  platformLogos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space[2],
  },
  platformTag: {
    paddingHorizontal: space[3],
    paddingVertical: space[1] + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  platformTagText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },

  // Analyzing State
  analyzingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  analyzingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[5],
  },
  analyzingTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: space[2],
  },
  analyzingSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: space[6],
  },
  analyzingSteps: {
    gap: space[3],
  },
  analyzingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  analyzingStepText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Review State
  reviewScroll: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  screenshotPreview: {
    height: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: space[4],
    position: 'relative',
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
  },
  screenshotOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space[3],
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  detectedPlatformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
  },
  detectedPlatformText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.textInverse,
  },
  imageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  cropImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    backgroundColor: colors.brand,
    paddingHorizontal: space[2] + 2,
    paddingVertical: space[1] + 2,
    borderRadius: radius.sm,
  },
  cropImageText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.textInverse,
  },
  croppedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    backgroundColor: colors.successLight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
  },
  croppedBadgeText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.success,
  },
  changeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  changeImageText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.textInverse,
  },
  extractionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: space[3],
    marginBottom: space[5],
  },
  extractionSummaryText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.success,
  },

  // Fields
  fieldsSection: {
    marginBottom: space[5],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: space[3],
  },
  fieldContainer: {
    marginBottom: space[4],
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[2],
  },
  fieldLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: spacing.inputHeight,
    paddingHorizontal: space[4],
    ...shadows.xs,
  },
  fieldInputNeedsReview: {
    borderWidth: 1,
    borderColor: colors.warning,
  },
  fieldPrefix: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.textTertiary,
    marginRight: space[1],
  },
  fieldInput: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  fieldInputWithPrefix: {
    marginLeft: 0,
  },
  editIcon: {
    marginLeft: space[2],
  },
  fieldRow: {
    flexDirection: 'row',
    gap: space[3],
  },
  fieldHalf: {
    flex: 1,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontFamily: fontFamily.semibold,
    fontSize: 10,
  },

  // Price Card
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  priceRow: {
    flexDirection: 'row',
    padding: spacing.cardPadding,
  },
  priceCol: {
    flex: 1,
    alignItems: 'center',
  },
  priceDivider: {
    width: 1,
    backgroundColor: colors.divider,
  },
  priceLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: space[2],
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: space[1],
    paddingLeft: space[1],
  },
  pricePrefix: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xl,
    color: colors.textTertiary,
    marginRight: space[1],
  },
  priceInput: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    padding: 0,
    paddingLeft: space[2],
    minWidth: 60,
    textAlign: 'left',
  },
  priceHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  // Notes
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space[4],
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    ...shadows.xs,
  },

  // Raw Text
  rawTextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingVertical: space[3],
  },
  rawTextToggleText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: spacing.screenPadding,
    paddingTop: space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  actionSecondary: {
    height: spacing.buttonHeight,
    paddingHorizontal: space[4],
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  actionSecondaryText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actionTertiary: {
    width: spacing.buttonHeight,
    height: spacing.buttonHeight,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  actionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    height: spacing.buttonHeight,
    borderRadius: radius.lg,
    backgroundColor: colors.brand,
    ...shadows.md,
  },
  actionPrimaryText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
});

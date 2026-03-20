import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors, space, fontFamily } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const IMAGE_CONTAINER_HEIGHT = SCREEN_HEIGHT * 0.55;
const HANDLE_SIZE = 44;
const MIN_CROP_SIZE = 60;

interface ImageCropperProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onCrop: (croppedUri: string) => void;
}

export function ImageCropper({ visible, imageUri, onClose, onCrop }: ImageCropperProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

  // Crop box state — keep both state and ref in sync so PanResponders always read current values
  const [cropBox, setCropBox] = useState({ x: 20, y: 20, width: 200, height: 200 });
  const cropBoxRef = useRef(cropBox);
  const imageLayoutRef = useRef(imageLayout);

  // Keep refs in sync with state
  useEffect(() => { cropBoxRef.current = cropBox; }, [cropBox]);
  useEffect(() => { imageLayoutRef.current = imageLayout; }, [imageLayout]);

  // Track gesture start position
  const startCropBox = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Reset crop box when image changes
  useEffect(() => {
    if (visible && imageLayout.width > 0) {
      const margin = 20;
      setCropBox({
        x: margin,
        y: margin,
        width: imageLayout.width - margin * 2,
        height: imageLayout.height - margin * 2,
      });
    }
  }, [visible, imageLayout]);

  const onImageLoad = useCallback((event: any) => {
    let width = 0, height = 0;

    if (event.nativeEvent?.source) {
      width = event.nativeEvent.source.width;
      height = event.nativeEvent.source.height;
    } else if (event.nativeEvent?.width) {
      width = event.nativeEvent.width;
      height = event.nativeEvent.height;
    } else {
      width = SCREEN_WIDTH;
      height = SCREEN_WIDTH;
    }

    setOriginalDimensions({ width, height });

    const containerWidth = SCREEN_WIDTH - 40;
    const containerHeight = IMAGE_CONTAINER_HEIGHT;
    const imageAspect = width / height;
    const containerAspect = containerWidth / containerHeight;

    let displayWidth, displayHeight;
    if (imageAspect > containerAspect) {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspect;
    } else {
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspect;
    }

    const offsetX = (containerWidth - displayWidth) / 2;
    const offsetY = (containerHeight - displayHeight) / 2;

    setImageLayout({
      width: displayWidth,
      height: displayHeight,
      x: offsetX,
      y: offsetY,
    });
  }, []);

  // Main crop box pan responder — reads from refs to avoid stale closures
  const boxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startCropBox.current = { ...cropBoxRef.current };
      },
      onPanResponderMove: (_, gesture) => {
        const layout = imageLayoutRef.current;
        const start = startCropBox.current;
        const newX = Math.max(0, Math.min(start.x + gesture.dx, layout.width - start.width));
        const newY = Math.max(0, Math.min(start.y + gesture.dy, layout.height - start.height));
        setCropBox(prev => ({ ...prev, x: newX, y: newY }));
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  // Corner pan responder factory — also reads from refs
  const createCornerResponder = (corner: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        startCropBox.current = { ...cropBoxRef.current };
      },
      onPanResponderMove: (_, gesture) => {
        const layout = imageLayoutRef.current;
        const start = startCropBox.current;
        let newBox = { ...start };

        switch (corner) {
          case 'topLeft': {
            const w = Math.max(MIN_CROP_SIZE, start.width - gesture.dx);
            const h = Math.max(MIN_CROP_SIZE, start.height - gesture.dy);
            const x = start.x + start.width - w;
            const y = start.y + start.height - h;
            if (x >= 0 && y >= 0) newBox = { x, y, width: w, height: h };
            break;
          }
          case 'topRight': {
            const w = Math.max(MIN_CROP_SIZE, start.width + gesture.dx);
            const h = Math.max(MIN_CROP_SIZE, start.height - gesture.dy);
            const y = start.y + start.height - h;
            if (y >= 0 && start.x + w <= layout.width) newBox = { ...start, y, width: w, height: h };
            break;
          }
          case 'bottomLeft': {
            const w = Math.max(MIN_CROP_SIZE, start.width - gesture.dx);
            const h = Math.max(MIN_CROP_SIZE, start.height + gesture.dy);
            const x = start.x + start.width - w;
            if (x >= 0 && start.y + h <= layout.height) newBox = { x, y: start.y, width: w, height: h };
            break;
          }
          case 'bottomRight': {
            const w = Math.max(MIN_CROP_SIZE, start.width + gesture.dx);
            const h = Math.max(MIN_CROP_SIZE, start.height + gesture.dy);
            if (start.x + w <= layout.width && start.y + h <= layout.height) newBox = { ...start, width: w, height: h };
            break;
          }
        }

        setCropBox(newBox);
      },
      onPanResponderRelease: () => {},
    });
  };

  const tlResponder = useRef(createCornerResponder('topLeft')).current;
  const trResponder = useRef(createCornerResponder('topRight')).current;
  const blResponder = useRef(createCornerResponder('bottomLeft')).current;
  const brResponder = useRef(createCornerResponder('bottomRight')).current;

  const handleCrop = async () => {
    if (!imageUri || originalDimensions.width === 0 || imageLayout.width === 0 || imageLayout.height === 0) return;

    setLoading(true);
    try {
      const scaleX = originalDimensions.width / imageLayout.width;
      const scaleY = originalDimensions.height / imageLayout.height;

      const cropRegion = {
        originX: Math.max(0, Math.round(cropBox.x * scaleX)),
        originY: Math.max(0, Math.round(cropBox.y * scaleY)),
        width: Math.min(originalDimensions.width, Math.round(cropBox.width * scaleX)),
        height: Math.min(originalDimensions.height, Math.round(cropBox.height * scaleY)),
      };

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop: cropRegion }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const croppedUri = result.base64
        ? `data:image/jpeg;base64,${result.base64}`
        : result.uri;

      onCrop(croppedUri);
    } catch (error) {
      console.error('Crop error:', error);
      // On error, just return original
      onCrop(imageUri);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header — uses safe area insets */}
        <View style={[styles.header, { paddingTop: insets.top + space[2] }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crop Product Image</Text>
          <View style={styles.headerBtn} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Feather name="move" size={16} color="rgba(255,255,255,0.6)" />
          <Text style={styles.instructionsText}>Drag to move • Drag corners to resize</Text>
        </View>

        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={[styles.image, { width: imageLayout.width, height: imageLayout.height }]}
            onLoad={onImageLoad}
            resizeMode="contain"
          />

          {imageLayout.width > 0 && (
            <>
              {/* Dark overlay outside crop area */}
              <View style={[styles.overlay, styles.overlayTop, { height: cropBox.y }]} />
              <View style={[styles.overlay, styles.overlayBottom, { top: cropBox.y + cropBox.height, height: imageLayout.height - cropBox.y - cropBox.height }]} />
              <View style={[styles.overlay, styles.overlayLeft, { top: cropBox.y, height: cropBox.height, width: cropBox.x }]} />
              <View style={[styles.overlay, styles.overlayRight, { top: cropBox.y, height: cropBox.height, left: cropBox.x + cropBox.width, width: imageLayout.width - cropBox.x - cropBox.width }]} />

              {/* Crop box */}
              <View
                style={[styles.cropBox, {
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.width,
                  height: cropBox.height,
                }]}
                {...boxPanResponder.panHandlers}
              >
                {/* Grid lines */}
                <View style={[styles.gridLine, styles.gridLineH, { top: '33%' }]} />
                <View style={[styles.gridLine, styles.gridLineH, { top: '66%' }]} />
                <View style={[styles.gridLine, styles.gridLineV, { left: '33%' }]} />
                <View style={[styles.gridLine, styles.gridLineV, { left: '66%' }]} />
              </View>

              {/* Corner handles */}
              <View
                style={[styles.handle, {
                  left: cropBox.x - HANDLE_SIZE/2,
                  top: cropBox.y - HANDLE_SIZE/2
                }]}
                {...tlResponder.panHandlers}
              />
              <View
                style={[styles.handle, {
                  left: cropBox.x + cropBox.width - HANDLE_SIZE/2,
                  top: cropBox.y - HANDLE_SIZE/2
                }]}
                {...trResponder.panHandlers}
              />
              <View
                style={[styles.handle, {
                  left: cropBox.x - HANDLE_SIZE/2,
                  top: cropBox.y + cropBox.height - HANDLE_SIZE/2
                }]}
                {...blResponder.panHandlers}
              />
              <View
                style={[styles.handle, {
                  left: cropBox.x + cropBox.width - HANDLE_SIZE/2,
                  top: cropBox.y + cropBox.height - HANDLE_SIZE/2
                }]}
                {...brResponder.panHandlers}
              />
            </>
          )}
        </View>

        {/* Actions — uses safe area insets for bottom */}
        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 20) + space[3] }]}>
          <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
            <Text style={styles.skipBtnText}>Skip Cropping</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cropBtn, loading && styles.cropBtnDisabled]}
            onPress={handleCrop}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="crop" size={18} color="#fff" />
                <Text style={styles.cropBtnText}>Crop & Continue</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: '#fff',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 16,
  },
  instructionsText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    backgroundColor: '#1a1a1a',
  },
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayTop: {
    top: 0,
    left: 0,
    right: 0,
  },
  overlayBottom: {
    left: 0,
    right: 0,
  },
  overlayLeft: {
    left: 0,
  },
  overlayRight: {},
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.brand,
    backgroundColor: 'transparent',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridLineH: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineV: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: colors.brand,
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: '#fff',
  },
  cropBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.brand,
  },
  cropBtnDisabled: {
    opacity: 0.6,
  },
  cropBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: '#fff',
  },
});

export default ImageCropper;

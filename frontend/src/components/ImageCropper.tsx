import React, { useState, useRef, useEffect } from 'react';
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
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const IMAGE_CONTAINER_HEIGHT = SCREEN_HEIGHT * 0.6;
const HANDLE_SIZE = 32;
const MIN_CROP_SIZE = 60;

interface ImageCropperProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onCrop: (croppedUri: string) => void;
}

export function ImageCropper({ visible, imageUri, onClose, onCrop }: ImageCropperProps) {
  const [loading, setLoading] = useState(false);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  
  // Crop box state
  const [cropBox, setCropBox] = useState({ x: 20, y: 20, width: 200, height: 200 });
  
  // Track gesture state
  const startCropBox = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const activeCorner = useRef<string | null>(null);

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

  const onImageLoad = (event: any) => {
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
  };

  // Main crop box pan responder (for moving)
  const boxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startCropBox.current = { ...cropBox };
        activeCorner.current = 'move';
      },
      onPanResponderMove: (_, gesture) => {
        const newX = Math.max(0, Math.min(
          startCropBox.current.x + gesture.dx,
          imageLayout.width - startCropBox.current.width
        ));
        const newY = Math.max(0, Math.min(
          startCropBox.current.y + gesture.dy,
          imageLayout.height - startCropBox.current.height
        ));
        setCropBox(prev => ({ ...prev, x: newX, y: newY }));
      },
      onPanResponderRelease: () => {
        activeCorner.current = null;
      },
    })
  ).current;

  // Corner pan responders
  const createCornerResponder = (corner: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        startCropBox.current = { ...cropBox };
        activeCorner.current = corner;
      },
      onPanResponderMove: (_, gesture) => {
        const start = startCropBox.current;
        let newBox = { ...start };
        
        switch (corner) {
          case 'topLeft':
            const newWidthTL = Math.max(MIN_CROP_SIZE, start.width - gesture.dx);
            const newHeightTL = Math.max(MIN_CROP_SIZE, start.height - gesture.dy);
            const newXTL = start.x + start.width - newWidthTL;
            const newYTL = start.y + start.height - newHeightTL;
            if (newXTL >= 0 && newYTL >= 0) {
              newBox = { x: newXTL, y: newYTL, width: newWidthTL, height: newHeightTL };
            }
            break;
          case 'topRight':
            const newWidthTR = Math.max(MIN_CROP_SIZE, start.width + gesture.dx);
            const newHeightTR = Math.max(MIN_CROP_SIZE, start.height - gesture.dy);
            const newYTR = start.y + start.height - newHeightTR;
            if (newYTR >= 0 && start.x + newWidthTR <= imageLayout.width) {
              newBox = { ...start, y: newYTR, width: newWidthTR, height: newHeightTR };
            }
            break;
          case 'bottomLeft':
            const newWidthBL = Math.max(MIN_CROP_SIZE, start.width - gesture.dx);
            const newHeightBL = Math.max(MIN_CROP_SIZE, start.height + gesture.dy);
            const newXBL = start.x + start.width - newWidthBL;
            if (newXBL >= 0 && start.y + newHeightBL <= imageLayout.height) {
              newBox = { x: newXBL, y: start.y, width: newWidthBL, height: newHeightBL };
            }
            break;
          case 'bottomRight':
            const newWidthBR = Math.max(MIN_CROP_SIZE, start.width + gesture.dx);
            const newHeightBR = Math.max(MIN_CROP_SIZE, start.height + gesture.dy);
            if (start.x + newWidthBR <= imageLayout.width && start.y + newHeightBR <= imageLayout.height) {
              newBox = { ...start, width: newWidthBR, height: newHeightBR };
            }
            break;
        }
        
        setCropBox(newBox);
      },
      onPanResponderRelease: () => {
        activeCorner.current = null;
      },
    });
  };

  const tlResponder = useRef(createCornerResponder('topLeft')).current;
  const trResponder = useRef(createCornerResponder('topRight')).current;
  const blResponder = useRef(createCornerResponder('bottomLeft')).current;
  const brResponder = useRef(createCornerResponder('bottomRight')).current;

  const handleCrop = async () => {
    if (!imageUri || originalDimensions.width === 0) return;
    
    setLoading(true);
    try {
      // Calculate scale factor
      const scaleX = originalDimensions.width / imageLayout.width;
      const scaleY = originalDimensions.height / imageLayout.height;
      
      // Convert displayed crop box to original image coordinates
      const cropRegion = {
        originX: Math.round(cropBox.x * scaleX),
        originY: Math.round(cropBox.y * scaleY),
        width: Math.round(cropBox.width * scaleX),
        height: Math.round(cropBox.height * scaleY),
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
        {/* Header */}
        <View style={styles.header}>
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
              
              {/* Corner handles - positioned outside the crop box for easier grabbing */}
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

        {/* Actions */}
        <View style={styles.actions}>
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
    paddingTop: 60,
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
    paddingVertical: 24,
    paddingBottom: 40,
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

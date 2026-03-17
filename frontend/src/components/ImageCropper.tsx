import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_PADDING = 24;
const INITIAL_SIZE = 200;

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
  
  // Crop box state (position and size relative to container)
  const [cropBox, setCropBox] = useState({
    x: 50,
    y: 50,
    width: INITIAL_SIZE,
    height: INITIAL_SIZE,
  });
  
  // Track which handle is being dragged
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  
  // Create pan responder for the crop box
  const boxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setActiveHandle('move');
      },
      onPanResponderMove: (_, gestureState) => {
        setCropBox(prev => {
          const newX = Math.max(0, Math.min(prev.x + gestureState.dx, imageLayout.width - prev.width));
          const newY = Math.max(0, Math.min(prev.y + gestureState.dy, imageLayout.height - prev.height));
          return { ...prev, x: newX, y: newY };
        });
      },
      onPanResponderRelease: () => {
        setActiveHandle(null);
      },
    })
  ).current;

  // Create pan responder for resize handles
  const createResizePanResponder = (corner: string) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setActiveHandle(corner);
      },
      onPanResponderMove: (_, gestureState) => {
        setCropBox(prev => {
          let newBox = { ...prev };
          const minSize = 50;
          
          switch (corner) {
            case 'bottomRight':
              newBox.width = Math.max(minSize, Math.min(prev.width + gestureState.dx, imageLayout.width - prev.x));
              newBox.height = Math.max(minSize, Math.min(prev.height + gestureState.dy, imageLayout.height - prev.y));
              break;
            case 'bottomLeft':
              const newWidthBL = Math.max(minSize, prev.width - gestureState.dx);
              const newXBL = prev.x + (prev.width - newWidthBL);
              if (newXBL >= 0) {
                newBox.width = newWidthBL;
                newBox.x = newXBL;
              }
              newBox.height = Math.max(minSize, Math.min(prev.height + gestureState.dy, imageLayout.height - prev.y));
              break;
            case 'topRight':
              newBox.width = Math.max(minSize, Math.min(prev.width + gestureState.dx, imageLayout.width - prev.x));
              const newHeightTR = Math.max(minSize, prev.height - gestureState.dy);
              const newYTR = prev.y + (prev.height - newHeightTR);
              if (newYTR >= 0) {
                newBox.height = newHeightTR;
                newBox.y = newYTR;
              }
              break;
            case 'topLeft':
              const newWidthTL = Math.max(minSize, prev.width - gestureState.dx);
              const newXTL = prev.x + (prev.width - newWidthTL);
              const newHeightTL = Math.max(minSize, prev.height - gestureState.dy);
              const newYTL = prev.y + (prev.height - newHeightTL);
              if (newXTL >= 0 && newYTL >= 0) {
                newBox.width = newWidthTL;
                newBox.x = newXTL;
                newBox.height = newHeightTL;
                newBox.y = newYTL;
              }
              break;
          }
          
          return newBox;
        });
      },
      onPanResponderRelease: () => {
        setActiveHandle(null);
      },
    });

  const brPanResponder = useRef(createResizePanResponder('bottomRight')).current;
  const blPanResponder = useRef(createResizePanResponder('bottomLeft')).current;
  const trPanResponder = useRef(createResizePanResponder('topRight')).current;
  const tlPanResponder = useRef(createResizePanResponder('topLeft')).current;

  // Calculate displayed image dimensions maintaining aspect ratio
  const onImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    setOriginalDimensions({ width, height });
    
    const maxWidth = SCREEN_WIDTH - CROP_PADDING * 2;
    const maxHeight = SCREEN_HEIGHT * 0.6;
    
    let displayWidth = width;
    let displayHeight = height;
    
    if (width > maxWidth) {
      displayWidth = maxWidth;
      displayHeight = (height / width) * maxWidth;
    }
    
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = (width / height) * maxHeight;
    }
    
    setImageLayout({
      width: displayWidth,
      height: displayHeight,
      x: (SCREEN_WIDTH - displayWidth) / 2,
      y: 0,
    });
    
    // Center the initial crop box
    setCropBox({
      x: (displayWidth - INITIAL_SIZE) / 2,
      y: (displayHeight - INITIAL_SIZE) / 2,
      width: INITIAL_SIZE,
      height: INITIAL_SIZE,
    });
  };

  const handleCrop = async () => {
    if (!originalDimensions.width || !originalDimensions.height) return;
    
    setLoading(true);
    
    try {
      // Convert displayed coordinates to original image coordinates
      const scaleX = originalDimensions.width / imageLayout.width;
      const scaleY = originalDimensions.height / imageLayout.height;
      
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
      
      const base64Uri = `data:image/jpeg;base64,${result.base64}`;
      onCrop(base64Uri);
    } catch (error) {
      console.error('Crop error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
            <Feather name="x" size={20} color={colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crop Product Image</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Feather name="move" size={14} color={colors.textMuted} />
          <Text style={styles.instructionsText}>Drag to move • Drag corners to resize</Text>
        </View>

        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={{
              width: imageLayout.width || SCREEN_WIDTH - CROP_PADDING * 2,
              height: imageLayout.height || 300,
            }}
            resizeMode="contain"
            onLoad={onImageLoad}
          />
          
          {/* Overlay masks */}
          {imageLayout.width > 0 && (
            <>
              {/* Top mask */}
              <View style={[styles.mask, { top: 0, left: 0, right: 0, height: cropBox.y }]} />
              {/* Bottom mask */}
              <View style={[styles.mask, { top: cropBox.y + cropBox.height, left: 0, right: 0, bottom: 0 }]} />
              {/* Left mask */}
              <View style={[styles.mask, { top: cropBox.y, left: 0, width: cropBox.x, height: cropBox.height }]} />
              {/* Right mask */}
              <View style={[styles.mask, { top: cropBox.y, right: 0, left: cropBox.x + cropBox.width, height: cropBox.height }]} />
              
              {/* Crop box */}
              <View
                style={[
                  styles.cropBox,
                  {
                    left: cropBox.x,
                    top: cropBox.y,
                    width: cropBox.width,
                    height: cropBox.height,
                  },
                ]}
                {...boxPanResponder.panHandlers}
              >
                {/* Grid lines */}
                <View style={[styles.gridLine, styles.gridLineH, { top: '33%' }]} />
                <View style={[styles.gridLine, styles.gridLineH, { top: '66%' }]} />
                <View style={[styles.gridLine, styles.gridLineV, { left: '33%' }]} />
                <View style={[styles.gridLine, styles.gridLineV, { left: '66%' }]} />
                
                {/* Corner handles */}
                <View style={[styles.handle, styles.handleTL]} {...tlPanResponder.panHandlers} />
                <View style={[styles.handle, styles.handleTR]} {...trPanResponder.panHandlers} />
                <View style={[styles.handle, styles.handleBL]} {...blPanResponder.panHandlers} />
                <View style={[styles.handle, styles.handleBR]} {...brPanResponder.panHandlers} />
              </View>
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
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <>
                <Feather name="crop" size={18} color={colors.textInverse} />
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
    paddingHorizontal: spacing.screenPadding,
    paddingTop: space[12],
    paddingBottom: space[4],
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
    fontSize: fontSize.lg,
    color: colors.textInverse,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingBottom: space[4],
  },
  instructionsText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: '#fff',
  },
  handleTL: {
    top: -12,
    left: -12,
  },
  handleTR: {
    top: -12,
    right: -12,
  },
  handleBL: {
    bottom: -12,
    left: -12,
  },
  handleBR: {
    bottom: -12,
    right: -12,
  },
  actions: {
    flexDirection: 'row',
    gap: space[3],
    paddingHorizontal: spacing.screenPadding,
    paddingTop: space[4],
    paddingBottom: space[10],
  },
  skipBtn: {
    height: spacing.buttonHeight,
    paddingHorizontal: space[5],
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  cropBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    height: spacing.buttonHeight,
    borderRadius: radius.lg,
    backgroundColor: colors.brand,
  },
  cropBtnDisabled: {
    opacity: 0.6,
  },
  cropBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
});

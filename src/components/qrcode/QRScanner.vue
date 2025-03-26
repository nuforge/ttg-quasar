<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import jsQR from 'jsqr';

const video = ref<HTMLVideoElement | null>(null);
const result = ref<string | null>(null);
const isCameraActive = ref(false);
let stream: MediaStream | null = null;
const uploadedFile = ref<File | null>(null);

// Camera Methods
const startCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    if (video.value) {
      video.value.srcObject = stream;

      // Wait for video metadata to load
      await new Promise((resolve) => {
        video.value!.onloadedmetadata = resolve;
      });

      // Ensure video dimensions
      video.value.width = video.value.videoWidth;
      video.value.height = video.value.videoHeight;

      isCameraActive.value = true;
      scanFrame();
    }
  } catch (err) {
    console.error('Camera error:', err);
  }
};

const stopCamera = () => {
  stream?.getTracks().forEach(track => track.stop());
  isCameraActive.value = false;
};

const toggleCamera = async () => {
  if (isCameraActive.value) {
    stopCamera();
  } else {
    await startCamera();
  }
};

// QR Scanning Loop
const scanFrame = () => {
  if (!video.value || !isCameraActive.value ||
    video.value.readyState < HTMLMediaElement.HAVE_METADATA) return;

  // Add dimension validation
  if (video.value.videoWidth === 0 || video.value.videoHeight === 0) {
    return requestAnimationFrame(scanFrame);
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  canvas.width = video.value.videoWidth;
  canvas.height = video.value.videoHeight;
  context.drawImage(video.value, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',  // Try both normal/inverted colors
  });
  if (code) {
    result.value = code.data;
    stopCamera();
  } else {
    requestAnimationFrame(scanFrame);
  }
};

// File Upload Handler
const handleFileUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) result.value = code.data;
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

// Cleanup
onUnmounted(() => {
  stopCamera();
});
</script>
<template>
  <div>
    <!-- Camera Preview -->
    <video ref="video" autoplay playsinline width="640" height="480"></video>

    <!-- Scan Result -->
    <div v-if="result">{{ result }}</div>

    <!-- Toggle Camera -->
    <q-btn @click="toggleCamera" :label="isCameraActive ? 'Stop' : 'Start'" />

    <!-- File Upload -->
    <q-file label="Upload QR Image" v-model="uploadedFile" @update:model-value="handleFileUpload" accept="image/*" />
  </div>
</template>

<style scoped>
video {
  width: 100%;
  max-width: 500px;
  border: 2px solid #ccc;
  display: block;
  /* Removes extra spacing */
  background: black;
  /* Shows video area even when empty */
}
</style>

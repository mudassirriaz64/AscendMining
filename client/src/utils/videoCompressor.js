import toast from 'react-hot-toast';

export const compressVideo = (file) => {
  return new Promise((resolve) => {
    // If the file is smaller than 2MB, no need to compress it
    if (file.size <= 2 * 1024 * 1024) {
      resolve(file);
      return;
    }

    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    
    const toastId = toast.loading('Compressing video to save bandwidth...');

    video.onloadedmetadata = () => {
      // Max resolution width/height: 640px
      const maxDim = 640;
      let width = video.videoWidth;
      let height = video.videoHeight;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height / width) * maxDim);
          width = maxDim;
        } else {
          width = Math.round((width / height) * maxDim);
          height = maxDim;
        }
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Capture at 24 frames per second
      const stream = canvas.captureStream(24);
      
      // Try capturing audio track if audio context is allowed
      let audioCtx = null;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        
        const audioTrack = dest.stream.getAudioTracks()[0];
        if (audioTrack) {
          stream.addTrack(audioTrack);
        }
      } catch (audioErr) {
        console.warn('Audio capture failed, recording video track only:', audioErr);
      }
      
      let options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 800000 };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm', videoBitsPerSecond: 800000 };
      }
      
      try {
        const mediaRecorder = new MediaRecorder(stream, options);
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          if (audioCtx) {
            audioCtx.close().catch(() => {});
          }
          const blob = new Blob(chunks, { type: 'video/webm' });
          toast.dismiss(toastId);
          if (blob.size >= file.size) {
            // Keep original if compressed result is not smaller
            resolve(file);
            return;
          }
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webm", {
            type: 'video/webm',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        };
        
        video.muted = false;
        video.volume = 0.001; // make it quiet
        
        video.playbackRate = 2.0; // compress at 2x playback speed
        video.play();
        mediaRecorder.start();
        
        const drawFrame = () => {
          if (video.paused || video.ended) {
            mediaRecorder.stop();
            URL.revokeObjectURL(video.src);
            return;
          }
          ctx.drawImage(video, 0, 0, width, height);
          if (!video.ended) {
            setTimeout(drawFrame, 41); // ~24 FPS
          }
        };
        
        drawFrame();
      } catch (recorderErr) {
        console.warn('MediaRecorder failed, uploading original video file', recorderErr);
        toast.dismiss(toastId);
        if (audioCtx) audioCtx.close().catch(() => {});
        resolve(file);
      }
    };
    
    video.onerror = (err) => {
      console.warn('Video element load failed, uploading original video file', err);
      toast.dismiss(toastId);
      resolve(file);
    };
  });
};

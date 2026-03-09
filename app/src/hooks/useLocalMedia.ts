import { useState, useRef, useCallback, useEffect } from 'react';

export interface LocalMediaState {
  localStream: MediaStream | null;
  micEnabled: boolean;
  camEnabled: boolean;
  isScreensharing: boolean;
  toggleMic: () => void;
  toggleCam: () => void;
  startScreenshare: () => Promise<void>;
  stopScreenshare: () => void;
  error: string | null;
}

export function useLocalMedia(): LocalMediaState {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [isScreensharing, setIsScreensharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const camStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let stream: MediaStream;
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((s) => {
        stream = s;
        camStreamRef.current = s;
        setLocalStream(s);
      })
      .catch((err: Error) => {
        setError(`Media access denied: ${err.message}`);
        // Try audio only
        navigator.mediaDevices
          .getUserMedia({ audio: true, video: false })
          .then((s) => {
            stream = s;
            camStreamRef.current = s;
            setLocalStream(s);
            setCamEnabled(false);
          })
          .catch(() => setError('Could not access microphone.'));
      });

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleMic = useCallback(() => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach((t) => {
      t.enabled = !t.enabled;
    });
    setMicEnabled((prev) => !prev);
  }, [localStream]);

  const toggleCam = useCallback(() => {
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();
    videoTracks.forEach((t) => {
      t.enabled = !t.enabled;
    });
    setCamEnabled((prev) => !prev);
  }, [localStream]);

  const startScreenshare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screenStreamRef.current = screenStream;

      // Build a composite stream: screen video + cam audio
      const audioTracks = camStreamRef.current?.getAudioTracks() ?? [];
      const compositeStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...audioTracks,
      ]);

      setLocalStream(compositeStream);
      setIsScreensharing(true);

      // Auto-stop when user ends share via browser UI
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenshareInternal();
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Screenshare failed: ${message}`);
    }
  }, []);

  const stopScreenshareInternal = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    if (camStreamRef.current) {
      setLocalStream(camStreamRef.current);
    }
    setIsScreensharing(false);
  }, []);

  const stopScreenshare = useCallback(() => {
    stopScreenshareInternal();
  }, [stopScreenshareInternal]);

  return {
    localStream,
    micEnabled,
    camEnabled,
    isScreensharing,
    toggleMic,
    toggleCam,
    startScreenshare,
    stopScreenshare,
    error,
  };
}

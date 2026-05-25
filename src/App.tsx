import React, { useState, useRef, useEffect } from 'react';
import { 
  Tv, Circle, StopCircle, Play, ExternalLink, Shield, 
  Volume2, VolumeX, RotateCw, Camera, Download, Trash2, 
  Eye, Monitor, Wifi, Radio, Sliders, Sun, EyeOff, Layout
} from 'lucide-react';

interface VideoEvent {
  id: string;
  title: string;
  date: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
}

interface PhotoEvent {
  id: string;
  title: string;
  date: string;
  url: string;
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [recordTime, setRecordTime] = useState(0);
  const [nightVision, setNightVision] = useState(false);
  const [activeChannel, setActiveChannel] = useState('kam-broadcast-1');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  
  const [recordedEvents, setRecordedEvents] = useState<VideoEvent[]>([]);
  const [snappedPhotos, setSnappedPhotos] = useState<PhotoEvent[]>([]);
  const [activeArchiveTab, setActiveArchiveTab] = useState<'videos' | 'photos'>('videos');
  const [flashActive, setFlashActive] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEvent | null>(null);

  // Recording timer increment
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize secure webcam or use our custom camouflage loop
  const initCamera = async (mode: 'user' | 'environment') => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = "";
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: mode, 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
        }, 
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(() => setIsVideoPlaying(true))
            .catch(() => setIsVideoPlaying(false));
        };
      }
    } catch (err) {
      console.warn("Hardware camera failed, loading high-res fallback streaming loop:", err);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = "https://assets.mixkit.co/videos/preview/mixkit-security-camera-of-a-parking-lot-at-night-34440-large.mp4";
        videoRef.current.loop = true;
        videoRef.current.muted = true;
        videoRef.current.oncanplay = () => {
          videoRef.current?.play()
            .then(() => setIsVideoPlaying(true))
            .catch(() => setIsVideoPlaying(false));
        };
      }
      setStream(null);
    }
  };

  useEffect(() => {
    initCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleSwitchCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (isLive) {
      await initCamera(nextMode);
    }
  };

  const toggleStream = async () => {
    if (isLive) {
      if (isRecording) {
        stopRecording();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = "";
      }
      setStream(null);
      setIsLive(false);
      setIsVideoPlaying(false);
    } else {
      setIsLive(true);
      await initCamera(facingMode);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const startRecording = () => {
    try {
      chunksRef.current = [];
      const startTimeRef = Date.now();
      
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const drawFrames = () => {
        ctx.fillStyle = nightVision ? '#051a05' : '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          if (nightVision) {
            // Apply night vision filter
            ctx.fillStyle = 'rgba(0, 255, 100, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }

        // HUD overlay on recording
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(40, 40, 450, 90);
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 40, 450, 90);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('KAMTV COLD RECORDER UPLINK', 60, 65);
        ctx.fillStyle = '#00ff66';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('SOURCE: STANDALONE DIGITAL LINK', 60, 85);
        ctx.fillText(`TIME: ${new Date().toISOString()}`, 60, 105);

        animationRef.current = requestAnimationFrame(drawFrames);
      };

      drawFrames();

      // @ts-ignore
      const canvasStream = canvas.captureStream ? canvas.captureStream(30) : (canvas as any).captureStream(30);
      const recordingStream = new MediaStream();
      canvasStream.getVideoTracks().forEach((track: any) => recordingStream.addTrack(track));

      const mediaRecorder = new MediaRecorder(recordingStream, { mimeType: 'video/webm' });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        const newEvent: VideoEvent = {
          id: Date.now().toString(),
          title: `KamTV Local Recording - ${new Date().toLocaleTimeString()}`,
          date: new Date().toLocaleDateString(),
          duration: formatTime(recordTime || 1),
          thumbnail: 'https://images.unsplash.com/photo-1542281200-45a501613045?w=200',
          videoUrl: url
        };
        setRecordedEvents(prev => [newEvent, ...prev]);
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 150);

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      if (nightVision) {
        ctx.fillStyle = 'rgba(0, 255, 100, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      const dataUrl = canvas.toDataURL('image/jpeg');
      const newPhoto: PhotoEvent = {
        id: Date.now().toString(),
        title: `HQ Snapshot - ${new Date().toLocaleTimeString()}`,
        date: new Date().toLocaleDateString(),
        url: dataUrl
      };
      setSnappedPhotos(prev => [newPhoto, ...prev]);
    }
  };

  const deletePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSnappedPhotos(prev => prev.filter(p => p.id !== id));
    if (selectedPhoto?.id === id) {
      setSelectedPhoto(null);
    }
  };

  const deleteVideo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecordedEvents(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0e160e] text-white flex flex-col items-center p-3 sm:p-6 md:p-12 relative overflow-hidden font-mono selection:bg-green-600 selection:text-black">
      {/* Immersive Military Camouflage Background */}
      <div 
        className="absolute inset-0 opacity-[0.12] pointer-events-none bg-cover bg-center" 
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/camo.png")' }} 
      />
      
      {/* Tactical Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none tactical-grid" />

      {/* Main Container */}
      <div className="w-full max-w-[1550px] bg-[#142214]/90 border-[4px] border-[#2c4e2c] rounded-3xl p-4 sm:p-8 shadow-2xl relative z-10 flex flex-col gap-6 military-bevel">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b-2 border-emerald-900/40 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-950/80 border-2 border-green-500 rounded-xl flex items-center justify-center animate-pulse">
              <Tv className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-green-400 uppercase">KAMTV</h1>
              <p className="text-[10px] text-green-500/70 tracking-widest uppercase">STANDALONE STREAMING NODE // ALPHA LIVE</p>
            </div>
          </div>

          {/* Tactical Telemetry */}
          <div className="flex flex-wrap items-center gap-3 bg-black/45 p-3 rounded-lg border border-green-950">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
              <span className="text-xs font-bold text-green-400">SIGNAL: STRONG</span>
            </div>
            <div className="h-4 w-[1px] bg-green-900" />
            <div className="text-xs text-green-400/80">
              UPLINK: <span className="text-white font-bold">KAM-TV.ONRENDER.COM</span>
            </div>
          </div>
        </div>

        {/* Content Area split in Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Channels List */}
          <div className="lg:col-span-3 flex flex-col gap-4 bg-black/40 p-4 rounded-2xl border border-green-950">
            <div className="flex items-center gap-2 text-green-400 border-b border-green-950 pb-2">
              <Radio className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider">SECURE FEED CHANNELS</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { id: 'kam-broadcast-1', label: 'KamTV Main Feed', desc: 'Secure Server Uplink 01' },
                { id: 'kam-aux-2', label: 'Tactical Camera Loop', desc: 'Hardware Backup Feeder' },
                { id: 'kam-satellite-3', label: 'Weather & Satellite Radar', desc: 'External Feed Relay' },
              ].map((chan) => (
                <button
                  key={chan.id}
                  onClick={() => {
                    setActiveChannel(chan.id);
                    initCamera(facingMode);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    activeChannel === chan.id 
                    ? 'bg-green-950/60 border-green-500 text-green-400 font-bold' 
                    : 'bg-black/30 border-green-950/40 text-green-600/60 hover:text-green-400 hover:border-green-800'
                  }`}
                >
                  <p className="text-xs uppercase font-extrabold tracking-wide">{chan.label}</p>
                  <p className="text-[9px] opacity-70 mt-0.5">{chan.desc}</p>
                </button>
              ))}
            </div>

            {/* Quick Calibration sliders */}
            <div className="mt-4 border-t border-green-950 pt-4 space-y-3">
              <div className="flex items-center gap-2 text-green-500 text-xs font-bold">
                <Sliders className="w-4 h-4" />
                <span>RECEIVER CALIBRATION</span>
              </div>
              <div className="space-y-2 text-[10px]">
                <div>
                  <div className="flex justify-between text-green-600 mb-1">
                    <span>SIGNAL INTERPOLATION</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-green-950/60 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[100%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-green-600 mb-1">
                    <span>BAND STRENGTH</span>
                    <span>88%</span>
                  </div>
                  <div className="w-full bg-green-950/60 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[88%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column: Live Player with Camouflage styling */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-black border-4 border-green-800 rounded-3xl overflow-hidden aspect-video relative flex items-center justify-center group shadow-2xl">
              
              {/* Outer HUD indicators */}
              <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-black/75 px-3 py-1.5 rounded-md border border-red-500/30">
                <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-[10px] uppercase font-bold text-white tracking-widest">
                  {isRecording ? `REC ${formatTime(recordTime)}` : 'RECEIVING'}
                </span>
              </div>

              {/* Secure Stream Tag */}
              <div className="absolute top-4 right-4 z-50 bg-black/85 px-3 py-1.5 rounded-md border border-green-500/30 text-[9px] font-black uppercase text-green-400 tracking-wider">
                KAMTV // ALPHA-STREAM
              </div>

              {/* Night Vision Layer */}
              <div className={`absolute inset-0 pointer-events-none z-30 transition-all duration-300 ${nightVision ? 'bg-green-500/20 mix-blend-color' : 'bg-transparent'}`} />

              {/* Screen Flash Transition */}
              {flashActive && (
                <div className="absolute inset-0 bg-white z-50 pointer-events-none" />
              )}

              {/* Live Active Feed */}
              <video 
                ref={videoRef}
                className={`w-full h-full object-cover transition-all ${nightVision ? 'brightness-125 contrast-150 saturate-50 hue-rotate-60' : ''}`}
                playsInline
                muted={isMuted}
              />

              {/* Overlay camouflage placeholder if Not Live */}
              {!isLive && (
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-cover bg-center"
                  style={{ backgroundImage: 'linear-gradient(rgba(13, 26, 13, 0.88), rgba(13, 26, 13, 0.88)), url("https://www.transparenttextures.com/patterns/camo.png")' }}
                >
                  <Tv className="w-16 h-16 text-green-400/30 mb-2 animate-bounce" />
                  <p className="text-sm font-black text-green-400 uppercase tracking-widest">RECEIVER DISCONNECTED</p>
                  <p className="text-[10px] text-green-600 mt-1 uppercase">TAP ACTIVATE TRANSMISSION TO STABILIZE SIGNALS</p>
                </div>
              )}
            </div>

            {/* Tactical Control Bar with unique camouflage container background */}
            <div className="flex flex-wrap items-center justify-center gap-3 bg-gradient-to-r from-[#121f12] to-[#1c331c] p-4 rounded-2xl border border-green-950">
              <button 
                onClick={toggleStream}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  isLive 
                  ? 'bg-red-950/40 border border-red-800 text-red-400 hover:bg-red-900/40' 
                  : 'bg-green-500 text-black font-black hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                }`}
              >
                <Monitor className="w-4 h-4" />
                {isLive ? 'KILL STREAM' : 'ACTIVATE STREAM'}
              </button>

              <button 
                onClick={handleSwitchCamera}
                disabled={!isLive}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider bg-black/40 border border-green-900 text-green-400 rounded-xl hover:bg-green-950/50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                SWAP SENSOR
              </button>

              <button 
                onClick={takeSnapshot}
                disabled={!isLive}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider bg-black/40 border border-green-900 text-green-400 rounded-xl hover:bg-green-950/50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                SNAP RES
              </button>

              <button 
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!isLive}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
                  isRecording 
                  ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                  : 'bg-black/45 border border-red-900/50 text-red-500 hover:bg-red-950/50'
                }`}
              >
                <Circle className="w-3.5 h-3.5 fill-red-500" />
                {isRecording ? 'STOP REC' : 'LIVE RECORD'}
              </button>

              <button 
                onClick={() => setNightVision(!nightVision)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  nightVision 
                  ? 'bg-green-500 text-black font-black' 
                  : 'bg-black/40 border border-green-900 text-green-500'
                }`}
              >
                {nightVision ? <Sun className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                NV FILTER
              </button>

              <button 
                onClick={toggleMute}
                disabled={!isLive}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider bg-black/40 border border-green-900 text-green-400 rounded-xl hover:bg-green-950/50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
                {isMuted ? 'UNMUTE' : 'MUTE AUDIO'}
              </button>
            </div>
          </div>

          {/* Right Column: Local Tactical Logs (Captured items) */}
          <div className="lg:col-span-3 flex flex-col gap-4 bg-black/40 p-4 rounded-2xl border border-green-950">
            <div className="flex items-center justify-between border-b border-green-950 pb-2">
              <span className="text-xs font-black text-green-400 uppercase tracking-widest">TACTICAL ARCHIVES</span>
              
              <div className="flex gap-1.5 bg-black/80 px-2 py-1 rounded-lg border border-green-950">
                <button 
                  onClick={() => setActiveArchiveTab('videos')}
                  className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-wider transition-all ${activeArchiveTab === 'videos' ? 'bg-green-600 text-black' : 'text-green-500 hover:text-green-400'}`}
                >
                  VIDS
                </button>
                <button 
                  onClick={() => setActiveArchiveTab('photos')}
                  className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-wider transition-all ${activeArchiveTab === 'photos' ? 'bg-green-600 text-black' : 'text-green-500 hover:text-green-400'}`}
                >
                  PHOTOS
                </button>
              </div>
            </div>

            {/* Dynamic rendering */}
            {activeArchiveTab === 'videos' ? (
              <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3 custom-scrollbar pr-1">
                {recordedEvents.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center opacity-45">
                    <StopCircle className="w-10 h-10 text-green-800 mb-2" />
                    <p className="text-[10px] uppercase font-bold text-green-700">NO LOCAL CAPTURES</p>
                  </div>
                ) : (
                  recordedEvents.map((vid) => (
                    <div key={vid.id} className="bg-black/60 p-2.5 rounded-lg border border-green-950 flex flex-col gap-2 relative group hover:border-green-600 transition-all">
                      <div className="flex gap-3">
                        <img src={vid.thumbnail} alt="" className="w-16 h-12 object-cover rounded-md border border-green-900" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase font-black text-white truncate">{vid.title}</p>
                          <p className="text-[8px] text-green-500 font-bold mt-0.5">{vid.date} // {vid.duration}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-green-950/60">
                        <a 
                          href={vid.videoUrl} 
                          download={`kamtv_footage_${vid.id}.webm`}
                          className="text-[9px] text-green-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> EXPORT
                        </a>
                        <button 
                          onClick={(e) => deleteVideo(vid.id, e)}
                          className="text-[9px] text-red-500 font-bold hover:text-red-400 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> ERASE
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3 custom-scrollbar pr-1">
                {snappedPhotos.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center opacity-45">
                    <Camera className="w-10 h-10 text-green-800 mb-2" />
                    <p className="text-[10px] uppercase font-bold text-green-700">NO SNAPS TAKEN</p>
                  </div>
                ) : (
                  snappedPhotos.map((photo) => (
                    <div 
                      key={photo.id} 
                      onClick={() => setSelectedPhoto(photo)}
                      className="bg-black/60 p-2.5 rounded-lg border border-green-950 flex flex-col gap-2 relative group hover:border-green-500 cursor-pointer transition-all"
                    >
                      <div className="flex gap-3">
                        <img src={photo.url} alt="" className="w-16 h-12 object-cover rounded-md border border-green-900" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase font-black text-white truncate">{photo.title}</p>
                          <p className="text-[8px] text-green-500 font-bold mt-0.5">{photo.date}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-green-950/60">
                        <button 
                          onClick={(e) => deletePhoto(photo.id, e)}
                          className="text-[9px] text-red-500 font-bold hover:text-red-400 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> ERASE
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer info banner */}
        <div className="bg-black/60 border border-green-950 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-green-500 uppercase tracking-widest text-center sm:text-left">
            PRODUCTION SYSTEM ACTIVE // RENDER SECURE PROXY PROTOCOL ALPHA-3
          </p>
          <div className="flex items-center gap-1">
            <span className="text-[8px] bg-green-950 px-2 py-1 rounded border border-green-500 text-green-400 font-black">KAMTV SECURE NETWORK</span>
          </div>
        </div>

      </div>

      {/* Snapshot Preview Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="w-full max-w-4xl bg-[#142214] border-4 border-green-500 rounded-3xl p-6 relative flex flex-col gap-4 shadow-3xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-green-400 uppercase tracking-widest">{selectedPhoto.title}</h3>
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="text-xs bg-green-500 hover:bg-green-400 text-black px-3 py-1.5 rounded font-black uppercase"
              >
                CLOSE
              </button>
            </div>
            
            <img src={selectedPhoto.url} alt="" className="w-full h-auto object-contain rounded-xl border-2 border-green-700" />
            
            <div className="flex justify-between items-center pt-2">
              <p className="text-[10px] text-green-500 font-bold uppercase">{selectedPhoto.date} // HIGH QUALITY SIGNED BUFFER</p>
              <a 
                href={selectedPhoto.url} 
                download={`kamtv_snapshot_${selectedPhoto.id}.jpg`}
                className="text-xs bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-xl font-black uppercase flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> DOWNLOAD ZIP / IMAGE
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

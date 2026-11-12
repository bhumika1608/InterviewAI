'use client';

import { Camera, Check, Mic, Send, Volume2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../lib/api';

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

type Question = {
  id: number;
  question_text: string;
  question_order: number;
  is_answered?: boolean;
};

function InterviewContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get('sessionId');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('Ready');
  const [session, setSession] = useState<any>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraImageVisible, setCameraImageVisible] = useState<boolean | null>(null);
  const [micReady, setMicReady] = useState(false);
  const [mediaChecked, setMediaChecked] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef<Promise<void> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const focusChangesRef = useRef(0);
  const blackCameraFramesRef = useRef(0);
  const voiceVerifiedRef = useRef(false);
  const useLocalTranscriptionRef = useRef(false);
  const manualAnswerRef = useRef(false);
  const micReadyRef = useRef(false);
  const shouldListenRef = useRef(false);
  const isReadingRef = useRef(false);
  const answerRef = useRef('');
  const interimAnswerRef = useRef('');

  const currentQuestion = questions[currentIndex] ?? null;

  const startLocalRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording' || typeof MediaRecorder === 'undefined') return;
    const tracks = cameraStreamRef.current?.getAudioTracks().filter((track) => track.readyState === 'live') ?? [];
    if (!tracks.length) return;

    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : undefined;
      const recorder = new MediaRecorder(new MediaStream(tracks), mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];
      audioBlobRef.current = null;
      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunksRef.current.push(event.data);
      };
      recorder.onstart = () => setIsAudioRecording(true);
      recorder.onerror = () => {
        setIsAudioRecording(false);
        setStatus('Voice capture paused; type your answer or retry');
      };
      recorder.onstop = () => {
        audioBlobRef.current = audioChunksRef.current.length
          ? new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          : null;
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        setIsAudioRecording(false);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(1000);
    } catch {
      mediaRecorderRef.current = null;
      setIsAudioRecording(false);
      setStatus('Local audio backup unavailable; type your answer');
    }
  };

  const stopLocalRecording = () => new Promise<Blob | null>((resolve) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      resolve(audioBlobRef.current);
      return;
    }
    recorder.addEventListener('stop', () => resolve(audioBlobRef.current), { once: true });
    recorder.stop();
  });

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      startLocalRecording();
      if (micReadyRef.current) startListening();
      return;
    }

    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    void stopLocalRecording();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => {
      isReadingRef.current = true;
      setIsReading(true);
    };
    utterance.onend = () => {
      isReadingRef.current = false;
      setIsReading(false);
      startLocalRecording();
      shouldListenRef.current = micReadyRef.current;
      if (shouldListenRef.current) startListening();
    };
    utterance.onerror = () => {
      isReadingRef.current = false;
      setIsReading(false);
      startLocalRecording();
      shouldListenRef.current = micReadyRef.current;
      if (shouldListenRef.current) startListening();
    };
    window.speechSynthesis.speak(utterance);
  };

  const ensureCamera = async () => {
    if (cameraStreamRef.current || cameraRequestRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Camera and microphone APIs are unavailable here. You can still type your answers.');
      setMediaChecked(true);
      return;
    }

    cameraRequestRef.current = (async () => {
      let audioStream: MediaStream | null = null;
      let videoStream: MediaStream | null = null;
      const avoidVirtualCamera = /virtual|nvidia|broadcast|obs|snap camera/i;
      const availableCameras = await navigator.mediaDevices.enumerateDevices();
      const preferredCamera = availableCameras.find((device) =>
        device.kind === 'videoinput' && device.deviceId && device.label && !avoidVirtualCamera.test(device.label),
      );
      const videoConstraints: MediaTrackConstraints = preferredCamera
        ? { deviceId: { exact: preferredCamera.deviceId } }
        : { facingMode: 'user' };
      try {
        const combined = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: true,
        });
        audioStream = combined;
        videoStream = combined;
      } catch {
        const [audioResult, videoResult] = await Promise.allSettled([
          navigator.mediaDevices.getUserMedia({ audio: true }),
          navigator.mediaDevices.getUserMedia({ video: videoConstraints }),
        ]);
        if (audioResult.status === 'fulfilled') audioStream = audioResult.value;
        if (videoResult.status === 'fulfilled') videoStream = videoResult.value;
      }

      const activeVideoTrack = videoStream?.getVideoTracks()[0];
      if (activeVideoTrack && avoidVirtualCamera.test(activeVideoTrack.label)) {
        const fallbackCamera = (await navigator.mediaDevices.enumerateDevices()).find((device) =>
          device.kind === 'videoinput'
          && device.deviceId !== activeVideoTrack.getSettings().deviceId
          && device.label
          && !avoidVirtualCamera.test(device.label),
        );
        if (fallbackCamera) {
          try {
            const physicalStream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: fallbackCamera.deviceId } },
              audio: false,
            });
            videoStream?.getVideoTracks().forEach((track) => track.stop());
            videoStream = physicalStream;
          } catch {
            setErrorMessage(`Could not open ${fallbackCamera.label}; keeping the selected camera.`);
          }
        }
      }

      const tracks = [
        ...(audioStream?.getAudioTracks() ?? []),
        ...(videoStream?.getVideoTracks() ?? []),
      ];
      const stream = new MediaStream(tracks);
      cameraStreamRef.current = stream;
      const hasAudio = stream.getAudioTracks().some((track) => track.readyState === 'live');
      const hasVideo = stream.getVideoTracks().some((track) => track.readyState === 'live');
      micReadyRef.current = hasAudio;
      setMicReady(hasAudio);
      setCameraReady(hasVideo);

      stream.getTracks().forEach((track) => {
        track.onended = () => {
          const micAvailable = stream.getAudioTracks().some((audioTrack) => audioTrack.readyState === 'live');
          const cameraAvailable = stream.getVideoTracks().some((videoTrack) => videoTrack.readyState === 'live');
          micReadyRef.current = micAvailable;
          setMicReady(micAvailable);
          setCameraReady(cameraAvailable);
          if (!micAvailable) {
            shouldListenRef.current = false;
            recognitionRef.current?.stop();
          }
          setErrorMessage('A device was disconnected. You can keep typing, or reconnect it and retry.');
        };
      });

      if (hasVideo && videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          blackCameraFramesRef.current = 0;
          setCameraImageVisible(null);
        } catch {
          setErrorMessage('Camera is connected but preview playback failed. Check browser camera permissions.');
        }
      }
      if (!hasAudio || !hasVideo) {
        setErrorMessage([
          !hasAudio ? 'Microphone unavailable; you can type your answers.' : '',
          !hasVideo ? 'Camera unavailable; continuing without camera analysis.' : '',
        ].filter(Boolean).join(' '));
      }

      shouldListenRef.current = hasAudio;
      if (hasAudio) startListening();
    })().catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to access camera or microphone. You can type your answers.');
    }).finally(() => {
      cameraRequestRef.current = null;
      setMediaChecked(true);
    });
    await cameraRequestRef.current;
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      shouldListenRef.current = false;
      setIsListening(false);
      setStatus('Type your answer; voice transcription is not supported here');
      return;
    }
    if (!micReadyRef.current || recognitionRef.current || isReadingRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
      setStatus('Listening automatically');
    };

    recognition.onresult = (event: any) => {
      const finalParts: string[] = [];
      let interim = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript.trim();
        if (event.results[index].isFinal && transcript) finalParts.push(transcript);
        else interim += `${transcript} `;
      }
      if (finalParts.length) {
        answerRef.current = `${answerRef.current} ${finalParts.join(' ')}`.trim();
        voiceVerifiedRef.current = true;
        setStatus('Listening automatically');
      }
      interimAnswerRef.current = interim.trim();
      const transcript = `${answerRef.current} ${interimAnswerRef.current}`.trim();
      setAnswer(transcript);
      if (transcript) setErrorMessage('');
    };
    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
        shouldListenRef.current = false;
        useLocalTranscriptionRef.current = true;
        setStatus('Voice unavailable; type your answer or retry');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        shouldListenRef.current = false;
        useLocalTranscriptionRef.current = true;
        setStatus('Voice capture paused; type your answer or retry');
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      if (shouldListenRef.current && micReadyRef.current && !isReadingRef.current) {
        window.setTimeout(() => startListening(), 300);
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      setStatus('Listening automatically');
    } catch {
      recognitionRef.current = null;
      shouldListenRef.current = false;
      setIsListening(false);
      setStatus('Voice unavailable; type your answer');
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        return;
      }

      try {
        const response = await apiFetch(`/interviews/${sessionId}/`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Unable to load this interview.');
        if (data.status === 'completed') {
          router.replace(`/interview/report?sessionId=${sessionId}`);
          return;
        }
        setSession(data);
        setQuestions(data.questions ?? []);
        await ensureCamera();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load this interview.');
      }
    };

    fetchSession();
  }, [sessionId, router]);

  useEffect(() => {
    const trackFocusChange = () => {
      if (document.visibilityState === 'hidden') focusChangesRef.current += 1;
    };
    document.addEventListener('visibilitychange', trackFocusChange);
    return () => {
      document.removeEventListener('visibilitychange', trackFocusChange);
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      mediaRecorderRef.current?.stop();
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!sessionId || !cameraReady) return;

    const sendCameraFrame = () => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) return;

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = Math.round(320 * video.videoHeight / video.videoWidth);
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, 32, 32).data;
      let totalBrightness = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        totalBrightness += (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
      }
      const meanBrightness = totalBrightness / (pixels.length / 4);
      if (meanBrightness < 5) {
        blackCameraFramesRef.current += 1;
        if (blackCameraFramesRef.current >= 2) {
          setCameraImageVisible(false);
          setErrorMessage('The selected camera is returning a black image. Try closing other camera apps or reconnect the physical webcam.');
        }
        return;
      }
      blackCameraFramesRef.current = 0;
      setCameraImageVisible(true);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const payload = new FormData();
        payload.append('frame', blob, 'camera-frame.jpg');
        try {
          const response = await apiFetch(`/interviews/${sessionId}/camera-observation/`, {
            method: 'POST',
            body: payload,
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Camera observation failed.');
          }
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Camera observation failed.');
        }
      }, 'image/jpeg', 0.55);
    };

    sendCameraFrame();
    const timer = window.setInterval(sendCameraFrame, 5000);
    return () => window.clearInterval(timer);
  }, [cameraReady, sessionId]);

  useEffect(() => {
    if (currentQuestion && mediaChecked) {
      speakText(currentQuestion.question_text);
    }
  }, [currentQuestion, mediaChecked]);

  const finishInterview = async () => {
    if (!sessionId || isFinishing) return;
    setIsFinishing(true);
    setErrorMessage('');
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    await stopLocalRecording();
    try {
      const response = await apiFetch(`/interviews/${sessionId}/complete/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice_verified: voiceVerifiedRef.current,
          focus_changes: focusChangesRef.current,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Unable to save the interview report.');
      localStorage.setItem('lastSessionResult', JSON.stringify(data));
      router.push(`/interview/report?sessionId=${sessionId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save the interview report.');
      setIsFinishing(false);
    }
  };

  const submitAnswer = async () => {
    if (!sessionId || !currentQuestion || isSubmitting || isFinishing) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    try {
      const audio = await stopLocalRecording();
      const answerToSubmit = (
        answer.trim()
        || `${answerRef.current} ${interimAnswerRef.current}`.trim()
      ).trim();
      const transcribeAudio = Boolean(audio?.size && (!answerToSubmit || (useLocalTranscriptionRef.current && !manualAnswerRef.current)));
      if (!answerToSubmit && !transcribeAudio) {
        throw new Error('No answer was captured. Speak again or type your answer, then submit.');
      }

      const payload = new FormData();
      payload.append('question_id', String(currentQuestion.id));
      payload.append('answer', transcribeAudio ? '' : answerToSubmit);
      if (transcribeAudio && audio) {
        payload.append('audio', audio, 'answer.webm');
      }

      const response = await apiFetch(`/interviews/${sessionId}/submit-answer/`, {
        method: 'POST',
        body: payload,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Unable to submit answer.');
      }

      if (data.transcribed) voiceVerifiedRef.current = true;
      setStatus(data.transcribed ? `Locally transcribed; score: ${data.score.toFixed(1)}%` : `Score: ${data.score.toFixed(1)}%`);
      answerRef.current = '';
      interimAnswerRef.current = '';
      manualAnswerRef.current = false;
      useLocalTranscriptionRef.current = false;
      audioBlobRef.current = null;
      setAnswer('');

      const nextIndex = currentIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentIndex(nextIndex);
      } else {
        await finishInterview();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Answer submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionId) {
    return <main className="min-h-screen bg-slate-950 p-10 text-white">Session not found.</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-lg font-bold text-white">
              AI
            </div>
            <div>
              <p className="text-sm text-slate-400">Interview session</p>
              <p className="text-xl font-bold">AI Interviewer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => currentQuestion && speakText(currentQuestion.question_text)} className="btn-secondary border-slate-700 bg-slate-900 text-slate-200">
              <Volume2 className="mr-2 h-4 w-4" />
              Repeat
            </button>
            <button type="button" onClick={finishInterview} disabled={isFinishing || isSubmitting} className="btn-primary">
              {isFinishing ? 'Saving report...' : 'Finish and view report'}
            </button>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Current question</p>
                <p className="mt-2 text-2xl font-bold">Question {currentIndex + 1} / {questions.length || 1}</p>
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300">
                {status}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6">
              <p className="text-lg leading-8 text-slate-100">
                {currentQuestion ? `“${currentQuestion.question_text}”` : 'Loading your resume-based question...'}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3" aria-live="polite">
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm">
                <Mic className={`h-4 w-4 ${isListening ? 'text-emerald-400' : 'text-amber-400'}`} />
                {isListening ? 'Live transcription on' : isAudioRecording ? 'Recording locally for transcription backup' : micReady ? 'Microphone ready; type if voice fails' : 'Microphone unavailable; type answers'}
              </div>
              {!isListening && micReady && (
                <button type="button" onClick={startListening} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-100">
                  <Mic className="h-4 w-4" />
                  Retry voice capture
                </button>
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-950 p-4">
              <video ref={videoRef} autoPlay muted playsInline className="h-52 w-full rounded-xl object-cover" />
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                {cameraReady && cameraImageVisible !== false ? <Check className="h-4 w-4 text-emerald-400" /> : <Camera className="h-4 w-4 text-amber-400" />}
                {!cameraReady
                  ? 'Camera unavailable; interview can continue without camera analysis'
                  : cameraImageVisible === false
                    ? 'Camera is active but its image is black'
                    : cameraImageVisible === null
                      ? 'Checking camera image...'
                      : 'Camera image is live'}
              </p>
              <p className="mt-3 text-xs text-slate-400">Camera samples are analyzed for face visibility and additional faces. Images are not saved; this cannot detect other devices.</p>
            </div>

            <div className="mt-8">
              <label className="mb-3 block text-sm font-semibold text-slate-300">Your spoken or typed answer</label>
              <textarea
                value={answer}
                onChange={(event) => {
                  answerRef.current = event.target.value;
                  interimAnswerRef.current = '';
                  manualAnswerRef.current = true;
                  setAnswer(event.target.value);
                  setErrorMessage('');
                }}
                className="h-40 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/25"
                placeholder="Answer out loud or type your answer here..."
              />
            </div>

            {errorMessage && <p className="mt-4 rounded-xl border border-red-700 bg-red-950/50 px-3 py-2 text-sm text-red-300">{errorMessage}</p>}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={submitAnswer} disabled={isSubmitting || isFinishing || !currentQuestion} className="btn-primary flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Evaluating answer...' : 'Submit answer'}
                <Send className="ml-2 h-4 w-4" />
              </button>
              <button type="button" onClick={finishInterview} disabled={isFinishing || isSubmitting} className="btn-secondary border-slate-700 bg-slate-900 text-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
                End and view report
              </button>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Session info</p>
              <div className="mt-5 space-y-4 text-sm text-slate-300">
                <div className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2">
                  <span>Role</span>
                  <span className="font-semibold text-white">{session?.role ?? 'AI Interview'}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2">
                  <span>Mode</span>
                  <span className="font-semibold text-white">{session?.mode ?? 'voice_camera'}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2">
                  <span>Camera</span>
                  <span className="font-semibold text-white">{cameraReady ? 'On' : 'Unavailable'}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2">
                  <span>Mic</span>
                  <span className="font-semibold text-white">{isListening ? 'Listening' : micReady ? 'Ready' : 'Type answer'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Live guidance</p>
              <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
                {isReading ? 'Listen to the question, then answer when the microphone resumes.' : isListening ? 'Your microphone is listening. You can also type or edit the transcript.' : 'Answer by typing; voice capture can be retried if the microphone is available.'}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-950 p-10 text-white">Loading interview...</main>}>
      <InterviewContent />
    </Suspense>
  );
}

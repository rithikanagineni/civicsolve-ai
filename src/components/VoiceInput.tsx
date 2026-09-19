"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { SPEECH_LOCALES } from "@/lib/i18n";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

/** Browser Web Speech API capture — speech is converted to text before hitting the API. */
export function VoiceInput({
  language,
  onTranscript,
  label = "Report using Voice 🎙️",
}: {
  language: string;
  onTranscript: (text: string) => void;
  label?: string;
}) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch { /* noop */ }
    };
  }, []);

  function toggle() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    setError("");
    recognition.lang = SPEECH_LOCALES[language] ?? "en-IN";
    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) text += `${event.results[i][0].transcript} `;
      onTranscript(text.trim());
    };
    recognition.onerror = (event) => {
      setError(
        event.error === "not-allowed"
          ? "Microphone permission was denied. You can still type your problem below."
          : `Voice capture stopped (${event.error}). Please use text input.`,
      );
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Could not start the microphone. Please use text input.");
    }
  }

  if (!supported) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Voice input is not supported in this browser. Please use the text fields below (input method will be saved as TEXT).
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
          listening ? "animate-pulse bg-rose-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {listening ? "Listening… tap to stop" : label}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from 'react';

type Props = {
  placeholder?: string;
  onResult?: (text: string) => void;
  buttonLabel?: string;
};

export default function VoiceInput({ placeholder, onResult, buttonLabel = '语音输入' }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SR) {
      setSupported(true);
      const rec: SpeechRecognition = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'zh-CN';
      rec.onresult = (event: SpeechRecognitionEvent) => {
        const text = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join(' ');
        if (text && onResult) onResult(text);
        setListening(false);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
    }
  }, [onResult]);

  const toggle = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (!listening) {
      setListening(true);
      rec.start();
    } else {
      rec.stop();
      setListening(false);
    }
  };

  if (!supported) {
    return <button className="ghost" title="浏览器不支持语音输入" disabled>麦克风不可用</button>;
  }
  return (
    <button onClick={toggle} aria-pressed={listening} title={placeholder}>
      {listening ? '正在听…点击停止' : buttonLabel}
    </button>
  );
}


import { useState, useEffect, useRef } from 'react';

const COMMAND_MAP = {
  // Herramientas
  "borrar": 'eraser',
  "seleccionar": 'select',
  "texto": 'text',
  "lápiz": 'pencil',
  "lapiz": 'pencil', 
  "rotulador": 'marker',
  // Figuras
  "cuadrado": 'square',
  "círculo": 'circle',
  "circulo": 'circle',
  "triángulo": 'triangle',
  "triangulo": 'triangle', 
  "rombo": 'diamond',
  "estrella": 'star',
  "pentágono": 'pentagon',
  "pentagono": 'pentagon',
  "flecha derecha": 'arrowRight',
  "flecha izquierda": 'arrowLeft',
  "línea": 'line',
  "linea": 'line', 
};

const COLOR_MAP = {
  "negro": '#000000',
  "blanco": '#FFFFFF',
  "rojo": '#FF0000',
  "verde": '#00FF00',
  "azul": '#0000FF',
  "amarillo": '#FFFF00',
  "magenta": '#FF00FF',
  "cian": '#00FFFF',
  "naranja": '#FFA500',
};

const FONT_SIZE_MAP = {
  "doce": 12, "catorce": 14, "dieciséis": 16, "dieciseis": 16,
  "dieciocho": 18, "veinticuatro": 24, "treinta y dos": 32, "treintados": 32,
  "cuarenta y ocho": 48, "cuarentayocho": 48,
};


export function useVoiceCommands(onCommandRecognized) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn("Speech Recognition no soportado en este navegador.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    
    recognition.continuous = true;
    
    recognition.interimResults = false;
    recognition.lang = 'es-ES';

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.toLowerCase().trim();
      
      console.log("[VoiceCommand] Transcripción:", transcript);
      
      let command = null;
      let param = null;

      for (const key in COMMAND_MAP) {
        if (transcript.includes(key)) {
          command = 'tool';
          param = COMMAND_MAP[key];
          break;
        }
      }

      if (!command) {
        for (const key in COLOR_MAP) {
          if (transcript.includes(`color ${key}`)) {
            command = 'color';
            param = COLOR_MAP[key];
            break;
          }
        }
      }

      if (!command) {
        for (const key in FONT_SIZE_MAP) {
          if (transcript.includes(`tamaño ${key}`)) {
            command = 'fontSize';
            param = FONT_SIZE_MAP[key];
            break;
          }
        }
      }

      if (!command) {
        const match = transcript.match(/tamaño (\d+)/);
        if (match && match[1]) {
          const num = Number(match[1]);
          if (Object.values(FONT_SIZE_MAP).includes(num)) {
             command = 'fontSize';
             param = num;
          }
        }
      }


      if (command && onCommandRecognized) {
        onCommandRecognized({ type: command, value: param });
      } else {
        console.warn("[VoiceCommand] Comando no reconocido:", transcript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("[VoiceCommand] Dejó de escuchar.");
    };

    recognition.onerror = (event) => {
      console.error("[VoiceCommand] Error de reconocimiento:", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onCommandRecognized]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
      console.log("[VoiceCommand] Empezó a escuchar...");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      console.log("[VoiceCommand] Deteniendo escucha...");
    }
  };

  return { isListening, startListening, stopListening };
}
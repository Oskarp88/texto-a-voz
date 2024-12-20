import React, { useState, useEffect } from 'react';
import './Text.css';

const API_KEY = process.env.REACT_APP_APIKEY; 

const TextToSpeech = () => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [pitch, setPitch] = useState(0);
  const [speakingRate, setSpeakingRate] = useState(1);
  const [volumeGainDb, setVolumeGainDb] = useState(0);
  const [effectsProfileId, setEffectsProfileId] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(''); 
  const [languages, setLanguages] = useState([]); 

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${API_KEY}`);
        const data = await response.json();

        if (data.voices && data.voices.length > 0) {
          setVoices(data.voices); // voces disponibles

          // Obtener los idiomas
          const uniqueLanguages = [...new Set(data.voices.flatMap(voice => voice.languageCodes))];
          setLanguages(uniqueLanguages);

          // Si no hay voz seleccionada, se elige la primera por defecto
          if (!selectedLanguage) {
            setSelectedLanguage(uniqueLanguages[0]);
          }
        } else {
          setError('No se encontraron voces disponibles.');
        }
      } catch (error) {
        console.error('Error al obtener las voces:', error);
        setError('Hubo un error al obtener las voces. Por favor, inténtalo de nuevo más tarde.');
      }
    };

    fetchVoices();
  }, [selectedLanguage]);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    if (newText.length <= 5000) {
      setText(newText);
      setError('');
    } else {
      setError('El texto no debe exceder los 5000 caracteres.');
    }
  };

  const handleSpeak = async () => {
    if (text.length > 0 && text.length <= 5000 && selectedVoice) {
      try {
        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: { text },
            voice: { languageCode: selectedLanguage, name: selectedVoice },
            audioConfig: { 
              audioEncoding: 'MP3',
              pitch: pitch,
              speakingRate: speakingRate,
              volumeGainDb: volumeGainDb,
              effectsProfileId: effectsProfileId ? [effectsProfileId] : [],
            },
          }),
        });

        const data = await response.json();
        if (data.audioContent) {
          const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
          setAudioUrl(audioUrl);
        } else {
          setError('Error al generar el audio.');
        }
      } catch (error) {
        console.error('Error al generar el audio:', error);
        setError('Hubo un error al generar el audio. Por favor, inténtalo de nuevo.');
      }
    }
  };

  // Filtrar las voces según el idioma seleccionado
  const filteredVoices = voices.filter(voice => voice.languageCodes.includes(selectedLanguage));

  return (
    <div className="text-to-speech-container">
      <h2>Transforma texto en audio</h2>
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Escribe aquí tu texto (máximo 5000 caracteres)"
        rows="10"
        className="text-input"
      ></textarea>
      {error && <p className="error">{error}</p>}
      <p>{text.length}/5000 caracteres</p>

      {/* Control para seleccionar el idioma */}
      <label htmlFor="language-select">Selecciona un idioma:</label>
      <select
        id="language-select"
        onChange={(e) => setSelectedLanguage(e.target.value)}
        value={selectedLanguage}
      >
        {languages.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>

      {/* Control para seleccionar la voz */}
      <label htmlFor="voice-select">Selecciona una voz:</label>
      <select
        id="voice-select"
        onChange={(e) => setSelectedVoice(e.target.value)}
        value={selectedVoice}
      >
        {filteredVoices?.map((voice) => (
          <option key={voice.name} value={voice.name}>
            {voice.name} ({voice.languageCodes[0]})
          </option>
        ))}
      </select>

      {/* Control para ajustar el tono */}
      <div className="control">
        <label htmlFor="pitch">Tono ({pitch})</label>
        <input
          type="range"
          id="pitch"
          min="-20.0"
          max="20.0"
          step="0.1"
          value={pitch}
          onChange={(e) => setPitch(Number(e.target.value))}
        />
      </div>

      {/* Control para ajustar la velocidad */}
      <div className="control">
        <label htmlFor="speakingRate">Velocidad ({speakingRate})</label>
        <input
          type="range"
          id="speakingRate"
          min="0.25"
          max="4.0"
          step="0.1"
          value={speakingRate}
          onChange={(e) => setSpeakingRate(Number(e.target.value))}
        />
      </div>

      {/* Control para ajustar el volumen */}
      <div className="control">
        <label htmlFor="volumeGainDb">Volumen ({volumeGainDb})</label>
        <input
          type="range"
          id="volumeGainDb"
          min="-96.0"
          max="16.0"
          step="0.1"
          value={volumeGainDb}
          onChange={(e) => setVolumeGainDb(Number(e.target.value))}
        />
      </div>

      {/* Control para seleccionar el efecto de audio */}
      <div className="control">
        <label htmlFor="effectsProfileId">Efecto de audio</label>
        <select
          id="effectsProfileId"
          onChange={(e) => setEffectsProfileId(e.target.value)}
          value={effectsProfileId}
        >
          <option value="">Sin efecto</option>
          <option value="telephony-class-application">Teléfono</option>
          <option value="handset-class-device">Dispositivo de mano</option>
          <option value="wearable-class-device">Dispositivo portátil</option>
        </select>
      </div>

      <button onClick={handleSpeak} className="speak-button" disabled={text.length === 0 || text.length > 5000}>
        Reproducir Audio
      </button>

      {audioUrl && (
        <div>
          <audio controls src={audioUrl}></audio>
        </div>
      )}
    </div>
  );
};

export default TextToSpeech;

import React, { useState, useEffect, useCallback } from 'react';
import { VolumeX, Volume2 } from 'lucide-react';

type Color = 'green' | 'red' | 'yellow' | 'blue';

const COLORS: Color[] = ['green', 'red', 'yellow', 'blue'];
const INITIAL_DELAY = 500;

function App() {
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playingSequence, setPlayingSequence] = useState(false);
  const [userSequence, setUserSequence] = useState<Color[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [muted, setMuted] = useState(false);
  const [activeColor, setActiveColor] = useState<Color | null>(null);

  const colorMap = {
    green: { bg: 'bg-green-500', active: 'bg-green-300' },
    red: { bg: 'bg-red-500', active: 'bg-red-300' },
    yellow: { bg: 'bg-yellow-500', active: 'bg-yellow-300' },
    blue: { bg: 'bg-blue-500', active: 'bg-blue-300' },
  };

  const playSound = useCallback((color: Color) => {
    if (muted) return;
    const frequencies = {
      green: 261.63, // C4
      red: 329.63,   // E4
      yellow: 392.00, // G4
      blue: 523.25,   // C5
    };

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequencies[color], audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [muted]);

  const playSequence = useCallback(async (sequence: Color[]) => {
    setPlayingSequence(true);
    for (const color of sequence) {
      setActiveColor(color);
      playSound(color);
      await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY));
      setActiveColor(null);
      await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY / 2));
    }
    setPlayingSequence(false);
  }, [playSound]);

  const startGame = useCallback(() => {
    const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newSequence = [newColor];
    setSequence(newSequence);
    setUserSequence([]);
    setGameOver(false);
    setScore(0);
    playSequence(newSequence);
  }, [playSequence]);

  const handleColorClick = useCallback((color: Color) => {
    if (playingSequence || gameOver) return;

    setActiveColor(color);
    playSound(color);
    setTimeout(() => setActiveColor(null), 300);

    const newUserSequence = [...userSequence, color];
    setUserSequence(newUserSequence);

    const currentIndex = userSequence.length;
    if (color !== sequence[currentIndex]) {
      setGameOver(true);
      setHighScore(Math.max(highScore, score));
      return;
    }

    if (newUserSequence.length === sequence.length) {
      setScore(score + 1);
      const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      const newSequence = [...sequence, newColor];
      setSequence(newSequence);
      setUserSequence([]);
      setTimeout(() => playSequence(newSequence), 1000);
    }
  }, [playingSequence, gameOver, userSequence, sequence, playSequence, playSound, score, highScore]);

  useEffect(() => {
    const storedHighScore = localStorage.getItem('simonHighScore');
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('simonHighScore', highScore.toString());
  }, [highScore]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Simon Game</h1>
          <div className="flex justify-center items-center gap-4 mb-4">
            <p className="text-xl text-white">Score: {score}</p>
            <p className="text-xl text-white">High Score: {highScore}</p>
            <button
              onClick={() => setMuted(!muted)}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              {muted ? (
                <VolumeX className="w-6 h-6 text-white" />
              ) : (
                <Volume2 className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto aspect-square">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorClick(color)}
              disabled={playingSequence || gameOver}
              className={`
                ${activeColor === color ? colorMap[color].active : colorMap[color].bg}
                rounded-2xl shadow-lg transform hover:scale-95 transition-all duration-150
                disabled:cursor-not-allowed disabled:opacity-50
              `}
            />
          ))}
        </div>

        <div className="text-center mt-8">
          {gameOver ? (
            <div className="space-y-4">
              <p className="text-2xl text-red-500 font-bold">Game Over!</p>
              <button
                onClick={startGame}
                className="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold
                  hover:bg-gray-200 transition-colors"
              >
                Play Again
              </button>
            </div>
          ) : (
            sequence.length === 0 && (
              <button
                onClick={startGame}
                className="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold
                  hover:bg-gray-200 transition-colors"
              >
                Start Game
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
export function playCelebrationSound(enabled: boolean): void {
    if (!enabled || typeof window === "undefined") {
        return;
    }

    const AudioContextConstructor = window.AudioContext ||
        (window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

    if (!AudioContextConstructor) {
        return;
    }

    const audioContext = new AudioContextConstructor();
    const notes = [523.25, 659.25, 783.99];
    const startTime = audioContext.currentTime;

    notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const noteStart = startTime + index * 0.1;

        oscillator.type = "triangle";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.1, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.24);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + 0.25);
    });

    window.setTimeout(() => void audioContext.close(), 600);
}

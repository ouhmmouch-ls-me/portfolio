(() => {
  'use strict';

  const chart = document.querySelector('#wave-chart');
  const wave = document.querySelector('#wave-path');
  const referenceWave = document.querySelector('#reference-wave');
  const title = document.querySelector('#wave-title');
  const label = document.querySelector('#signal-label');
  const pauseButton = document.querySelector('#signal-pause');
  const phaseControl = document.querySelector('#phase-control');
  const phaseValue = document.querySelector('#phase-value');
  const referenceControl = document.querySelector('#show-reference');
  const explanation = document.querySelector('#signal-explanation');
  const buttons = [...document.querySelectorAll('[data-signal]')];
  if (![chart, wave, referenceWave, title, label, pauseButton, phaseControl,
    phaseValue, referenceControl, explanation].every(Boolean) || !buttons.length) return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const signals = new Set(['voltage', 'current', 'power']);
  let signal = buttons.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.signal || 'voltage';
  if (!signals.has(signal)) signal = 'voltage';
  let phaseDegrees = Math.max(0, Math.min(90, Number(phaseControl.value) || 0));
  let animationPhase = 0;
  let paused = motionPreference.matches;
  let visible = false;
  let animationFrame = null;
  let previousTime = null;

  chart.setAttribute('aria-describedby', 'signal-explanation');
  referenceWave.setAttribute('aria-hidden', 'true');

  function showReference() {
    return signal !== 'voltage' && referenceControl.checked;
  }

  function drawWave() {
    const selectedPoints = [];
    const referencePoints = [];
    const lag = phaseDegrees * Math.PI / 180;
    for (let x = 0; x <= 600; x += 3) {
      const angle = x / 600 * Math.PI * 5 + animationPhase;
      const voltage = Math.sin(angle);
      const current = Math.sin(angle - lag);
      const value = signal === 'power' ? voltage * current : signal === 'current' ? current : voltage;
      const command = x === 0 ? 'M' : 'L';
      selectedPoints.push(`${command}${x},${(70 - value * 46).toFixed(2)}`);
      referencePoints.push(`${command}${x},${(70 - voltage * 46).toFixed(2)}`);
    }
    wave.setAttribute('d', selectedPoints.join(' '));
    referenceWave.setAttribute('d', referencePoints.join(' '));
    referenceWave.toggleAttribute('hidden', !showReference());
  }

  // Text changes only after a control changes, so animation never repeats announcements.
  function updateDescription() {
    phaseValue.textContent = `${phaseDegrees}°`;
    phaseControl.setAttribute('aria-valuetext', `${phaseDegrees} degrees`);
    label.textContent = `${signal.toUpperCase()} / NORMALIZED`;
    const relationship = phaseDegrees === 0
      ? 'Current is in phase with voltage.'
      : `Current lags voltage by ${phaseDegrees}°.`;
    const referenceDescription = showReference() ? ' The dashed line is the voltage reference.' : '';
    if (signal === 'voltage') {
      title.textContent = 'Illustrative normalized voltage sine wave';
      explanation.textContent = `Voltage is the unit-amplitude reference. Select Current or Power to explore a ${phaseDegrees}° phase lag.`;
    } else if (signal === 'current') {
      title.textContent = `Illustrative normalized current sine wave with a ${phaseDegrees} degree phase lag`;
      explanation.textContent = `${relationship} Both sine waves have unit amplitude in this illustration.${referenceDescription}`;
    } else {
      title.textContent = `Illustrative normalized instantaneous power waveform with a ${phaseDegrees} degree current phase lag`;
      explanation.textContent = `Instantaneous power is voltage × current. ${relationship} Increasing the lag reduces average power for these unit-amplitude sine waves.${referenceDescription}`;
    }
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.signal === signal)));
  }

  function animate(time) {
    animationFrame = null;
    if (paused || !visible || document.hidden) {
      previousTime = null;
      return;
    }
    if (previousTime !== null) {
      animationPhase = (animationPhase + Math.min(time - previousTime, 50) * .0007) % (Math.PI * 2);
    }
    previousTime = time;
    drawWave();
    animationFrame = requestAnimationFrame(animate);
  }

  function syncAnimation() {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    previousTime = null;
    pauseButton.textContent = paused ? '▷' : 'Ⅱ';
    pauseButton.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} signal animation`);
    if (!paused && visible && !document.hidden) animationFrame = requestAnimationFrame(animate);
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    if (!signals.has(button.dataset.signal)) return;
    signal = button.dataset.signal;
    updateDescription();
    drawWave();
  }));
  phaseControl.addEventListener('input', () => {
    phaseDegrees = Math.max(0, Math.min(90, Number(phaseControl.value) || 0));
    updateDescription();
    drawWave();
  });
  referenceControl.addEventListener('change', () => {
    updateDescription();
    drawWave();
  });
  pauseButton.addEventListener('click', () => {
    paused = !paused;
    syncAnimation();
  });
  motionPreference.addEventListener('change', event => {
    paused = event.matches;
    syncAnimation();
  });
  document.addEventListener('visibilitychange', syncAnimation);

  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncAnimation();
    }, { threshold: .02 });
    visibilityObserver.observe(chart);
  } else {
    const updateVisibility = () => {
      const bounds = chart.getBoundingClientRect();
      const nextVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;
      if (visible !== nextVisible) {
        visible = nextVisible;
        syncAnimation();
      }
    };
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
    updateVisibility();
  }

  updateDescription();
  drawWave();
  syncAnimation();
})();

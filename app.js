(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const email = 'ouhmmouch.mohamed@gmail.com';
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toast = $('.toast');
  let toastTimeout;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  // Only an explicit theme choice is stored. The portfolio opens in its light design.
  const themeButton = $('.theme-toggle');
  function setTheme(theme, persist = true) {
    document.documentElement.dataset.theme = theme;
    themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    $('meta[name="theme-color"]').content = theme === 'dark' ? '#151e19' : '#f4f5ef';
    if (persist) {
      try { localStorage.setItem('mo-portfolio-theme', theme); } catch { /* Storage is optional. */ }
    }
  }
  try {
    if (localStorage.getItem('mo-portfolio-theme') === 'dark') setTheme('dark', false);
  } catch { /* Keep the default theme when storage is unavailable. */ }
  themeButton.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  $('#year').textContent = String(new Date().getFullYear());

  const menuButton = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  function closeMenu() {
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
  }
  menuButton.addEventListener('click', () => {
    const opening = mobileNav.hidden;
    mobileNav.hidden = !opening;
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', `${opening ? 'Close' : 'Open'} navigation`);
  });
  $$('a', mobileNav).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (!mobileNav.hidden && !event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); }
  });
  window.matchMedia('(min-width: 801px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  const nodes = {
    meter: { index: '01', title: 'Start with the signal.', copy: 'SPI communication with the STPM34 metering IC — part of my ESP32 energy-measurement work at Qovoltis.' },
    core: { index: '02', title: 'Firmware, at the core.', copy: 'Low-level C/C++ on ESP32. Peripheral drivers, real-time tasks, and direct hardware interaction.' },
    network: { index: '03', title: 'Make the connection.', copy: 'UDP data transmission, system integration, and validation in my ESP32 energy-measurement project.' }
  };
  $$('.board-node').forEach(button => button.addEventListener('click', () => {
    const node = nodes[button.dataset.node];
    $$('.board-node').forEach(item => {
      const active = item === button;
      item.classList.toggle('is-selected', active);
      item.setAttribute('aria-pressed', String(active));
    });
    $('.node-index').textContent = node.index;
    $('#node-title').textContent = node.title;
    $('#node-copy').textContent = node.copy;
    $('.hero-visual').dataset.activeNode = button.dataset.node;
    $('.visual-version').textContent = `${node.index} / ${button.dataset.node === 'meter' ? 'METERING' : button.dataset.node === 'network' ? 'NETWORK' : 'FIRMWARE'}`;
  }));

  const projectCards = $$('#work-collection [data-category]');
  $$('.project-filters [data-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    let count = 0;
    $$('.project-filters [data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    $('#work-collection').dataset.filter = filter;
    projectCards.forEach(card => {
      const visible = filter === 'all' || card.dataset.category === filter;
      card.hidden = !visible;
      if (visible) { card.classList.add('is-visible'); count++; }
    });
    $('#work-count').textContent = `${count} ${count === 1 ? 'project' : 'projects'}`;
    updateProgress();
  }));

  const projects = {
    qometer: {
      kicker: '01 / QOVOLTIS · ENERGY SYSTEMS',
      title: 'Qometer: connected energy systems.',
      intro: 'At Qovoltis, I contribute to embedded energy-measurement systems, including Qometer, a product certified LinkyReady by Enedis.',
      facts: [['ROLE', 'Embedded Systems Engineer'], ['PERIOD', 'Sept 2024 – Present'], ['FOCUS', 'Real-time firmware']],
      contributions: [
        'Develop low-level ESP32 firmware for real-time energy measurement systems.',
        'Contribute to reliable real-time communication between Qometer and Linky meters, including network interoperability and dynamic load management.',
        'Analyse and diagnose incidents on embedded systems to support reliable field operation.'
      ],
      flow: ['Linky meters', 'Real-time communication', 'Load management'],
      tags: ['ESP32', 'C / C++', 'Energy measurement', 'Interoperability']
    },
    metering: {
      kicker: '02 / QOVOLTIS · FIRMWARE & INTEGRATION',
      title: 'ESP32 energy measurement.',
      intro: 'During my apprenticeship at Qovoltis, I developed an energy-measurement system in C, bringing together a metering IC, microcontroller firmware, and network data transmission.',
      facts: [['ROLE', 'Embedded Systems Engineer · Apprenticeship'], ['PERIOD', 'Oct 2023 – Sept 2024'], ['FOCUS', 'Peripheral interfaces & integration']],
      contributions: [
        'Develop an ESP32 energy-measurement system in C.',
        'Implement SPI communication with the STPM34 metering IC and UDP data transmission.',
        'Support integration and validation of the complete system.'
      ],
      flow: ['STPM34 · SPI', 'ESP32 · C', 'UDP transmission'],
      tags: ['C', 'ESP32', 'STPM34', 'SPI', 'UDP', 'Validation']
    },
    testing: {
      kicker: '03 / QOVOLTIS · HARDWARE VALIDATION',
      title: 'Automated embedded test bench.',
      intro: 'Designed and developed an automated test bench as part of my embedded systems work at Qovoltis. A practical link between the firmware, the hardware, and validation.',
      facts: [['ROLE', 'Embedded Systems Engineer'], ['PERIOD', 'Sept 2024 – Present'], ['FOCUS', 'Test & diagnosis']],
      contributions: [
        'Design and develop an automated test bench for embedded systems.',
        'Analyse, diagnose, and resolve incidents involving embedded hardware and software.',
        'Apply a test-and-validation approach alongside low-level firmware development.'
      ],
      flow: ['Test automation', 'System validation', 'Incident diagnosis'],
      tags: ['Automated testing', 'Embedded systems', 'Validation', 'Debugging']
    },
    mimo: {
      kicker: '04 / KALRAY · SIGNAL PROCESSING',
      title: 'MIMO channel estimation.',
      intro: 'Explored machine-learning approaches to channel estimation in 4 × 4 MIMO systems during my embedded software engineering internship at Kalray.',
      facts: [['ROLE', 'Embedded Software Engineer Intern'], ['PERIOD', 'Mar – Aug 2023'], ['LOCATION', 'Montbonnot-Saint-Martin']],
      contributions: [
        'Develop and evaluate CNN and LSTM models for MIMO channel estimation.',
        'Build Matlab simulation pipelines for dataset generation and analysis.',
        'Benchmark accuracy and robustness across simulation scenarios.'
      ],
      flow: ['Matlab simulation', 'CNN / LSTM models', 'Benchmarking'],
      tags: ['CNN', 'LSTM', '4 × 4 MIMO', 'Matlab', 'Benchmarking']
    }
  };
  const projectDialog = $('#project-dialog');
  const commandDialog = $('#command-dialog');
  function syncModalState() { document.body.classList.toggle('modal-open', projectDialog.open || commandDialog.open); }
  function createTextElement(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  $$('[data-project]').forEach(button => button.addEventListener('click', () => {
    const project = projects[button.dataset.project];
    $('#dialog-kicker').textContent = project.kicker;
    $('#dialog-title').textContent = project.title;
    $('#dialog-intro').textContent = project.intro;
    $('#dialog-facts').replaceChildren(...project.facts.map(([label, value]) => {
      const fact = document.createElement('div');
      fact.append(createTextElement('span', label), document.createTextNode(value));
      return fact;
    }));
    $('#dialog-contributions').replaceChildren(...project.contributions.map(text => createTextElement('li', text)));
    $('#dialog-flow').replaceChildren(...project.flow.map((text, index) => {
      const step = createTextElement('div', '');
      step.append(createTextElement('span', `0${index + 1}`), createTextElement('strong', text));
      return step;
    }));
    $('#dialog-tags').replaceChildren(...project.tags.map(text => createTextElement('span', text)));
    projectDialog.showModal();
    projectDialog.scrollTop = 0;
    syncModalState();
  }));
  $('.dialog-close').addEventListener('click', () => projectDialog.close());
  $('#dialog-contact').addEventListener('click', () => projectDialog.close());
  [projectDialog, commandDialog].forEach(dialog => {
    dialog.addEventListener('close', syncModalState);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  });

  const skills = {
    firmware: { kicker: 'THE FOUNDATION', title: 'Good firmware starts\nwith the hardware.', copy: 'Low-level programming, peripheral drivers, real-time execution, and direct interaction with embedded platforms.', items: ['C', 'C++', 'ESP32', 'STM32', 'FreeRTOS', 'Linux', 'Yocto', 'Drivers', 'HLS'] },
    protocols: { kicker: 'THE CONNECTIONS', title: 'Speak the language\nof the board.', copy: 'Peripheral buses, industrial protocols, network communication, and careful reading of the datasheets behind every interface.', items: ['SPI', 'I2C', 'UART', 'CAN', 'Modbus', 'UDP', 'Datasheets'] },
    tools: { kicker: 'THE WORKBENCH', title: 'Build. Inspect.\nTest. Repeat.', copy: 'A practical development toolkit for firmware, hardware bring-up, debugging, integration, and validation. Working with Agile/Scrum and V-Model methods.', items: ['ESP-IDF', 'STM32CubeIDE', 'GDB', 'CMake', 'Git', 'Jira', 'VS Code', 'Test & validation', 'Agile / Scrum', 'V-Model'] },
    performance: { kicker: 'THE DETAILS THAT MATTER', title: 'Understand the system.\nThen make it work better.', copy: 'Parallel execution, memory behaviour, simulation, and benchmarking — with experience evaluating models across different scenarios.', items: ['OpenMP', 'Multithreading', 'SIMD', 'Cache management', 'Benchmarking', 'Matlab'] }
  };
  const skillButtons = $$('[data-skill]');
  function selectSkill(button) {
    const skill = skills[button.dataset.skill];
    skillButtons.forEach(item => {
      item.setAttribute('aria-selected', String(item === button));
      item.tabIndex = item === button ? 0 : -1;
    });
    const panel = $('#skill-panel');
    panel.setAttribute('aria-labelledby', button.id);
    $('.panel-kicker', panel).textContent = skill.kicker;
    $('h3', panel).textContent = skill.title;
    $('h3', panel).style.whiteSpace = 'pre-line';
    $('p', panel).textContent = skill.copy;
    $('.skill-chips', panel).replaceChildren(...skill.items.map(text => createTextElement('span', text)));
  }
  skillButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectSkill(button));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % skillButtons.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + skillButtons.length) % skillButtons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = skillButtons.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectSkill(skillButtons[next]);
      skillButtons[next].focus();
    });
  });

  $('#copy-email').addEventListener('click', async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(email);
      } else {
        const field = document.createElement('textarea');
        field.value = email;
        field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;left:-9999px;top:0;';
        document.body.append(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Clipboard unavailable');
        $('#copy-email').focus();
      }
      notify('Email address copied. Let’s make a connection.');
    } catch {
      notify('Copy this address: ' + email);
    }
  });

  const commands = [
    { name: 'Selected work', hint: '01 / EXPLORE', keywords: 'projects qometer kalray test bench', action: () => { location.hash = 'work'; } },
    { name: 'Expertise & interactive signals', hint: '02 / EXPLORE', keywords: 'skills firmware protocols toolkit waveform', action: () => { location.hash = 'expertise'; } },
    { name: 'Experience & education', hint: '03 / EXPLORE', keywords: 'journey career university cv', action: () => { location.hash = 'journey'; } },
    { name: 'Contact Mohamed', hint: '04 / CONNECT', keywords: 'email linkedin talk hire', action: () => { location.hash = 'contact'; } },
    { name: 'Download CV', hint: 'PDF / DOWNLOAD', keywords: 'resume résumé curriculum vitae', action: () => $('.resume-link').click() },
    { name: 'Switch theme', hint: 'LIGHT / DARK', keywords: 'appearance mode', action: () => themeButton.click() },
    { name: 'Back to the beginning', hint: 'HOME', keywords: 'top intro hero', action: () => { location.hash = 'home'; } }
  ];
  const commandSearch = $('#command-search');
  let filteredCommands = commands;
  let activeCommand = 0;
  function chooseCommand(index) {
    const command = filteredCommands[index];
    if (!command) return;
    commandDialog.close();
    command.action();
  }
  function renderCommands() {
    const query = commandSearch.value.toLowerCase().trim();
    filteredCommands = commands.filter(item => `${item.name} ${item.keywords}`.toLowerCase().includes(query));
    activeCommand = 0;
    const list = $('.command-list');
    if (!filteredCommands.length) {
      list.replaceChildren(createTextElement('p', 'No matches. Try “work”, “skills”, or “CV”.'));
      commandSearch.removeAttribute('aria-activedescendant');
      return;
    }
    list.replaceChildren(...filteredCommands.map((command, index) => {
      const button = createTextElement('button', command.name, index === activeCommand ? 'is-active' : '');
      button.id = `command-option-${index}`;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(index === activeCommand));
      button.tabIndex = -1;
      button.append(createTextElement('span', command.hint));
      button.addEventListener('click', () => chooseCommand(index));
      return button;
    }));
    commandSearch.setAttribute('aria-activedescendant', 'command-option-0');
  }
  function openCommands() {
    if (projectDialog.open) projectDialog.close();
    closeMenu();
    commandSearch.value = '';
    renderCommands();
    commandDialog.showModal();
    syncModalState();
    commandSearch.focus();
  }
  $$('[data-open-command]').forEach(button => button.addEventListener('click', openCommands));
  $('.command-close').addEventListener('click', () => commandDialog.close());
  commandSearch.addEventListener('input', renderCommands);
  commandSearch.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); chooseCommand(activeCommand); }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key) || !filteredCommands.length) return;
    event.preventDefault();
    activeCommand = (activeCommand + (event.key === 'ArrowDown' ? 1 : -1) + filteredCommands.length) % filteredCommands.length;
    $$('.command-list button').forEach((button, index) => {
      button.classList.toggle('is-active', index === activeCommand);
      button.setAttribute('aria-selected', String(index === activeCommand));
    });
    commandSearch.setAttribute('aria-activedescendant', `command-option-${activeCommand}`);
    $$('.command-list button')[activeCommand].scrollIntoView({ block: 'nearest' });
  });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (commandDialog.open) commandDialog.close(); else openCommands();
    }
  });
  if (!/Mac|iPhone|iPad/.test(navigator.platform)) $('.shortcut-button kbd').textContent = 'Ctrl K';

  // Reveal content only once observers are ready; without JS all content remains visible.
  if ('IntersectionObserver' in window) {
    if (!motionPreference.matches) document.documentElement.classList.add('js-motion');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .08 });
    $$('.reveal').forEach(element => revealObserver.observe(element));
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) $$('.desktop-nav a').forEach(link => {
          const active = link.hash === '#' + entry.target.id;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-10% 0px -65% 0px' });
    $$('main section[id]').forEach(section => sectionObserver.observe(section));
  }
  let scrollPending = false;
  function updateProgress() {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    $('.scroll-progress').style.width = `${available > 0 ? (window.scrollY / available) * 100 : 0}%`;
    $('.site-header').classList.toggle('is-scrolled', window.scrollY > 16);
    scrollPending = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();
})();

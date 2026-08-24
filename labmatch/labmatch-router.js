class LabMatchRouter {
  constructor() {
    this.currentSlide = 1;
    this.totalSlides = 6;
    this.quizData = null;
    this.state = {
      email: '',
      selectedDomain: 'Software Engineering',
      experienceLayer: 'Domain Evaluator',
      workRhythm: 'High-Throughput',
      cognitiveStyle: 'Granular Adversarial',
      psychometricProfile: 'Granular Adversarial'
    };
    this.generatedShareString = '';
  }

  async init() {
    try {
      const resp = await fetch('quiz.json');
      this.quizData = await resp.json();
      this.bindEvents();
      this.updateProgressBar();
      console.log(`[LABMATCH] System operational: v${this.quizData.branding.version}`);
    } catch (err) {
      console.error("[CRITICAL] Failed to load quiz.json configuration:", err);
    }
  }

  bindEvents() {
    window.nextSlide = (id) => this.goToSlide(id);
    window.prevSlide = () => this.goToSlide(this.currentSlide - 1);
    window.selectDomain = (domain) => {
      this.state.selectedDomain = domain;
      this.goToSlide(3);
    };
    window.selectExperience = (exp) => {
      this.state.experienceLayer = exp;
      this.goToSlide(4);
    };
    window.selectPsychometric = (psy) => {
      this.state.cognitiveStyle = psy;
      this.state.psychometricProfile = psy;
      this.finalizeAssessment();
    };
    window.triggerFastPass = () => this.handleFastPass();
    window.shareWorkprint = () => this.shareWorkprint();
  }

  goToSlide(id) {
    if (id < 1 || id > this.totalSlides) return;
    document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`slide-${id}`);
    if (target) {
      target.classList.add('active');
      this.currentSlide = id;
      this.updateProgressBar();
    }
  }

  updateProgressBar() {
    const bar = document.getElementById('progressBar');
    if (bar) {
      const progressPercent = (this.currentSlide / this.totalSlides) * 100;
      bar.style.width = `${progressPercent}%`;
    }
  }

  getMatchedTrack() {
    const tracks = this.quizData?.matrices?.tracks || [];
    return tracks.find(t => t.segment.toLowerCase() === this.state.selectedDomain.toLowerCase()) || tracks[0];
  }

  getMatchedPsychometric() {
    const psychometrics = this.quizData?.matrices?.psychometrics || [];
    return psychometrics.find(p => p.type.toLowerCase() === this.state.psychometricProfile.toLowerCase()) || psychometrics[0];
  }

  finalizeAssessment() {
    const matchedTrack = this.getMatchedTrack();
    const matchedPsy = this.getMatchedPsychometric();

    document.getElementById('workprintEmojiDisplay').innerText = matchedPsy.emojiPrint;
    document.getElementById('workprintRoleDisplay').innerText = matchedTrack.role;
    document.getElementById('workprintRateDisplay').innerText = `Estimated Rate Index: ${matchedTrack.rateIndex} / hr`;
    document.getElementById('labPartnerName').innerText = matchedTrack.referralName;
    document.getElementById('directLabUrl').setAttribute('href', matchedTrack.referralUrl);

    this.compileShareString(matchedTrack, matchedPsy);
    this.dispatchTelemetryLog('STANDARD');
    this.goToSlide(5);
  }

  handleFastPass() {
    const matchedTrack = this.getMatchedTrack();

    document.getElementById('fastPassLabName').innerText = matchedTrack.referralName;
    document.getElementById('fastPassRole').innerText = `Target Track: ${matchedTrack.role}`;
    document.getElementById('fastPassRate').innerText = `Rate Band: ${matchedTrack.rateIndex} / hr`;
    document.getElementById('fastPassLink').setAttribute('href', matchedTrack.referralUrl);

    this.dispatchTelemetryLog('FAST_PASS');
    this.goToSlide(6);
  }

  compileShareString(track, psy) {
    const tpl = this.quizData.sharing.templateText;
    this.generatedShareString = tpl
      .replace('VAR_EMOJIS', psy.emojiPrint)
      .replace('VAR_SEGMENT', track.segment)
      .replace('VAR_WORK_STYLE', this.state.cognitiveStyle)
      .replace('VAR_ROLE1', track.role)
      .replace('VAR_RATE', track.rateIndex);
  }

  async shareWorkprint() {
    if (!this.generatedShareString) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My SonicBloom AI Workprint',
          text: this.generatedShareString,
          url: this.quizData.branding.platformUrl
        });
        return;
      } catch (err) {
        console.warn('Native share dismissed, copying to clipboard instead:', err);
      }
    }

    try {
      await navigator.clipboard.writeText(this.generatedShareString);
      alert('AI Workprint copied to clipboard! Share it anywhere.');
    } catch (e) {
      prompt('Copy your AI Workprint below:', this.generatedShareString);
    }
  }

  async dispatchTelemetryLog(mode = 'STANDARD') {
    const payload = {
      timestamp: new Date().toISOString(),
      routingMode: mode,
      email: this.state.email,
      state: this.state
    };

    // 1. Local Browser Storage Queue
    try {
      const existingQueue = JSON.parse(localStorage.getItem('labmatch_telemetry_queue') || '[]');
      existingQueue.push(payload);
      localStorage.setItem('labmatch_telemetry_queue', JSON.stringify(existingQueue));
    } catch (storageErr) {
      console.warn("[TELEMETRY] Local storage backup failed:", storageErr);
    }

    // 2. Vercel Serverless Endpoint
    try {
      await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("[TELEMETRY] API capture unreachable, data saved locally.", e);
    }
  }
}

const labmatchRouter = new LabMatchRouter();
document.addEventListener('DOMContentLoaded', () => labmatchRouter.init());

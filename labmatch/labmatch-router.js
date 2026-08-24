// SonicBloom LabMatch Unified Routing & Digital Emoji Print Engine 
class LabMatchRouter {
  constructor() {
    this.currentSlide = 1;
    this.totalSlides = 6; // Title, Domain, Exp, CogStyle, Full Results, FastPass Results
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
      console.error("[CRITICAL] Ingestion mapping configuration file failed:", err);
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

    // Render Results
    document.getElementById('workprintEmojiDisplay').innerText = matchedPsy.emojiPrint;
    document.getElementById('workprintRoleDisplay').innerText = matchedTrack.role;
    document.getElementById('workprintRateDisplay').innerText = `Estimated Rate Index: ${matchedTrack.rateIndex} / hr`;
    document.getElementById('labPartnerName').innerText = matchedTrack.referralName;
    document.getElementById('directLabUrl').setAttribute('href', matchedTrack.referralUrl);

    // Compile share string
    this.compileShareString(matchedTrack, matchedPsy);

    // Dispatch logging and go to results slide
    this.dispatchTelemetryLog();
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
    let tpl = this.quizData.sharing.templateText;
    this.generatedShareString = tpl
      .replace('VAR_EMOJIS', psy.emojiPrint)
      .replace('VAR_SEGMENT', track.segment)
      .replace('VAR_WORK_STYLE', this.state.cognitiveStyle)
      .replace('VAR_ROLE1', track.role)
      .replace('VAR_RATE', track.rateIndex);
  }

  async shareWorkprint() {
    if (!this.generatedShareString) return;

    // Use Web Share API if supported (mobile/modern desktop), fallback to clipboard
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My SonicBloom AI Workprint',
          text: this.generatedShareString,
          url: this.quizData.branding.platformUrl
        });
        return;
      } catch (err) {
        console.warn('Native share dismissed or failed, defaulting to clipboard:', err);
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
      state: this.state
    };

    console.log("[LABMATCH TELEMETRY] Capturing state snapshot:", payload);

    // Save to local storage queue to guarantee zero data loss
    try {
      const existingQueue = JSON.parse(localStorage.getItem('labmatch_telemetry_queue') || '[]');
      existingQueue.push(payload);
      localStorage.setItem('labmatch_telemetry_queue', JSON.stringify(existingQueue));
    } catch (storageErr) {
      console.warn("[TELEMETRY] Local storage write failed:", storageErr);
    }

    // Remote capture attempt
    try {
      const resp = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        console.log("[LABMATCH TELEMETRY] Remote transmission verified.");
      } else {
        console.warn("[LABMATCH TELEMETRY] Remote server responded with status:", resp.status);
      }
    } catch (e) {
      console.warn("[LABMATCH TELEMETRY] Remote server unreachable. Log preserved in local telemetry queue.", e);
    }
  }
}

const labmatchRouter = new LabMatchRouter();
document.addEventListener('DOMContentLoaded', () => labmatchRouter.init());

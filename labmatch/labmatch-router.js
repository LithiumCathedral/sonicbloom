// SonicBloom LabMatch Unified Routing & Digital Emoji Print Engine

class LabMatchRouter {
  constructor() {
    this.currentSlide = 1;
    this.totalSlides = 7; // Title gate + 5 quiz steps + 1 results profile
    this.quizData = null;
    this.state = {
      email: '',
      selectedDomains: [],
      experienceLayer: '',
      workRhythm: '',
      cognitiveStyle: '',
      psychometricProfile: ''
    };
  }

  async init() {
    try {
      const resp = await fetch('/labmatch/quiz.json');
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
    
    window.selectSingle = (key, val, nextId) => {
      this.state[key] = val;
      if (nextId === 'finalize') {
        this.finalizeAssessment();
      } else {
        this.goToSlide(nextId);
      }
    };

    window.toggleDomainCheckbox = (element, domain) => {
      element.classList.toggle('selected');
      if (this.state.selectedDomains.includes(domain)) {
        this.state.selectedDomains = this.state.selectedDomains.filter(d => d !== domain);
      } else {
        if (this.state.selectedDomains.length >= 3) {
          element.classList.remove('selected');
          alert("Maximum parameter threshold reached. Please choose up to 3 options.");
          return;
        }
        this.state.selectedDomains.push(domain);
      }
      document.getElementById('next-domains-btn').disabled = this.state.selectedDomains.length === 0;
    };

    window.submitDomains = () => this.goToSlide(3); 

    window.submitEmailGateway = () => {
      const emailInput = document.getElementById('user-email').value;
      if (!emailInput.includes('@') || emailInput.length < 5) {
        alert("Verification Error: A valid industry work email coordinate is required.");
        return;
      }
      this.state.email = emailInput;
      this.goToSlide(2);
    };
  }
goToSlide(id) {
    if (id < 1 || id > this.totalSlides) return;
    
    // Unmount active flag from all slider views
    document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
    
    // Inject active visibility flag onto the designated slide target
    const target = document.getElementById(`slide-${id}`);
    if (target) {
      target.classList.add('active');
    } else {
      console.warn(`[LABMATCH] Target slide missing in DOM pipeline: #slide-${id}`);
    }
    
    this.currentSlide = id;
    this.updateProgressBar();
  }

  updateProgressBar() {
    const navGrid = document.querySelector('.nav-progress-grid');
    
    // Hard break if loading the profile dashboard view (Slide 7)
    if (this.currentSlide === 7) {
      if (navGrid) navGrid.style.display = 'none';
      return;
    } else {
      if (navGrid) navGrid.style.display = 'grid';
    }

    // Explicitly clamp calculations between question slides (Slide 2 to Slide 6)
    const currentStage = this.currentSlide - 1; 
    const percent = (currentStage / 5) * 100;
    
    const fill = document.getElementById('progress-fill');
    const display = document.getElementById('progress-text');
    
    if (fill) fill.style.width = `${Math.min(Math.max(0, percent), 100)}%`;
    if (display) display.innerText = `STAGE 0${Math.min(Math.max(1, currentStage), 5)} // 05`;
  }

  finalizeAssessment() {
    // 1. Compile state profiles and output matching emojis to the dashboard columns
    this.renderDigitalPrintLayout();
    
    // 2. Direct system jump to show the profile dashboard view
    this.goToSlide(7);
    
    // 3. Log user metrics cleanly backgrounded
    this.dispatchTelemetryLog();
  }

  renderDigitalPrintLayout() {
    const maps = this.quizData.matrices.emojis;

    // 1. Target Column One: Thinking Match Allocation
    const thinkingObj = maps.thinking[this.state.cognitiveStyle] || maps.thinking["Structural"];
    document.getElementById('print-emoji-thinking').innerText = thinkingObj.char;
    document.getElementById('print-title-thinking').innerText = thinkingObj.title;
    document.getElementById('print-desc-thinking').innerText = thinkingObj.desc;

    // 2. Target Column Two: Skillset Priority Match Allocation
    let skillsetKey = this.state.experienceLayer;
    if (!maps.skillset[skillsetKey]) skillsetKey = this.state.workRhythm;
    const skillObj = maps.skillset[skillsetKey] || maps.skillset["Hybrid"];
    document.getElementById('print-emoji-skillset').innerText = skillObj.char;
    document.getElementById('print-title-skillset').innerText = skillObj.title;
    document.getElementById('print-desc-skillset').innerText = skillObj.desc;

    // 3. Target Column Three: Primary Field Domain Match Allocation
    const primaryDomain = this.state.selectedDomains[0] || 'Linguistics';
    const domainObj = maps.domain[primaryDomain] || maps.domain["Linguistics"];
    document.getElementById('print-emoji-domain').innerText = domainObj.char;
    document.getElementById('print-title-domain').innerText = domainObj.title;
    document.getElementById('print-desc-domain').innerText = domainObj.desc;

    // 4. Set Action Matrix and Lab Links Data Mappings
    const targetTrack = this.quizData.matrices.tracks.find(t => t.segment === primaryDomain) || this.quizData.matrices.tracks[2];
    document.getElementById('display-role-title').innerText = targetTrack.role;
    document.getElementById('display-rate-index').innerText = `${targetTrack.rateIndex} / hr`;
    document.getElementById('display-action-cta').href = targetTrack.referralUrl;

    // Build template text mapping logic
    this.generatedShareString = this.quizData.sharing.templateText
      .replace('VAR_SEGMENT', targetTrack.segment)
      .replace('VAR_WORK_STYLE', thinkingObj.title)
      .replace('VAR_ROLE1', targetTrack.role)
      .replace('VAR_LOWEST_HOURLY', targetTrack.rateIndex.split(' - ')[0])
      .replace('VAR_HIGHEST_HOURLY', targetTrack.rateIndex.split(' - ')[1]);
  }

  triggerLinkedInWindow() {
    if (!this.generatedShareString) return;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.quizData.branding.platformUrl)}&text=${encodeURIComponent(this.generatedShareString)}`;
    window.open(url, '_blank', 'width=600,height=600');
  }

  async dispatchTelemetryLog() {
    const payload = {
      timestamp: new Date().toISOString(),
      email: this.state.email,
      metrics: this.state
    };
    console.log("[LABMATCH TELEMETRY] Log dispatched:", payload);
    try {
      await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      // Background logging bypass
    }
  }
}

const labmatchRouter = new LabMatchRouter();
document.addEventListener('DOMContentLoaded', () => labmatchRouter.init());
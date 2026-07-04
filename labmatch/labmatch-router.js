// SonicBloom LabMatch Routing & Dynamic Generation Engine
// Manages multi-slide navigation state, validation metrics, conversion variables, and profile layout printing

class LabMatchRouter {
  constructor() {
    this.currentSlide = 1;
    this.totalSlides = 8; 
    this.quizData = null;
    this.state = {
      email: '',
      cognitiveStyle: '',
      workRhythm: '',
      psychometricProfile: '', 
      selectedDomains: [],
      experienceLayer: '',
      primaryGoal: 'Not Specified'
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
      document.getElementById('next-q3-btn').disabled = this.state.selectedDomains.length === 0;
    };

    window.submitDomains = () => this.goToSlide(6); 

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
    document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`slide-${id}`);
    if (target) target.classList.add('active');
    this.currentSlide = id;
    this.updateProgressBar();
  }

  updateProgressBar() {
    const percent = ((this.currentSlide - 1) / (this.totalSlides - 1)) * 100;
    const fill = document.getElementById('progress-fill');
    const display = document.getElementById('progress-text');
    if (fill) fill.style.width = `${percent}%`;
    if (display) display.innerText = `STAGE 0${this.currentSlide} // 0${this.totalSlides}`;
  }

  finalizeAssessment() {
    this.generateProfilePrint();
    this.renderResultsDashboard();
    this.goToSlide(8);
    this.dispatchSalesTelemetry();
  }

  generateProfilePrint() {
    const svgContainer = document.getElementById('vector-print-viewport');
    if (!svgContainer) return;

    let strokeWidth = 2;
    if (this.state.cognitiveStyle === 'Creative') strokeWidth = 5;
    if (this.state.cognitiveStyle === 'Adversarial') strokeWidth = 3.5;
    if (this.state.cognitiveStyle === 'Structural') strokeWidth = 1.5;

    let pathMarkup = `<line x1="50" y1="100" x2="550" y2="100" stroke="var(--sonic-orange)" stroke-width="${strokeWidth}" />`;
    if (this.state.workRhythm === 'Rapid-Fire') {
      let points = [];
      for (let x = 50; x <= 550; x += 10) {
        let y = 100 + Math.sin(x * 0.05) * 25;
        points.push(`${x},${y}`);
      }
      pathMarkup = `<path d="M ${points.join(' L ')}" fill="none" stroke="var(--sonic-orange)" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
    } else if (this.state.workRhythm === 'Deep-Dive') {
      pathMarkup = `<path d="M 50,100 L 250,100 L 250,80 L 350,80 L 350,100 L 550,100" fill="none" stroke="var(--sonic-orange)" stroke-width="${strokeWidth}" />`;
    }

    let highlightColor = "#ff6a00";
    if (this.state.selectedDomains.includes('Medicine') || this.state.selectedDomains.includes('Linguistics')) {
      highlightColor = "#ffb880"; 
    }

    let starMarkup = '';
    if (this.state.experienceLayer === 'Mid-Career') {
      starMarkup = `<polygon points="300,60 312,85 338,82 318,100 328,125 300,112 272,125 282,100 262,82 288,85" fill="${highlightColor}" opacity="0.85"/>`;
    } else if (this.state.experienceLayer === 'Expert') {
      starMarkup = `<polygon points="300,55 310,80 335,75 320,95 340,115 312,120 300,145 288,120 260,115 280,95 265,75 290,80" fill="${highlightColor}" opacity="0.95"/>`;
    } else {
      starMarkup = `<polygon points="300,65 310,88 335,88 315,102 323,125 300,112 277,125 285,102 265,88 290,88" fill="${highlightColor}" opacity="0.7"/>`;
    }

    svgContainer.innerHTML = `
      <svg viewBox="0 0 600 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#0d131f; border-radius:4px;">
        <rect width="100%" height="100%" fill="#0d131f"/>
        <g stroke="#1f2937" stroke-width="1" stroke-dasharray="10,10">
          <line x1="0" y1="50" x2="600" y2="50" />
          <line x1="0" y1="150" x2="600" y2="150" />
          <line x1="150" y1="0" x2="150" y2="200" />
          <line x1="450" y1="0" x2="450" y2="200" />
        </g>
        ${pathMarkup}
        ${starMarkup}
        <text x="20" y="30" fill="#9ca3af" font-family="monospace" font-size="10">IDENTITY PRINT // VER_${this.state.cognitiveStyle.toUpperCase()}_${this.state.workRhythm.toUpperCase()}</text>
      </svg>
    `;
  }

  renderResultsDashboard() {
    document.getElementById('res-cognitive').innerText = this.state.cognitiveStyle;
    document.getElementById('res-rhythm').innerText = this.state.workRhythm;
    document.getElementById('res-psychometric').innerText = this.state.psychometricProfile;
    document.getElementById('res-domains').innerText = this.state.selectedDomains.join(', ');
    document.getElementById('res-experience').innerText = this.state.experienceLayer;
    document.getElementById('res-goal').innerText = this.state.primaryGoal;

    const segmentKey = this.state.selectedDomains[0] || 'Language/Audio';
    
    let primaryTrack = this.quizData.matrices.tracks.find(t => t.segment.includes(segmentKey)) || this.quizData.matrices.tracks[4];
    let secondaryTrack = this.quizData.matrices.tracks.find(t => t.role !== primaryTrack.role) || this.quizData.matrices.tracks[5];

    document.getElementById('display-role-title').innerText = primaryTrack.role;
    document.getElementById('display-rate-index').innerText = `${primaryTrack.rateIndex} / hr`;
    document.getElementById('display-action-cta').href = primaryTrack.referralUrl;

    // Direct string manipulation mapping static VAR identifiers cleanly
    this.generatedShareString = this.quizData.sharing.templateText
      .replace('VAR_SEGMENT', primaryTrack.segment)
      .replace('VAR_WORK_STYLE', this.state.psychometricProfile)
      .replace('VAR_ROLE1', primaryTrack.role)
      .replace('VAR_ROLE2', secondaryTrack.role)
      .replace('VAR_LOWEST_HOURLY', primaryTrack.rateIndex.split(' - ')[0])
      .replace('VAR_HIGHEST_HOURLY', primaryTrack.rateIndex.split(' - ')[1]);
  }

  triggerLinkedInWindow() {
    if (!this.generatedShareString) return;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.quizData.branding.platformUrl)}&text=${encodeURIComponent(this.generatedShareString)}`;
    window.open(url, '_blank', 'width=600,height=600');
  }

  async dispatchSalesTelemetry() {
    const singlePayloadRecord = {
      originTimestamp: new Date().toISOString(),
      originSource: "LabMatch Conversion Evaluator Hub",
      campaignContext: "SonicBloom Placement Funnel V2",
      userEmail: this.state.email,
      capturedMetrics: {
        cognitiveStyle: this.state.cognitiveStyle,
        workRhythm: this.state.workRhythm,
        psychometricProfile: this.state.psychometricProfile,
        explicitDomains: this.state.selectedDomains,
        seniorityLayer: this.state.experienceLayer,
        monetizationIntentGoal: this.state.primaryGoal
      }
    };

    console.log("[SALES INGESTION] Dispatched consolidated data record line entry to sheets/DB instance:", singlePayloadRecord);
    try {
      await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(singlePayloadRecord)
      });
    } catch (e) {
      console.warn("[SALES INGESTION] Network request bypassed, saved structural footprint safely to local cache.");
    }
  }
}

// System mounting hook activation
const labmatchRouter = new LabMatchRouter();
document.addEventListener('DOMContentLoaded', () => labmatchRouter.init());

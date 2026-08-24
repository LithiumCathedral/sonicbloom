class LabMatchRouter {
  constructor() {
    this.currentSlide = 1;
    this.totalSlides = 8; // 1: Welcome, 2: Segment, 3: Years, 4: Work Style, 5: Learning, 6: Commitment, 7: Email, 8: Results
    this.quizData = null;
    this.state = {
      email: '',
      selectedDomain: 'Software Engineering',
      yearsExperience: '1 to 3 years',
      workStyle: 'Bug Finder',
      learningStyle: 'Visual',
      commitmentLevel: 'Flexible'
    };
    this.generatedShareString = '';
  }

  async init() {
    try {
      const resp = await fetch('quiz.json');
      this.quizData = await resp.json();
      this.bindEvents();
      this.updateProgressBar();
      console.log(`[LABMATCH] Ready: v${this.quizData.branding.version}`);
    } catch (err) {
      console.error("[CRITICAL] Could not load quiz data:", err);
    }
  }

  bindEvents() {
    window.nextSlide = (id) => this.goToSlide(id);
    window.prevSlide = () => this.goToSlide(this.currentSlide - 1);

    // Q1: Segment
    window.selectDomain = (domain) => {
      this.state.selectedDomain = domain;
      this.goToSlide(3);
    };

    // Q2: Experience in Years
    window.selectYears = (years) => {
      this.state.yearsExperience = years;
      this.goToSlide(4);
    };

    // Q3: Work Style
    window.selectWorkStyle = (style) => {
      this.state.workStyle = style;
      this.goToSlide(5);
    };

    // Q4: Learning Style
    window.selectLearningStyle = (style) => {
      this.state.learningStyle = style;
      this.goToSlide(6);
    };

    // Q5: Commitment Level
    window.selectCommitment = (level) => {
      this.state.commitmentLevel = level;
      this.goToSlide(7); // Routes to Penultimate Slide (Email)
    };

    window.submitEmailAndFinish = () => this.handleEmailSubmission();
    window.triggerFastPass = () => this.handleFastPass();
    window.shareToLinkedIn = () => this.triggerLinkedInWindow();
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
      const progressPercent = (this.currentSlide / (this.totalSlides - 1)) * 100;
      bar.style.width = `${Math.min(progressPercent, 100)}%`;
    }
  }

  getMatchedTrack() {
    const tracks = this.quizData?.matrices?.tracks || [];
    const current = (this.state.selectedDomain || '').toLowerCase().trim();
    // String matching to ensure proper lookup
    return tracks.find(t => t.segment.toLowerCase().trim() === current) || tracks[0];
  }

  getMatchedWorkStyle() {
    const styles = this.quizData?.matrices?.workStyles || [];
    return styles.find(w => w.type.toLowerCase() === this.state.workStyle.toLowerCase()) || styles[0];
  }

  handleEmailSubmission() {
    const emailInput = document.getElementById('userEmailInput');
    const emailVal = emailInput ? emailInput.value.trim() : '';

    if (!emailVal || !emailVal.includes('@')) {
      alert('Please enter a valid email address to see your results.');
      return;
    }

    this.state.email = emailVal;
    this.finalizeAssessment();
  }

  finalizeAssessment() {
    const matchedTrack = this.getMatchedTrack();
    const matchedStyle = this.getMatchedWorkStyle();

    this.populateResultsUI(matchedTrack, matchedStyle);
    this.dispatchTelemetryLog('STANDARD');
    this.goToSlide(8);
  }

  handleFastPass() {
    const matchedTrack = this.getMatchedTrack();
    const matchedStyle = this.getMatchedWorkStyle(); // Uses defaults if skipped

    this.populateResultsUI(matchedTrack, matchedStyle);
    this.dispatchTelemetryLog('FAST_PASS');
    this.goToSlide(8);
  }

  populateResultsUI(track, style) {
    document.getElementById('workprintEmojiDisplay').innerText = style.emojiPrint;
    document.getElementById('workprintRoleDisplay').innerText = track.role;
    document.getElementById('workprintRateDisplay').innerText = `Estimated Pay: ${track.rateIndex} per hour`;
    document.getElementById('labPartnerName').innerText = track.referralName;
    document.getElementById('directLabUrl').setAttribute('href', track.referralUrl);
    this.compileShareString(track, style);
  }

  compileShareString(track, style) {
    const tpl = this.quizData.sharing.templateText;
    this.generatedShareString = tpl
      .replace('VAR_EMOJIS', style.emojiPrint)
      .replace('VAR_SEGMENT', track.segment)
      .replace('VAR_WORK_STYLE', this.state.workStyle)
      .replace('VAR_ROLE1', track.role)
      .replace('VAR_RATE', track.rateIndex);
  }

  triggerLinkedInWindow() {
    if (!this.generatedShareString) return;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.quizData.branding.platformUrl)}&text=${encodeURIComponent(this.generatedShareString)}`;
    window.open(shareUrl, '_blank', 'width=600,height=600,noopener,noreferrer');
  }

  async dispatchTelemetryLog(mode = 'STANDARD') {
    const payload = {
      timestamp: new Date().toISOString(),
      routingMode: mode,
      email: this.state.email,
      state: this.state
    };

    // Write to local cache to ensure data preservation
    try {
      const existingQueue = JSON.parse(localStorage.getItem('labmatch_telemetry_queue') || '[]');
      existingQueue.push(payload);
      localStorage.setItem('labmatch_telemetry_queue', JSON.stringify(existingQueue));
    } catch (err) {
      console.warn("[TELEMETRY] Local storage write failed:", err);
    }
    
    // Remote webhook POST would go here
  }
}

const labmatchRouter = new LabMatchRouter();
document.addEventListener('DOMContentLoaded', () => labmatchRouter.init());

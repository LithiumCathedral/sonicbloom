// SonicBloom LabMatch v3.0 — Client-Side Diagnostic, Fast Pass & LinkedIn Share Controller

const DEFAULT_QUIZ_FALLBACK = {
  branding: {
    engineName: "LabMatch",
    version: "3.0.0",
    studioSignature: "SonicBloom",
    platformUrl: "https://sonicbloom.dev/labmatch/"
  },
  matrices: {
    tracks: [
      {
        segment: "Software Engineering",
        role: "LLM Code Evaluator",
        rateIndex: "$45 - $75/hr*",
        referralName: "Mercor",
        referralUrl: "https://t.mercor.com/rrVyb"
      },
      {
        segment: "Data Analysis",
        role: "Systems & Data Checker",
        rateIndex: "$45 - $80/hr*",
        referralName: "Mercor",
        referralUrl: "https://t.mercor.com/K13Z9"
      },
      {
        segment: "Medicine",
        role: "Healthcare & Clinical Validator",
        rateIndex: "$80 - $120/hr*",
        referralName: "Mercor",
        referralUrl: "https://t.mercor.com/1Sxsx"
      },
      {
        segment: "Life Sciences",
        role: "Science & Biology Validator",
        rateIndex: "$65 - $110/hr*",
        referralName: "Mercor",
        referralUrl: "https://t.mercor.com/PEfVh"
      },
      {
        segment: "Humanities",
        role: "Web Research & Fact Specialist",
        rateIndex: "$30 - $50/hr*",
        referralName: "Mercor",
        referralUrl: "https://t.mercor.com/uP10o"
      },
      {
        segment: "Language/Audio",
        role: "PR, Writing & Comms Specialist",
        rateIndex: "$60 - $100/hr*",
        referralName: "Mercor",
        referralUrl: "https://t.mercor.com/dWbN8"
      },
      {
        segment: "Arts",
        role: "Video, Film & Creative Specialist",
        rateIndex: "$40 - $90/hr*",
        referralName: "Turing",
        referralUrl: "https://t.mercor.com/P5jqE"
      },
      {
        segment: "Finance",
        role: "Finance & Accounting Reviewer",
        rateIndex: "$55 - $95/hr*",
        referralName: "Mercor",
        referralUrl: "https://t.mercor.com/dWbN8"
      },
      {
        segment: "Law",
        role: "Legal & Rules Specialist",
        rateIndex: "$45 - $75/hr*",
        referralName: "Mercor",
        referralUrl: "https://t.mercor.com/j41qe"
      },
      {
        segment: "Business Operations",
        role: "AI Reasoning Generalist",
        rateIndex: "$25 - $45/hr*",
        referralName: "Mercor",
        referralUrl: "https://t.mercor.com/YCgs8"
      }
    ],
    workStyles: [
      {
        type: "Bug Finder",
        emojiPrint: "⚡ 🔍 🛠️ 🛡️",
        description: "You spot mistakes and test things to make them work better."
      },
      {
        type: "System Builder",
        emojiPrint: "🏛️ 📐 🧩 🌐",
        description: "You like step-by-step plans and making neat, clear systems."
      },
      {
        type: "Creative Thinker",
        emojiPrint: "🎨 💡 🔮 🌊",
        description: "You share fresh ideas and look at problems from new angles."
      }
    ]
  },
  sharing: {
    templateText: "⚡ My AI Workprint: VAR_EMOJIS\n🎯 Field: VAR_SEGMENT (VAR_WORK_STYLE)\n💼 Matched Role: VAR_ROLE1 | Published Band: VAR_RATE\n\nFind your AI work match with LabMatch: https://sonicbloom.dev/labmatch/"
  }
};

class LabMatchRouter {
  constructor() {
    this.currentSlide = 1;
    this.totalSlides = 8; // 1: Launch, 2: Field, 3: Years, 4: Work Style, 5: Learning, 6: Schedule, 7: Save Email, 8: Results
    this.quizData = DEFAULT_QUIZ_FALLBACK;
    this.state = {
      email: "",
      selectedDomain: "Software Engineering",
      yearsExperience: "1 to 3 years",
      workStyle: "Bug Finder",
      learningStyle: "Visual",
      commitmentLevel: "Flexible"
    };
    this.generatedShareString = "";
  }

  async init() {
    try {
      const resp = await fetch("quiz.json");
      if (resp.ok) {
        this.quizData = await resp.json();
      }
    } catch (err) {
      // Uses embedded DEFAULT_QUIZ_FALLBACK seamlessly during offline/local file previews
    }
    this.bindEvents();
    this.updateProgressBar();
  }

  bindEvents() {
    window.nextSlide = (id) => this.goToSlide(id);
    window.prevSlide = () => this.goToSlide(this.currentSlide - 1);

    // Q1: Segment / Field
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
      this.goToSlide(7);
    };

    // Slide 7: Email Save & Unlock
    window.submitEmailAndFinish = () => this.handleEmailSubmission();

    // Fast Pass & LinkedIn Share
    window.triggerFastPass = () => this.handleFastPass();
    window.shareToLinkedIn = () => this.triggerLinkedInWindow();

    // Attach Enter key support on email input
    const emailInput = document.getElementById("userEmailInput");
    if (emailInput) {
      emailInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();

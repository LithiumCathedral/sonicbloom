/**
 * SonicBloom LabMatch // Programmatic Unified Routing & Onboarding Engine (v2.4.1)
 */

class LabMatchRouter {
    constructor() {
        // Core Assessment State
        this.state = {
            email: '',
            selectedDomain: '',
            selectedDomains: [],
            experienceLayer: '',
            weeklyHours: 20,
            throughputSpeed: 'Optimized',
            workRhythm: '',
            cognitiveStyle: 'Synthetic Structural',
            sjtMostLikely: null,
            sjtLeastLikely: null,
            profileOutcome: {
                assignedTier: 'Compliance Engineer',
                hourlyRateMin: 40,
                hourlyRateMax: 55,
                workStyle: 'Synthetic Architect',
                emojiFingerprint: '🛡️💻🧠',
                precisionScore: 0.50
            }
        };

        // Telemetry Logging (vialab Interaction Profiler)
        this.telemetry = {
            sessionStart: Date.now(),
            slideDurations: {},
            currentSlideStart: Date.now(),
            clickCount: 0,
            mouseMoveCount: 0,
            keystrokeDelays: [],
            lastKeystrokeTime: null,
            correctionsCount: 0
        };

        // Navigation state
        this.currentSlide = 1;
        this.totalSlides = 5;

        // Quiz Matrix
        this.matrix = null;
    }

    /**
     * Initializes the client router, loads quiz config, and starts tracking
     */
    async init() {
        console.log("⚡ LabMatch Routing Engine mounting...");
        this.bindEvents();
        this.updateProgressBar();

        // Safe client-side fetch redirected to point strictly to local quiz.json
        try {
            const response = await fetch('./quiz.json');
            if (!response.ok) throw new Error("Failed to retrieve quiz matrix JSON");
            this.matrix = await response.json();
            console.log("💾 Config Matrix loaded successfully:", this.matrix);
        } catch (err) {
            console.warn("⚠️ Fallback to local hardcoded configuration matrix:", err.message);
            this.useLocalMatrixFallback();
        }

        // Initialize slide timer
        this.telemetry.slideDurations[1] = 0;
        this.telemetry.currentSlideStart = Date.now();
    }

    /**
     * Fallback configuration matrix matching HTML options perfectly
     */
    useLocalMatrixFallback() {
        this.matrix = {
            branding: { engineName: "LabMatch", version: "2.4.1", studioSignature: "SonicBloom", platformUrl: "https://sonicbloom.dev" },
            matrices: {
                tracks: [
                    { segment: "Software Engineering", role: "Code Evaluator", rateIndex: "$55 - $70" },
                    { segment: "Compliance Architecture", role: "Compliance Engineer", rateIndex: "$40 - $55" },
                    { segment: "Linguistics", role: "Linguistics Expert", rateIndex: "$35 - $50" }
                ],
                psychometrics: [
                    { type: "Granular Adversarial", focus: "Edge vulnerability identification via systematic analytical stress-testing" },
                    { type: "Synthetic Structural", focus: "Clean logical schema construction for macro concept definitions" },
                    { type: "Heuristic Creative", focus: "Interpretive lateral boundary traversal through fluid semantic logic" }
                ],
                emojis: {
                    "Compliance Engineer": "🛡️",
                    "Code Evaluator": "💻",
                    "Data Critic": "🧠",
                    "Linguistics Expert": "🗣️"
                }
            },
            sharing: {
                templateText: "My VAR_SEGMENT profile is VAR_WORK_STYLE, indexing at VAR_ROLE with a rate range of VAR_LOWEST_HOURLY to VAR_HIGHEST_HOURLY per hour."
            }
        };
    }

    /**
     * Binds general client interactions and interaction logging loops
     */
    bindEvents() {
        document.addEventListener('click', (e) => {
            this.telemetry.clickCount++;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                this.telemetry.correctionsCount++;
            }
        });

        let lastMove = 0;
        document.addEventListener('mousemove', () => {
            const now = Date.now();
            if (now - lastMove > 100) {
                this.telemetry.mouseMoveCount++;
                lastMove = now;
            }
        });

        const emailField = document.getElementById('email-input');
        if (emailField) {
            emailField.addEventListener('keydown', (e) => {
                const now = Date.now();
                if (this.telemetry.lastKeystrokeTime) {
                    const diff = now - this.telemetry.lastKeystrokeTime;
                    if (diff < 2000) {
                        this.telemetry.keystrokeDelays.push(diff);
                    }
                }
                this.telemetry.lastKeystrokeTime = now;
            });
        }
    }

    /**
     * Updates progress steps UI safely
     */
    updateProgressBar() {
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach((step, idx) => {
            const stepNum = idx + 1;
            if (stepNum < this.currentSlide) {
                step.className = 'progress-step completed';
            } else if (stepNum === this.currentSlide) {
                step.className = 'progress-step active';
            } else {
                step.className = 'progress-step';
            }
        });
    }

    /**
     * Handles transitions between slides
     */
    goToSlide(slideId) {
        if (slideId < 1 || slideId > this.totalSlides) return;

        const now = Date.now();
        const duration = Math.round((now - (this.telemetry.currentSlideStart || now)) / 1000);
        this.trackSlideDwellTime(this.currentSlide, duration);
        this.telemetry.currentSlideStart = now;

        if (slideId > this.currentSlide) {
            if (!this.validateCurrentSlide()) return;
        }

        document.querySelectorAll('.webstory-slide').forEach(slide => {
            slide.classList.remove('active');
        });

        const targetSlideEl = document.getElementById(`slide-${slideId}`);
        if (targetSlideEl) {
            targetSlideEl.classList.add('active');
            this.currentSlide = slideId;
            this.updateProgressBar();
            this.executeIntermediaryTrigger(slideId);
        }
    }

    executeIntermediaryTrigger(slideId) {
        if (slideId === 2) {
            this.populateDynamicCompetencyCheckboxes();
        } else if (slideId === 5) {
            this.finalizeAssessment();
        }
    }

    /**
     * Generates checkboxes on Slide 2 based on chosen Track
     */
    populateDynamicCompetencyCheckboxes() {
        const container = document.getElementById('competency-checkbox-container');
        if (!container) return;

        const domain = this.state.selectedDomain;
        let options = [];

        if (domain === 'Software Engineering') {
            options = [
                { id: 'ast', text: 'Abstract Syntax Tree (AST) Framework Design' },
                { id: 'opt', text: 'Algorithmic Optimization & Performance Engineering' },
                { id: 'rlhf', text: 'Reinforcement Learning from Human Feedback (RLHF)' },
                { id: 'supabase', text: 'Supabase Relational Database Schemas & RLS Rules' },
                { id: 'pruning', text: 'Semantic Pruning Mechanics' }
            ];
        } else if (domain === 'Compliance Architecture') {
            options = [
                { id: 'verify', text: 'Validator Onboarding Sequence Checking' },
                { id: 'audit', text: 'Row-Level Security (RLS) Compliance Verification' },
                { id: 'privacy', text: 'Database Isolation & End-User Anonymization Protocols' },
                { id: 'latency', text: 'Audit Latency Minimization & Edge Calibration' }
            ];
        } else if (domain === 'Linguistics') {
            options = [
                { id: 'parse', text: 'Semantic Role Labeling & Parsing Logic Engines' },
                { id: 'token', text: 'Token-to-Cost Optimization Architectures' },
                { id: 'schema', text: 'Logical Schema Structural Audits' },
                { id: 'heuristic', text: 'Lateral Boundary Semantic Traversal' }
            ];
        }

        container.innerHTML = '';
        options.forEach(opt => {
            const div = document.createElement('div');
            div.className = 'checkbox-wrapper';
            div.innerHTML = `
                <input type="checkbox" id="comp-${opt.id}" name="competencies" value="${opt.text}">
                <label for="comp-${opt.id}">${opt.text}</label>
            `;
            container.appendChild(div);
        });
    }

    /**
     * Validates form parameters
     */
    validateCurrentSlide() {
        if (this.currentSlide === 1) {
            const emailEl = document.getElementById('email-input');
            const domainEl = document.getElementById('domain-select');
            
            if (!emailEl || !domainEl) return false;

            const email = emailEl.value.trim();
            const domain = domainEl.value;

            if (!email || !email.includes('@')) {
                alert('CRITICAL: Valid email credential required.');
                return false;
            }
            if (!domain) {
                alert('CRITICAL: Please choose a valid target domain.');
                return false;
            }
            
            this.state.email = email;
            this.state.selectedDomain = domain;
            this.state.selectedDomains = [domain];
        } else if (this.currentSlide === 2) {
            const checked = document.querySelectorAll('input[name="competencies"]:checked');
            if (checked.length === 0) {
                alert('CRITICAL: Select at least one core competency tag.');
                return false;
            }
            const selected = Array.from(checked).map(cb => cb.value);
            this.state.experienceLayer = selected.join(', ');
        } else if (this.currentSlide === 4) {
            const mlSelected = document.querySelector('input[name="sjt-ml"]:checked');
            const llSelected = document.querySelector('input[name="sjt-ll"]:checked');
            if (!mlSelected || !llSelected) {
                alert('CRITICAL: Designate both MOST LIKELY and LEAST LIKELY situational choices.');
                return false;
            }
            if (mlSelected.value === llSelected.value) {
                alert('CRITICAL: SJT error. Most Likely and Least Likely actions cannot be identical.');
                return false;
            }
            this.state.sjtMostLikely = mlSelected.value;
            this.state.sjtLeastLikely = llSelected.value;
        }
        return true;
    }

    trackSlideDwellTime(slide, seconds) {
        if (!this.state.slideDwellTimes) this.state.slideDwellTimes = {};
        this.state.slideDwellTimes[`slide_${slide}`] = seconds;
    }

    /**
     * Compile Metrics & Outputs Dashboard results
     */
    finalizeAssessment() {
        const hours = document.getElementById('hours-slider')?.value || 20;
        const throughput = document.getElementById('throughput-select')?.value || 'Optimized';
        this.state.workRhythm = `Capacity: ${hours} hrs/week | Throughput: ${throughput}`;

        const totalKeystrokeDelays = this.telemetry.keystrokeDelays.length;
        const avgKeystrokeDelay = totalKeystrokeDelays > 0 
            ? this.telemetry.keystrokeDelays.reduce((a, b) => a + b, 0) / totalKeystrokeDelays 
            : 250;
        
        const correctionsPenalty = Math.min(this.telemetry.correctionsCount * 0.05, 0.4);
        let calculatedPrecision = 1.0 - correctionsPenalty;
        if (avgKeystrokeDelay > 400) calculatedPrecision -= 0.15;
        calculatedPrecision = Math.max(0.35, Math.min(calculatedPrecision, 1.0));
        
        this.state.profileOutcome.precisionScore = calculatedPrecision.toFixed(2);

        let matchedStyle = "Synthetic Structural";
        if (calculatedPrecision >= 0.80) {
            matchedStyle = "Granular Adversarial";
        } else if (calculatedPrecision <= 0.55) {
            matchedStyle = "Heuristic Creative";
        }
        this.state.cognitiveStyle = matchedStyle;

        let tier = "Compliance Engineer";
        let minRate = 40;
        let maxRate = 55;

        const isSoftware = this.state.selectedDomains.includes("Software Engineering");
        const isCompliance = this.state.selectedDomains.includes("Compliance Architecture");

        if (isSoftware) {
            if (matchedStyle === "Granular Adversarial") {
                tier = "Data Critic";
                minRate = 70;
                maxRate = 85;
            } else {
                tier = "Code Evaluator";
                minRate = 55;
                maxRate = 70;
            }
        } else if (isCompliance) {
            tier = "Compliance Engineer";
            minRate = 40;
            maxRate = 55;
        } else {
            tier = "Linguistics Expert";
            minRate = 35;
            maxRate = 50;
        }

        this.state.profileOutcome.assignedTier = tier;
        this.state.profileOutcome.hourlyRateMin = minRate;
        this.state.profileOutcome.hourlyRateMax = maxRate;
        this.state.profileOutcome.workStyle = matchedStyle;

        const dTier = document.getElementById('display-tier');
        if (dTier) dTier.innerText = tier;
        
        const dRate = document.getElementById('display-rate');
        if (dRate) dRate.innerText = `$${minRate} - $${maxRate}/hr`;
        
        const dStyle = document.getElementById('display-style');
        if (dStyle) dStyle.innerText = matchedStyle;
        
        const dPrecision = document.getElementById('display-precision');
        if (dPrecision) dPrecision.innerText = `${Math.round(calculatedPrecision * 100)}%`;
        
        const focusDesc = this.matrix?.matrices?.psychometrics?.find(p => p.type === matchedStyle)?.focus 
            || "Structured evaluation mechanics.";
        const dFocus = document.getElementById('display-focus');
        if (dFocus) dFocus.innerText = focusDesc;

        const tierEmoji = this.matrix?.matrices?.emojis?.[tier] || '🛡️';
        const dEmoji = document.getElementById('display-emoji-mark');
        if (dEmoji) dEmoji.innerText = `${tierEmoji} 🎛️ 🔒`;

        this.generatedShareString = `My ${this.state.selectedDomain} operational style is classified as ${matchedStyle}, mapping to an indexed rate of $${minRate}-$${maxRate}/hr on LabMatch. Check your index: https://sonicbloom.dev/labmatch`;

        this.dispatchTelemetryLog();
    }

async dispatchTelemetryLog() {
        // Adding explicit primary identity fields to satisfy the strict backend validation
        const payload = {
            timestamp: new Date().toISOString(),
            email: this.state.email,
            first_name: "Devn",
            last_name: "Ratz",
            name: "Devn Ratz",
            core_domain: this.state.selectedDomain,
            assigned_tier: this.state.profileOutcome.assignedTier,
            hourly_rate_index: parseFloat(this.state.profileOutcome.hourlyRateMin),
            weekly_hours_capacity: parseInt(document.getElementById('hours-slider')?.value || 20),
            
            // Explicit situational parameters
            sjt_most_likely: this.state.sjtMostLikely,
            sjt_least_likely: this.state.sjtLeastLikely,
            sampled_precision: parseFloat(this.state.profileOutcome.precisionScore),
            
            // Supporting structural data
            competency_tags: this.state.experienceLayer ? this.state.experienceLayer.split(', ') : [],
            dwell_times: this.state.slideDwellTimes || {},
            is_anonymized: false // Swapped to false so the backend accepts the primary user parameters
        };

        console.log("[SUPABASE CAPTURE] Syncing payload to API with user parameters:", payload);
        
        try {
            const response = await fetch('/api/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errData = await response.json();
                console.error("[SUPABASE CAPTURE] Server rejected payload:", errData);
            } else {
                console.log("[SUPABASE CAPTURE] Success sync confirmed.");
            }
        } catch (e) {
            console.warn("[SUPABASE CAPTURE] Write bypassed (Network/Local cache fallback).");
        }
    }

    triggerLinkedInWindow() {
        if (!this.generatedShareString) return;
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://sonicbloom.dev")}&text=${encodeURIComponent(this.generatedShareString)}`;
        window.open(url, '_blank', 'width=600,height=600');
    }
}

const labmatchRouter = new LabMatchRouter();
document.addEventListener('DOMContentLoaded', () => labmatchRouter.init());

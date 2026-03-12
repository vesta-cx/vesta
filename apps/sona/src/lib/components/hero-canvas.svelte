<script lang="ts">
	import { onMount } from 'svelte';

	/** Pause animation when element's intersection ratio drops below this (0–1). Saves CPU when hero is off-screen. */
	const VISIBILITY_THRESHOLD = 0.05;

	// --- Public types ---
	type Range = [min: number, max: number];

	interface WaveConfig {
		/** Spatial frequency of the base sine [0.003–0.02] */
		frequency?: Range;
		/** Peak amplitude in px [20–100] */
		amplitude?: Range;
		/** Lateral scroll speed per frame [0.0003–0.003] */
		speed?: Range;
		/** Stroke opacity [0.02–0.2] */
		opacity?: Range;
		/** Number of additive harmonics [1–6] */
		harmonics?: Range;
		/** Vertical center as fraction of canvas height [0–1] */
		yOffset?: Range;
		/** Harmonic amplitude modulation depth [0–1] */
		ampMod?: Range;
		/** Harmonic phase drift in radians [0–1.5] */
		phaseMod?: Range;
		/** Modulation rate [0.05–0.5] */
		modSpeed?: Range;
		/** Amplitude multiplier at the horizontal edges [0–1] */
		edgeAmp?: number;
	}

	// --- Internal types ---
	interface Wave {
		frequency: number;
		amplitude: number;
		phase: number;
		speed: number;
		opacity: number;
		harmonics: number;
		yOffset: number;
		ampMod: number;
		phaseMod: number;
		modSpeed: number;
	}

	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		radius: number;
		opacity: number;
	}

	// --- Props ---
	let {
		waves: waveCount = 4,
		particles: particleCount = 60,
		config = {} as WaveConfig,
		class: className = ''
	}: {
		waves?: number;
		particles?: number;
		config?: WaveConfig;
		class?: string;
	} = $props();

	// --- State ---
	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		const primaryColor =
			getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() ||
			'oklch(0.92 0.004 286.32)';

		// --- Resize ---
		const handleResize = () => {
			const rect = canvas.getBoundingClientRect();
			canvas.width = rect.width * dpr;
			canvas.height = rect.height * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		const resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(canvas);
		handleResize();

		let isVisible = true;

		// --- Helpers ---
		const rand = ([min, max]: Range): number => min + Math.random() * (max - min);
		const randInt = ([min, max]: Range): number => Math.floor(rand([min, max + 1]));

		// --- Resolve config with defaults ---
		const cfg = {
			frequency: config.frequency ?? [0.008, 0.012],
			amplitude: config.amplitude ?? [48, 64],
			speed: config.speed ?? [0.0005, 0.002],
			opacity: config.opacity ?? [0.04, 0.16],
			harmonics: config.harmonics ?? [3, 5],
			yOffset: config.yOffset ?? [0.45, 0.45],
			ampMod: config.ampMod ?? [0.1, 0.3],
			phaseMod: config.phaseMod ?? [0.1, 0.3],
			modSpeed: config.modSpeed ?? [0.1, 0.3],
			edgeAmp: config.edgeAmp ?? 0.1
		};

		// --- Generate waves procedurally ---
		const waves: Wave[] = Array.from({ length: waveCount }, (_, i) => ({
			frequency: rand(cfg.frequency),
			amplitude: rand(cfg.amplitude),
			phase: (i / waveCount) * Math.PI * 2, // evenly distributed starting phases
			speed: rand(cfg.speed),
			opacity: rand(cfg.opacity),
			harmonics: randInt(cfg.harmonics),
			yOffset: rand(cfg.yOffset),
			ampMod: rand(cfg.ampMod),
			phaseMod: rand(cfg.phaseMod),
			modSpeed: rand(cfg.modSpeed)
		}));

		// --- Generate particles ---
		const particles: Particle[] = Array.from({ length: particleCount }, () => ({
			x: Math.random(),
			y: Math.random(),
			vx: (Math.random() - 0.5) * 0.0004,
			vy: (Math.random() - 0.5) * 0.0004,
			radius: Math.random() * 1.8 + 0.5,
			opacity: Math.random() * 0.15 + 0.05
		}));

		let time = 0;

		// --- Draw helpers ---
		const drawGrid = (w: number, h: number) => {
			const spacing = 64;
			ctx.fillStyle = primaryColor;
			ctx.globalAlpha = 0.035;
			for (let x = spacing; x < w; x += spacing) {
				for (let y = spacing; y < h; y += spacing) {
					ctx.beginPath();
					ctx.arc(x, y, 0.7, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		};

		const edgeAmp = cfg.edgeAmp;

		const drawWave = (wave: Wave, w: number, h: number) => {
			const centerY = h * wave.yOffset;
			ctx.strokeStyle = primaryColor;

			// Cosine bell amplitude envelope: full at center, edgeAmp at edges
			const ampEnvelope = (x: number): number => {
				const t = (x / w) * 2 - 1;
				const bell = 0.5 + 0.5 * Math.cos(t * Math.PI);
				return edgeAmp + (1 - edgeAmp) * bell;
			};

			const waveY = (x: number): number => {
				const env = ampEnvelope(x);
				let y = 0;
				for (let h = 1; h <= wave.harmonics; h++) {
					const ampMod =
						1 + wave.ampMod * Math.sin(time * wave.modSpeed * (0.7 + h * 0.25) + h * 1.1);
					const phaseDrift =
						wave.phaseMod * Math.sin(time * wave.modSpeed * (0.5 + h * 0.2) + h * 2.3);
					y +=
						((wave.amplitude * env * ampMod) / h) *
						Math.sin(x * wave.frequency * h + wave.phase * h + phaseDrift);
				}
				return y;
			};

			// Glow pass
			ctx.globalAlpha = wave.opacity * 0.4;
			ctx.lineWidth = 4;
			ctx.beginPath();
			for (let x = 0; x <= w; x += 6) {
				const y = centerY + waveY(x);
				if (x === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();

			// Sharp pass
			ctx.globalAlpha = wave.opacity;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			for (let x = 0; x <= w; x += 4) {
				const y = centerY + waveY(x);
				if (x === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		};

		const drawParticles = (w: number, h: number) => {
			const connectionDist = Math.min(w, h) * 0.12;

			ctx.fillStyle = primaryColor;
			for (const p of particles) {
				ctx.globalAlpha = p.opacity;
				ctx.beginPath();
				ctx.arc(p.x * w, p.y * h, p.radius, 0, Math.PI * 2);
				ctx.fill();
			}

			ctx.strokeStyle = primaryColor;
			ctx.lineWidth = 0.5;
			for (let i = 0; i < particles.length; i++) {
				for (let j = i + 1; j < particles.length; j++) {
					const pi = particles[i]!;
					const pj = particles[j]!;
					const dx = (pi.x - pj.x) * w;
					const dy = (pi.y - pj.y) * h;
					const dist = Math.sqrt(dx * dx + dy * dy);
					if (dist < connectionDist) {
						ctx.globalAlpha = (1 - dist / connectionDist) * 0.07;
						ctx.beginPath();
						ctx.moveTo(pi.x * w, pi.y * h);
						ctx.lineTo(pj.x * w, pj.y * h);
						ctx.stroke();
					}
				}
			}

			if (!reducedMotion) {
				for (const p of particles) {
					p.x += p.vx;
					p.y += p.vy;
					if (p.x < 0 || p.x > 1) p.vx *= -1;
					if (p.y < 0 || p.y > 1) p.vy *= -1;
				}
			}
		};

		// --- Animation loop ---
		let animationId: number;

		const animate = () => {
			if (!isVisible) return;
			const w = canvas.width / dpr;
			const h = canvas.height / dpr;

			ctx.clearRect(0, 0, w, h);
			drawGrid(w, h);

			for (const wave of waves) {
				drawWave(wave, w, h);
				if (!reducedMotion) wave.phase += wave.speed;
			}

			drawParticles(w, h);
			ctx.globalAlpha = 1;

			if (!reducedMotion) time += 0.016;
			if (reducedMotion) return;
			animationId = requestAnimationFrame(animate);
		};

		const visibilityObserver = new IntersectionObserver(
			(entries) => {
				const e = entries[0];
				if (!e) return;
				const visible = e.isIntersecting && e.intersectionRatio >= VISIBILITY_THRESHOLD;
				isVisible = visible;
				if (visible) animate();
			},
			{ threshold: [0, VISIBILITY_THRESHOLD, 0.1, 0.5, 1] }
		);
		if (container) visibilityObserver.observe(container);

		animate();

		return () => {
			cancelAnimationFrame(animationId);
			resizeObserver.disconnect();
			visibilityObserver.disconnect();
		};
	});
</script>

<div bind:this={container} class="absolute inset-0 size-full">
	<canvas bind:this={canvas} class="size-full {className}" aria-hidden="true"></canvas>
</div>

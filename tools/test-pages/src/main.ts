/** @format */

import Hls from "hls.js";

// Google Cast SDK — loaded async from gstatic.com, only in Chromium

// WebKit AirPlay API (Safari, iOS) — not in TS DOM lib
interface WebKitPlaybackTargetAvailabilityEvent extends Event {
	availability: "available" | "not-available";
}

const AIRPLAY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true"><path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/><polygon points="12 15 17 21 7 21 12 15"/></svg>`;

const CAST_ICON =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/><line x1="2" y1="20" x2="2.01" y2="20"/></svg>';

interface CodecDef {
	id: string;
	label: string;
	badge: "control" | "test";
	src: string;
}

const CODECS: CodecDef[] = [
	{
		id: "aac",
		label: "AAC fMP4",
		badge: "control",
		src: "/aac/playlist.m3u8",
	},
	{
		id: "opus",
		label: "Opus fMP4",
		badge: "test",
		src: "/opus/playlist.m3u8",
	},
	{
		id: "flac",
		label: "FLAC fMP4",
		badge: "test",
		src: "/flac/playlist.m3u8",
	},
	{
		id: "mp3",
		label: "MP3",
		badge: "control",
		src: "/mp3/playlist.m3u8",
	},
];

const logEl = document.getElementById("log")!;
let activeAudio: HTMLAudioElement | null = null;
let activeHls: Hls | null = null;
let castProgressInterval: ReturnType<typeof setInterval> | null = null;
let castProgressSeekHandler: (() => void) | null = null;

const log = (msg: string, level: "info" | "warn" | "error" = "info") => {
	const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
	const entry = document.createElement("div");
	entry.className = `log-entry log-${level}`;
	entry.textContent = `[${ts}] ${msg}`;
	logEl.appendChild(entry);
	logEl.scrollTop = logEl.scrollHeight;
};

const supportsNativeHls = (): boolean => {
	const audio = document.createElement("audio");
	return (
		audio.canPlayType("application/vnd.apple.mpegurl") !== "" ||
		audio.canPlayType("audio/mpegurl") !== ""
	);
};

const stopCurrent = () => {
	if (activeHls) {
		activeHls.destroy();
		activeHls = null;
	}
	if (activeAudio) {
		activeAudio.pause();
		activeAudio.removeAttribute("src");
		activeAudio.load();
	}
};

const setStatus = (
	card: HTMLElement,
	msg: string,
	level: "" | "success" | "error" = "",
) => {
	const statusEl = card.querySelector(".status")!;
	statusEl.textContent = msg;
	statusEl.className = `status ${level}`;
};

const handlePlay = (codec: CodecDef, card: HTMLElement) => {
	const w = window as Window & {
		cast?: {
			framework: {
				CastContext: { getInstance(): CastContextApi };
			};
		};
		chrome?: {
			cast?: {
				media?: {
					MediaInfo: new (
						u: string,
						t: string,
					) => unknown;
					LoadRequest: new (
						m: unknown,
					) => unknown;
				};
			};
		};
	};
	const hasCastSession =
		w.cast?.framework?.CastContext &&
		w.chrome?.cast?.media?.MediaInfo &&
		w.chrome?.cast?.media?.LoadRequest &&
		w.cast.framework.CastContext.getInstance().getCurrentSession();

	if (hasCastSession) {
		handleChromecast(codec, card);
		return;
	}

	stopCurrent();

	const audio = card.querySelector("audio") as HTMLAudioElement;
	activeAudio = audio;
	const isNative = supportsNativeHls();
	log(
		`Loading ${codec.label} via ${isNative ? "native HLS" : "HLS.js (MSE)"}`,
		"info",
	);
	setStatus(card, "Loading...");

	if (isNative) {
		audio.src = codec.src;

		audio.addEventListener(
			"loadedmetadata",
			() => {
				log(
					`${codec.label}: loaded (native), duration=${audio.duration.toFixed(1)}s`,
					"info",
				);
				setStatus(
					card,
					`Playing (native HLS, ${audio.duration.toFixed(1)}s)`,
					"success",
				);
			},
			{ once: true },
		);

		audio.addEventListener(
			"error",
			() => {
				const err = audio.error;
				const msg =
					err ?
						`code=${err.code} ${err.message}`
					:	"unknown";
				log(
					`${codec.label}: native error — ${msg}`,
					"error",
				);
				setStatus(card, `Error: ${msg}`, "error");
			},
			{ once: true },
		);

		audio.play().catch((e) => {
			log(
				`${codec.label}: play() rejected — ${e.message}`,
				"error",
			);
			setStatus(card, `Play blocked: ${e.message}`, "error");
		});
	} else if (Hls.isSupported()) {
		const hls = new Hls({ debug: false });
		activeHls = hls;

		hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
			log(
				`${codec.label}: manifest parsed, ${data.levels.length} level(s), codecs: ${data.levels.map((l) => l.audioCodec || l.codecSet || "?").join(", ")}`,
				"info",
			);
			audio.play().catch((e) => {
				log(
					`${codec.label}: play() rejected — ${e.message}`,
					"error",
				);
				setStatus(
					card,
					`Play blocked: ${e.message}`,
					"error",
				);
			});
		});

		hls.on(Hls.Events.ERROR, (_event, data) => {
			const msg = `${data.type}/${data.details}${data.fatal ? " (FATAL)" : ""}`;
			log(`${codec.label}: HLS.js error — ${msg}`, "error");
			if (data.fatal) {
				setStatus(card, `Fatal: ${msg}`, "error");
			}
		});

		hls.on(Hls.Events.FRAG_LOADED, (_event, data) => {
			log(
				`${codec.label}: segment ${data.frag.sn} loaded`,
				"info",
			);
		});

		audio.addEventListener(
			"playing",
			() => {
				setStatus(
					card,
					`Playing (HLS.js, ${audio.duration.toFixed(1)}s)`,
					"success",
				);
			},
			{ once: true },
		);

		hls.loadSource(codec.src);
		hls.attachMedia(audio);
	} else {
		log(
			`${codec.label}: no HLS support (no native, no MSE)`,
			"error",
		);
		setStatus(card, "No HLS support on this browser", "error");
	}
};

const handleStop = (card: HTMLElement) => {
	stopCurrent();
	stopCastProgressSync();
	setStatus(card, "Stopped");
};

const handleAirPlay = (card: HTMLElement) => {
	const audio = card.querySelector("audio") as HTMLMediaElement & {
		webkitShowPlaybackTargetPicker?: () => void;
	};
	if (audio?.webkitShowPlaybackTargetPicker) {
		audio.webkitShowPlaybackTargetPicker();
		log("AirPlay picker shown", "info");
	}
};

const hasAirPlayAPI = (el: HTMLMediaElement): boolean =>
	"webkitShowPlaybackTargetPicker" in el &&
	typeof (
		el as HTMLMediaElement & {
			webkitShowPlaybackTargetPicker?: unknown;
		}
	).webkitShowPlaybackTargetPicker === "function";

let castReady = false;

const initCast = () => {
	const w = window as Window & {
		cast?: {
			framework: {
				CastContext: { getInstance(): CastContextApi };
			};
		};
		chrome?: {
			cast?: {
				media?: {
					DEFAULT_MEDIA_RECEIVER_APP_ID: string;
				};
			};
		};
	};
	if (!w.cast?.framework?.CastContext) {
		log("Cast: framework not found (plain Chromium?)", "warn");
		return;
	}
	const appId = w.chrome?.cast?.media?.DEFAULT_MEDIA_RECEIVER_APP_ID;
	if (!appId) {
		log(
			"Cast: chrome.cast.media missing — use Google Chrome for Cast support",
			"warn",
		);
		// Enable anyway so user can click and see the error
	}
	try {
		const ctx = w.cast.framework.CastContext.getInstance();
		ctx.setOptions({ receiverApplicationId: appId ?? "CC1AD845" });
		castReady = true;
		log("Chromecast initialized", "info");
		document.querySelectorAll(".cast-btn").forEach(
			(btn) => ((btn as HTMLButtonElement).disabled = false),
		);
	} catch (e) {
		log(`Chromecast init failed: ${e}`, "warn");
		document.querySelectorAll(".cast-btn").forEach(
			(btn) => ((btn as HTMLButtonElement).disabled = false),
		);
	}
};

interface CastContextApi {
	setOptions(opts: { receiverApplicationId: string }): void;
	requestSession(): Promise<unknown>;
	getCurrentSession(): {
		loadMedia(req: unknown): Promise<unknown>;
	} | null;
}

const DEFAULT_MEDIA_RECEIVER_APP_ID = "CC1AD845";

const handleChromecast = async (codec: CodecDef, card: HTMLElement) => {
	const w = window as Window & {
		cast?: {
			framework: {
				CastContext: { getInstance(): CastContextApi };
			};
		};
		chrome?: {
			cast?: {
				media?: {
					MediaInfo: new (
						u: string,
						t: string,
					) => unknown;
					LoadRequest: new (
						m: unknown,
					) => unknown;
				};
			};
		};
	};
	if (!w.cast?.framework?.CastContext) {
		log("Chromecast API not available", "error");
		setStatus(card, "Chromecast not available", "error");
		return;
	}
	if (
		!w.chrome?.cast?.media?.MediaInfo ||
		!w.chrome?.cast?.media?.LoadRequest
	) {
		log(
			"Cast media API missing — use Google Chrome for full Cast support",
			"error",
		);
		setStatus(card, "Use Google Chrome for Cast", "error");
		return;
	}
	const baseEl = document.getElementById(
		"cast-base-url",
	) as HTMLInputElement | null;
	const formatEl = document.getElementById(
		"cast-format",
	) as HTMLSelectElement | null;
	const base = baseEl?.value?.trim() || window.location.origin;
	const useHls = formatEl?.value === "hls";

	let castPath: string;
	let contentType: string;
	let formatLabel: string;
	if (useHls) {
		castPath = codec.src;
		contentType = "application/vnd.apple.mpegurl";
		formatLabel = "HLS (segments)";
	} else {
		const flacContainerEl = document.getElementById(
			"flac-container",
		) as HTMLSelectElement | null;
		if (codec.id === "mp3") {
			castPath = "/mp3/full.mp3";
			contentType = "audio/mpeg";
			formatLabel = "full.mp3";
		} else if (
			codec.id === "flac" &&
			flacContainerEl?.value === "flac"
		) {
			castPath = "/flac/full.flac";
			contentType = "audio/flac";
			formatLabel = "full.flac (raw)";
		} else {
			castPath = `/${codec.id}/full.mp4`;
			contentType = "audio/mp4";
			formatLabel =
				codec.id === "flac" ?
					"full.mp4 (FLAC-in-MP4)"
				:	"full.mp4";
		}
	}
	const url = `${base.replace(/\/$/, "")}${castPath}`;
	if (base.includes("localhost") || base.includes("127.0.0.1")) {
		log(
			"Cast base is localhost — Chromecast cannot reach it. Use your LAN IP or deployed URL",
			"warn",
		);
		setStatus(
			card,
			"Chromecast cannot reach localhost — set Cast base URL",
			"error",
		);
		return;
	}
	const ctx = w.cast.framework.CastContext.getInstance();
	let session = ctx.getCurrentSession();
	if (!session) {
		log(
			`Requesting Cast session to cast ${codec.label}...`,
			"info",
		);
		setStatus(card, "Select Cast device...", "");
		try {
			await ctx.requestSession();
			session = ctx.getCurrentSession();
		} catch (e) {
			log(`Cast session failed: ${e}`, "error");
			setStatus(card, `Cast failed: ${e}`, "error");
			return;
		}
	}
	if (!session) {
		setStatus(card, "No Cast session", "error");
		return;
	}
	const mediaInfo = new w.chrome.cast.media.MediaInfo(url, contentType);
	const request = new w.chrome.cast.media.LoadRequest(mediaInfo);
	(request as { autoplay?: boolean }).autoplay = true;
	try {
		await session.loadMedia(request);
		log(
			`${codec.label}: casting via ${formatLabel} → ${castPath}`,
			"info",
		);
		setStatus(
			card,
			`Casting ${codec.label} (${formatLabel})`,
			"success",
		);

		const media = (
			session as {
				getMediaSession?: () => {
					getEstimatedTime: () => number;
					media?: { duration?: number };
					addUpdateListener: (
						fn: (alive: boolean) => void,
					) => void;
					removeUpdateListener: (
						fn: (alive: boolean) => void,
					) => void;
					seek: (
						req: unknown,
						onOk: () => void,
						onErr: (e: Error) => void,
					) => void;
				};
			}
		).getMediaSession?.();
		if (media) {
			startCastProgressSync(card, media);
		}
	} catch (e) {
		log(`${codec.label}: Cast load failed: ${e}`, "error");
		setStatus(card, `Cast load failed: ${e}`, "error");
	}
};

const formatTime = (s: number) => {
	const m = Math.floor(s / 60);
	const sec = Math.floor(s % 60);
	return `${m}:${sec.toString().padStart(2, "0")}`;
};

const startCastProgressSync = (
	card: HTMLElement,
	media: {
		getEstimatedTime: () => number;
		media?: { duration?: number };
		addUpdateListener: (fn: (alive: boolean) => void) => void;
		removeUpdateListener: (fn: (alive: boolean) => void) => void;
		seek: (
			req: unknown,
			onOk: () => void,
			onErr: (e: Error) => void,
		) => void;
	},
) => {
	stopCastProgressSync();

	const audio = card.querySelector("audio");
	if (!audio) return;

	const duration = media.media?.duration ?? 90;
	audio.duration; // noop - we'll use our own
	const progressWrap = document.createElement("div");
	progressWrap.className = "cast-progress";
	progressWrap.innerHTML = `
		<input type="range" min="0" max="${Math.floor(duration)}" value="0" step="0.1" aria-label="Cast playback position" />
		<span class="cast-time">0:00 / ${formatTime(duration)}</span>
	`;
	audio.after(progressWrap);
	const range = progressWrap.querySelector(
		'input[type="range"]',
	) as HTMLInputElement;
	const timeEl = progressWrap.querySelector(".cast-time")!;

	const updateUi = () => {
		const t = media.getEstimatedTime();
		range.value = String(Math.min(t, duration));
		timeEl.textContent = `${formatTime(t)} / ${formatTime(duration)}`;
	};

	// Many receivers (embedded, AV) don't support seek — show position only, no drag
	range.style.pointerEvents = "none";
	range.setAttribute("aria-label", "Cast playback position");

	const listener = (alive: boolean) => {
		if (!alive) stopCastProgressSync();
		else updateUi();
	};
	media.addUpdateListener(listener);
	castProgressSeekHandler = () => {
		media.removeUpdateListener(listener);
	};

	castProgressInterval = setInterval(updateUi, 500);
	updateUi();
};

const stopCastProgressSync = () => {
	if (castProgressInterval) {
		clearInterval(castProgressInterval);
		castProgressInterval = null;
	}
	castProgressSeekHandler?.();
	castProgressSeekHandler = null;
	document.querySelectorAll(".cast-progress").forEach((el) =>
		el.remove(),
	);
};

const buildCards = () => {
	const container = document.getElementById("cards")!;

	for (const codec of CODECS) {
		const card = document.createElement("div");
		card.className = "codec-card";
		card.id = `card-${codec.id}`;
		card.innerHTML = `
			<h2>
				${codec.label}
				<span class="badge badge-${codec.badge}">${codec.badge}</span>
			</h2>
			<div class="controls">
				<button data-action="play">Play</button>
				<button data-action="stop">Stop</button>
				<button data-action="airplay" class="airplay-btn" title="Show AirPlay devices" aria-label="Show AirPlay devices" disabled>${AIRPLAY_ICON}</button>
				<button data-action="cast" class="cast-btn" title="Cast to Chromecast" aria-label="Cast to Chromecast" disabled>${CAST_ICON}</button>
			</div>
			<audio preload="none" controls></audio>
			<div class="status"></div>
		`;

		const audio = card.querySelector("audio") as HTMLMediaElement;
		const airplayBtn = card.querySelector(
			'[data-action="airplay"]',
		) as HTMLButtonElement;

		if (hasAirPlayAPI(audio)) {
			const onAvailability = (e: Event) => {
				const ev =
					e as WebKitPlaybackTargetAvailabilityEvent;
				airplayBtn.disabled =
					ev.availability !== "available";
			};
			audio.addEventListener(
				"webkitplaybacktargetavailabilitychanged",
				onAvailability,
			);
		} else {
			airplayBtn.style.display = "none";
		}

		const castBtn = card.querySelector(
			'[data-action="cast"]',
		) as HTMLButtonElement;
		castBtn.addEventListener("click", () =>
			handleChromecast(codec, card),
		);

		card.querySelector('[data-action="play"]')!.addEventListener(
			"click",
			() => handlePlay(codec, card),
		);
		card.querySelector('[data-action="stop"]')!.addEventListener(
			"click",
			() => handleStop(card),
		);
		airplayBtn.addEventListener("click", () => handleAirPlay(card));

		container.appendChild(card);
	}
};

const onCastReady = (available: boolean) => {
	initCast();
	if (!available)
		log(
			"Cast: API reported no devices — button enabled anyway, click to try",
			"info",
		);

	const w = window as Window & {
		cast?: {
			framework: {
				CastContext: {
					getInstance(): {
						addEventListener: (
							t: string,
							fn: (e: {
								sessionState: string;
							}) => void,
						) => void;
					};
				};
			};
		};
	};
	w.cast?.framework?.CastContext?.getInstance?.()?.addEventListener?.(
		"SESSION_STATE_CHANGED",
		(e: { sessionState: string }) => {
			if (e.sessionState === "SESSION_ENDED")
				stopCastProgressSync();
		},
	);
};
window.addEventListener("castready", ((
	e: CustomEvent<{ available: boolean }>,
) => onCastReady(e.detail.available)) as EventListener);
if (
	(window as Window & { __castApiAvailable?: boolean })
		.__castApiAvailable !== undefined
)
	onCastReady(true);

log(`Browser: ${navigator.userAgent}`, "info");
log(`Native HLS: ${supportsNativeHls() ? "YES" : "NO"}`, "info");
log(`HLS.js MSE: ${Hls.isSupported() ? "YES" : "NO"}`, "info");
log("---", "info");

buildCards();

const castBaseInput = document.getElementById(
	"cast-base-url",
) as HTMLInputElement | null;
if (castBaseInput) {
	castBaseInput.placeholder = window.location.origin;
	if (
		window.location.hostname === "localhost" ||
		window.location.hostname === "127.0.0.1"
	) {
		castBaseInput.placeholder = "https://YOUR_LAN_IP:5173";
		log(
			"On localhost — for Cast, open via LAN IP or paste it in Cast base URL",
			"info",
		);
	}
}

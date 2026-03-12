<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Checkbox } from '@vesta-cx/ui/components/ui/checkbox';
	import * as Dialog from '@vesta-cx/ui/components/ui/dialog';
	import TagInput from '$lib/components/tag-input.svelte';
	import { extractFeaturedFromTitle, extractUrlFromComment } from '$lib/utils/metadata';
	import { formatList, formatTrackLabel } from '$lib/utils/list';
	import UploadProgressToast from '$lib/components/upload-progress-toast.svelte';
	import { uploadProgress } from '$lib/stores/upload-progress';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Upload from '@lucide/svelte/icons/upload';
	import Music from '@lucide/svelte/icons/music';
	import { parseBlob } from 'music-metadata';
	import { toast } from 'svelte-sonner';

	let { data, form } = $props();

	let selectedIds = $state<Set<string>>(new Set());
	let expandedIds = $state<Set<string>>(new Set());
	const allSourceIds = $derived(data.sources.map((s) => s.id));
	const allSelected = $derived(
		data.sources.length > 0 && data.sources.every((s) => selectedIds.has(s.id))
	);
	const someSelected = $derived(selectedIds.size > 0);
	const isIndeterminate = $derived(someSelected && !allSelected);

	const LOSSLESS_EXTS = ['.flac', '.wav', '.aiff', '.alac', '.aif'];
	const LOSSLESS_ACCEPT =
		'.flac,.wav,.aiff,.alac,.aif,audio/flac,audio/wav,audio/aiff,audio/x-aiff';

	const handleSelectAllChange = (checked: boolean | 'indeterminate') => {
		if (checked === true || checked === 'indeterminate') {
			selectedIds = new Set(allSourceIds);
		} else {
			selectedIds = new Set();
		}
	};

	const handleSelectChange = (id: string, checked: boolean | 'indeterminate') => {
		const next = new Set(selectedIds);
		if (checked === true) next.add(id);
		else next.delete(id);
		selectedIds = next;
	};

	const handleToggleExpanded = (id: string) => {
		const next = new Set(expandedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expandedIds = next;
	};

	const handleRemoveResult = (opts: {
		result?: { type?: string; data?: { removed?: number } };
		update?: () => Promise<void>;
	}) => {
		if (opts?.result?.type === 'success' && opts.result?.data?.removed != null) {
			toast.success(
				opts.result.data.removed === 1
					? 'Source deleted'
					: `${opts.result.data.removed} sources deleted`
			);
			selectedIds = new Set();
		}
		opts?.update?.();
	};

	const handleApproveResult = (opts: {
		result?: { type?: string; data?: { approved?: number } };
		update?: () => Promise<void>;
	}) => {
		if (opts?.result?.type === 'success' && opts.result?.data?.approved != null) {
			toast.success(
				opts.result.data.approved === 1
					? 'Source approved'
					: `${opts.result.data.approved} sources approved`
			);
			selectedIds = new Set();
		}
		opts?.update?.();
	};

	type FileEntry = {
		file: File;
		title: string;
		artist: string;
		featuredArtists: string;
		remixArtists: string;
		genre: string;
		licenseUrl: string;
		streamUrl: string;
		metadataSource: string | null;
		expanded: boolean;
	};

	type UploadSource = {
		id: string;
		label: string;
		entries: FileEntry[];
	};

	const isLossless = (name: string): boolean =>
		LOSSLESS_EXTS.some((ext) => name.toLowerCase().endsWith(ext));

	let showUploadPanel = $state(false);
	let fileSelectError = $state('');
	let sharedLicenseUrl = $state('');
	let sharedStreamUrl = $state('');
	let uploadSources = $state<UploadSource[]>([]);

	const entriesWithSource = $derived(
		uploadSources
			.flatMap((s) => s.entries.map((entry, j) => ({ entry, sourceId: s.id, indexInSource: j })))
			.sort((a, b) => a.entry.file.name.localeCompare(b.entry.file.name))
	);
	const entries = $derived(entriesWithSource.map((x) => x.entry));
	let fileInputRef = $state<HTMLInputElement | null>(null);
	let dirInputRef = $state<HTMLInputElement | null>(null);
	let isDragging = $state(false);

	const formatDuration = (ms: number | null) => {
		if (ms == null) return '—';
		const s = Math.floor(ms / 1000);
		return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
	};

	const flattenFiles = (files: FileList | null): File[] => {
		if (!files) return [];
		return Array.from(files).filter((f) => f.size > 0 && isLossless(f.name));
	};

	const getSourceLabel = (files: File[], method: 'files' | 'folder' | 'drop'): string => {
		if (method === 'folder' && files.length > 0) {
			const first = files[0] as File & { webkitRelativePath?: string };
			const path = first.webkitRelativePath || first.name;
			const topDir = path.split('/')[0];
			return topDir ? `${topDir}/ (${files.length})` : `Folder (${files.length} files)`;
		}
		if (method === 'drop') return `Dropped (${files.length} files)`;
		return `Selected (${files.length} files)`;
	};

	const handleFilesAdded = async (
		fileList: FileList | null,
		method: 'files' | 'folder' | 'drop'
	) => {
		const files = flattenFiles(fileList);
		if (files.length === 0) {
			fileSelectError = 'No lossless files found. Use FLAC, WAV, AIFF, or ALAC.';
			return;
		}
		fileSelectError = '';

		const newEntries: FileEntry[] = [];
		for (const file of files) {
			let title = file.name
				.replace(/\.[^.]+$/, '')
				.replace(/[-_]/g, ' ')
				.trim();
			let artist = '';
			let featuredArtists = '';
			let remixArtists = '';
			let genre = '';
			let licenseUrl = sharedLicenseUrl;
			let streamUrl = sharedStreamUrl;
			let metadataSource: string | null = null;

			try {
				const meta = await parseBlob(file);
				if (meta.common.title) {
					const { featuredArtists: fromTitle, cleanTitle } = extractFeaturedFromTitle(
						meta.common.title
					);
					title = cleanTitle;
					if (fromTitle) featuredArtists = fromTitle;
					metadataSource = file.name;
				}
				if (meta.common.artist) {
					const arr = Array.isArray(meta.common.artist)
						? meta.common.artist.filter(Boolean)
						: [meta.common.artist].filter(Boolean);
					artist = formatList(arr);
					metadataSource ??= file.name;
				}
				if (meta.common.remixer?.length) {
					remixArtists = formatList(meta.common.remixer.filter(Boolean) as string[]);
					metadataSource ??= file.name;
				}
				if (meta.common.genre?.length) {
					genre = formatList(meta.common.genre.filter(Boolean) as string[]);
					metadataSource ??= file.name;
				}
				if (meta.common.license) {
					licenseUrl =
						typeof meta.common.license === 'string'
							? meta.common.license
							: ((meta.common.license as string[])?.[0] ?? licenseUrl);
					metadataSource ??= file.name;
				}
				const urlFromWebsite =
					typeof meta.common.website === 'string' ? meta.common.website.trim() : null;
				const urlFromComment = extractUrlFromComment(meta.common.comment);
				if (urlFromWebsite || urlFromComment) {
					streamUrl = urlFromWebsite || urlFromComment || streamUrl;
					metadataSource ??= file.name;
				}
			} catch {
				// keep defaults
			}
			// If no metadata title, try parsing feat. from filename (e.g. "Song (feat. X).flac")
			if (!metadataSource) {
				const { featuredArtists: fromTitle, cleanTitle } = extractFeaturedFromTitle(title);
				if (fromTitle) {
					featuredArtists = fromTitle;
					title = cleanTitle;
				}
			}

			newEntries.push({
				file,
				title,
				artist,
				featuredArtists,
				remixArtists,
				genre,
				licenseUrl,
				streamUrl,
				metadataSource,
				expanded: true
			});
		}

		const label = getSourceLabel(files, method);
		uploadSources = [
			...uploadSources,
			{
				id: crypto.randomUUID(),
				label,
				entries: newEntries.sort((a, b) => a.file.name.localeCompare(b.file.name))
			}
		];

		// Auto-populate shared defaults from existing DB sources only (never from file metadata)
		if (data.sources.length > 0) {
			const first = data.sources[0];
			if (first?.licenseUrl && !sharedLicenseUrl.trim()) sharedLicenseUrl = first.licenseUrl;
			if (first?.streamUrl != null && !sharedStreamUrl.trim())
				sharedStreamUrl = first.streamUrl ?? '';
		}
	};

	const handleFileInputChange = (e: Event) => {
		const input = e.target as HTMLInputElement;
		handleFilesAdded(input.files, 'files');
		queueMicrotask(() => {
			input.value = '';
			if (dirInputRef) dirInputRef.value = '';
		});
	};

	const handleDirInputChange = (e: Event) => {
		const input = e.target as HTMLInputElement;
		handleFilesAdded(input.files, 'folder');
		queueMicrotask(() => {
			input.value = '';
			if (fileInputRef) fileInputRef.value = '';
		});
	};

	const collectFilesFromEntry = async (item: DataTransferItem, files: File[]): Promise<void> => {
		const file = item.getAsFile();
		if (file) {
			if (isLossless(file.name)) files.push(file);
			return;
		}
		const entry = (
			item as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntry | null }
		).webkitGetAsEntry?.();
		if (!entry) return;
		if (entry.isFile) {
			const f = await new Promise<File>((resolve, reject) => {
				(entry as FileSystemFileEntry).file(resolve, reject);
			});
			if (isLossless(f.name)) files.push(f);
			return;
		}
		if (entry.isDirectory) {
			const reader = (entry as FileSystemDirectoryEntry).createReader();
			const readAll = (): Promise<FileSystemEntry[]> =>
				new Promise((resolve, reject) => {
					const entries: FileSystemEntry[] = [];
					const readBatch = () => {
						reader.readEntries((batch: FileSystemEntry[]) => {
							if (batch.length === 0) {
								resolve(entries);
								return;
							}
							entries.push(...batch);
							readBatch();
						}, reject);
					};
					readBatch();
				});
			for (const child of await readAll()) {
				if (child.isFile) {
					const f = await new Promise<File>((resolve, reject) => {
						(child as FileSystemFileEntry).file(resolve, reject);
					});
					if (isLossless(f.name)) files.push(f);
				} else if (child.isDirectory) {
					const traverse = async (dir: FileSystemDirectoryEntry): Promise<void> => {
						const reader = dir.createReader();
						const children = await new Promise<FileSystemEntry[]>((resolve, reject) => {
							const acc: FileSystemEntry[] = [];
							const readBatch = () => {
								reader.readEntries((batch: FileSystemEntry[]) => {
									if (batch.length === 0) {
										resolve(acc);
										return;
									}
									acc.push(...batch);
									readBatch();
								}, reject);
							};
							readBatch();
						});
						for (const c of children) {
							if (c.isFile) {
								const f = await new Promise<File>((resolve, reject) => {
									(c as FileSystemFileEntry).file(resolve, reject);
								});
								if (isLossless(f.name)) files.push(f);
							} else if (c.isDirectory) {
								await traverse(c as FileSystemDirectoryEntry);
							}
						}
					};
					await traverse(child as FileSystemDirectoryEntry);
				}
			}
		}
	};

	const handleDrop = async (e: DragEvent) => {
		e.preventDefault();
		isDragging = false;
		const items = e.dataTransfer?.items;
		if (!items) return;
		const files: File[] = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (item?.kind === 'file') {
				await collectFilesFromEntry(item, files);
			}
		}
		if (files.length > 0) {
			const dt = new DataTransfer();
			files.forEach((f) => dt.items.add(f));
			handleFilesAdded(dt.files, 'drop');
		} else {
			fileSelectError = 'Drop lossless files only (FLAC, WAV, AIFF, ALAC).';
		}
	};

	const handleDragOver = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		isDragging = true;
	};

	const handleDragLeave = (e: DragEvent) => {
		e.preventDefault();
		isDragging = false;
	};

	const removeSource = (id: string) => {
		uploadSources = uploadSources.filter((s) => s.id !== id);
	};

	const removeEntry = (flatIdx: number) => {
		const item = entriesWithSource[flatIdx];
		if (!item) return;
		uploadSources = uploadSources
			.map((s) =>
				s.id === item.sourceId
					? { ...s, entries: s.entries.filter((_, j) => j !== item.indexInSource) }
					: s
			)
			.filter((s) => s.entries.length > 0);
	};

	const isComplete = (e: FileEntry) =>
		Boolean(e.title?.trim() && (e.licenseUrl?.trim() || sharedLicenseUrl?.trim()));
	const allComplete = $derived(entries.length > 0 && entries.every(isComplete));

	const UPLOAD_TOAST_ID = 'source-upload';
	const actionUrl = '?/uploadRawFlac';

	const handleUploadSubmit = async () => {
		if (!allComplete) return;

		const toUpload = entries.filter((e) => isComplete(e));
		if (toUpload.length === 0) {
			toast.error('No valid entries to upload');
			return;
		}

		uploadProgress.set({ type: 'uploading', current: 0, total: toUpload.length });
		toast.custom(UploadProgressToast, { id: UPLOAD_TOAST_ID, duration: Number.POSITIVE_INFINITY });

		const jobIds: string[] = [];
		let lastError: string | null = null;

		try {
			for (let i = 0; i < toUpload.length; i++) {
				const e = toUpload[i];
				const fd = new FormData();
				fd.set('file', e.file);
				fd.set('title', e.title);
				fd.set('artist', e.artist || '');
				fd.set('featured_artists', e.featuredArtists || '');
				fd.set('remix_artists', e.remixArtists || '');
				fd.set('genre', e.genre || '');
				fd.set('license_url', e.licenseUrl?.trim() || sharedLicenseUrl || '');
				fd.set('stream_url', e.streamUrl?.trim() || sharedStreamUrl || '');

				const res = await fetch(actionUrl, {
					method: 'POST',
					body: fd
				});

				const result = deserialize(await res.text()) as {
					type?: string;
					jobId?: string;
					data?: { error?: string };
				};

				if (result?.type === 'uploadRawFlac' && result?.jobId) {
					jobIds.push(result.jobId);
				} else {
					lastError = result?.data?.error ?? 'Upload failed';
					toast.error(`${e.file.name}: ${lastError}`, { id: `upload-err-${i}` });
				}

				uploadProgress.set({ type: 'uploading', current: i + 1, total: toUpload.length });
			}

			if (jobIds.length === 0) {
				uploadProgress.set(null);
				toast.error('Upload failed', { id: UPLOAD_TOAST_ID, description: lastError ?? undefined });
				return;
			}

			if (jobIds.length === 1) {
				uploadProgress.set({ type: 'transcoding', jobId: jobIds[0] });
				const poll = async () => {
					const st = await fetch(`/api/transcode-status?jobId=${jobIds[0]}`);
					const { status } = (await st.json()) as { status?: string };
					if (status === 'complete') {
						uploadProgress.set({ type: 'complete' });
						toast.success('Transcoding complete', { id: UPLOAD_TOAST_ID });
						showUploadPanel = false;
						uploadSources = [];
						sharedLicenseUrl = '';
						sharedStreamUrl = '';
						fileSelectError = '';
						invalidateAll();
						setTimeout(() => uploadProgress.set(null), 1500);
						return;
					}
					if (status === 'failed') {
						uploadProgress.set(null);
						toast.error('Transcoding failed', { id: UPLOAD_TOAST_ID });
						return;
					}
					setTimeout(poll, 2500);
				};
				poll();
				return;
			}

			// Batch: poll all jobs
			uploadProgress.set({ type: 'transcoding', current: 0, total: jobIds.length, jobIds });
			let complete = 0;
			const pollAll = async () => {
				for (let j = 0; j < jobIds.length; j++) {
					const st = await fetch(`/api/transcode-status?jobId=${jobIds[j]}`);
					const { status } = (await st.json()) as { status?: string };
					if (status === 'complete') complete++;
					if (status === 'failed') {
						uploadProgress.set(null);
						toast.error(`Job ${j + 1} failed`, { id: UPLOAD_TOAST_ID });
						return;
					}
				}
				uploadProgress.set({
					type: 'transcoding',
					current: complete,
					total: jobIds.length,
					jobIds
				});
				if (complete >= jobIds.length) {
					uploadProgress.set({ type: 'complete' });
					toast.success(`${jobIds.length} files transcoded`, { id: UPLOAD_TOAST_ID });
					showUploadPanel = false;
					uploadSources = [];
					sharedLicenseUrl = '';
					sharedStreamUrl = '';
					fileSelectError = '';
					invalidateAll();
					setTimeout(() => uploadProgress.set(null), 1500);
					return;
				}
				setTimeout(pollAll, 2500);
			};
			pollAll();
		} catch {
			uploadProgress.set(null);
			toast.error('Upload failed', { id: UPLOAD_TOAST_ID });
		}
	};

	const handleResetUpload = () => {
		showUploadPanel = false;
		uploadSources = [];
		sharedLicenseUrl = '';
		sharedStreamUrl = '';
		fileSelectError = '';
		if (fileInputRef) fileInputRef.value = '';
		if (dirInputRef) dirInputRef.value = '';
	};
</script>

<svelte:head>
	<title>Sources | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold tracking-tight">Source Files</h1>
		<Dialog.Root bind:open={showUploadPanel}>
			<Dialog.Trigger
				class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
			>
				<Upload class="size-4" aria-hidden="true" />
				Upload
			</Dialog.Trigger>
			<Dialog.Content
				class="flex max-h-[90vh] min-h-0 max-w-2xl flex-col overflow-y-auto sm:max-w-2xl"
			>
				<Dialog.Header>
					<Dialog.Title>Upload Lossless Audio</Dialog.Title>
					<Dialog.Description>
						Drop or select FLAC, WAV, AIFF, or ALAC files. Euterpe will transcode them to FLAC,
						Opus@128, and Opus@96.
					</Dialog.Description>
				</Dialog.Header>
				<div class="mt-4 space-y-4">
					<div
						role="presentation"
						class="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 {isDragging
							? 'border-primary bg-primary/5'
							: 'bg-muted/20'}"
						ondragover={handleDragOver}
						ondragleave={handleDragLeave}
						ondrop={handleDrop}
					>
						<Music class="size-10 text-muted-foreground" aria-hidden="true" />
						<div class="text-center">
							<p class="text-sm font-medium">Drop files or folders, or use the buttons below</p>
							<p class="mt-0.5 text-xs text-muted-foreground">FLAC · WAV · AIFF · ALAC</p>
						</div>
						<div class="flex gap-2">
							<input
								bind:this={fileInputRef}
								type="file"
								multiple
								accept={LOSSLESS_ACCEPT}
								onchange={handleFileInputChange}
								class="sr-only"
								aria-label="Select files"
							/>
							<!-- @ts-expect-error webkitdirectory is non-standard -->
							<input
								bind:this={dirInputRef}
								type="file"
								multiple
								webkitdirectory
								accept={LOSSLESS_ACCEPT}
								onchange={handleDirInputChange}
								class="sr-only"
								aria-label="Select folder"
							/>
							<button
								type="button"
								class="flex items-center gap-1.5 rounded-md border border-input px-3 py-2 text-xs font-medium transition-colors hover:bg-accent"
								onclick={() => fileInputRef?.click()}
							>
								<Upload class="size-3.5" aria-hidden="true" />
								Files
							</button>
							<button
								type="button"
								class="flex items-center gap-1.5 rounded-md border border-input px-3 py-2 text-xs font-medium transition-colors hover:bg-accent"
								onclick={() => dirInputRef?.click()}
							>
								<FolderOpen class="size-3.5" aria-hidden="true" />
								Folder
							</button>
						</div>
					</div>

					{#if fileSelectError}
						<div
							class="rounded-lg border border-amber-500/50 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400"
						>
							{fileSelectError}
						</div>
					{/if}

					{#if uploadSources.length > 0}
						<div>
							<h3 class="mb-2 text-sm font-medium">Upload sources</h3>
							<ul class="flex flex-wrap gap-2">
								{#each uploadSources as source (source.id)}
									<li
										class="flex items-center gap-2 rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm"
									>
										<span class="truncate">{source.label}</span>
										<button
											type="button"
											class="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
											aria-label="Remove {source.label}"
											onclick={() => removeSource(source.id)}
										>
											<Trash2 class="size-3.5" aria-hidden="true" />
										</button>
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if entries.length > 0}
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-1.5">
								<label for="shared-license" class="text-sm font-medium">License URL (shared)</label>
								<input
									id="shared-license"
									type="url"
									required
									bind:value={sharedLicenseUrl}
									placeholder="https://…"
									class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								/>
								<p class="text-xs text-muted-foreground">
									Default for all tracks. Override per-file below.
								</p>
							</div>
							<div class="space-y-1.5">
								<label for="shared-stream" class="text-sm font-medium">Stream URL (shared)</label>
								<input
									id="shared-stream"
									type="url"
									bind:value={sharedStreamUrl}
									placeholder="https://…"
									class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								/>
								<p class="text-xs text-muted-foreground">
									Shown after survey. Override per-file below.
								</p>
							</div>
						</div>

						<div>
							<h3 class="mb-3 text-sm font-medium">Tracks ({entries.length})</h3>
							<div class="space-y-2 pr-1">
								{#each entriesWithSource as { entry }, i}
									{@const complete = isComplete(entry)}
									<div
										class="rounded-lg border transition-colors {complete
											? 'border-border bg-muted/10'
											: 'border-destructive/40 bg-destructive/5'}"
									>
										<div class="flex items-start gap-3 p-3">
											<button
												type="button"
												class="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
												aria-expanded={entry.expanded}
												aria-label={entry.expanded ? 'Collapse' : 'Expand'}
												onclick={() => (entry.expanded = !entry.expanded)}
											>
												<ChevronDown
													class="size-4 transition-transform {!entry.expanded ? '-rotate-90' : ''}"
													aria-hidden="true"
												/>
											</button>
											<div class="min-w-0 flex-1">
												<div class="flex items-center justify-between gap-2">
													<span class="truncate font-medium">{entry.title || entry.file.name}</span>
													<span
														class="size-2 shrink-0 rounded-full {complete
															? 'bg-green-500'
															: 'bg-amber-500'}"
														aria-hidden="true"
													></span>
												</div>
												<p class="mt-0.5 truncate text-xs text-muted-foreground">
													{formatTrackLabel({
														title: entry.title,
														artist: entry.artist,
														featuredArtists: entry.featuredArtists || undefined,
														remixArtists: entry.remixArtists || undefined
													})}
													{#if entry.file.size}
														— {(entry.file.size / 1024 / 1024).toFixed(1)} MB
													{/if}
												</p>
											</div>
											<button
												type="button"
												class="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
												aria-label="Remove {entry.file.name}"
												onclick={() => removeEntry(i)}
											>
												<Trash2 class="size-4" aria-hidden="true" />
											</button>
										</div>
										{#if entry.expanded}
											<div class="grid gap-3 border-t border-border/60 p-3 sm:grid-cols-2">
												<div class="space-y-1">
													<label for="title-{i}" class="text-xs font-medium">Title *</label>
													<input
														id="title-{i}"
														type="text"
														bind:value={entry.title}
														class="h-9 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
													/>
												</div>
												<div class="space-y-1">
													<label for="artist-{i}" class="text-xs font-medium">Artist</label>
													<TagInput
														id="artist-{i}"
														bind:value={entry.artist}
														placeholder="Artist A; Artist B"
													/>
												</div>
												<div class="space-y-1">
													<label for="featured-{i}" class="text-xs font-medium">Featured</label>
													<TagInput
														id="featured-{i}"
														bind:value={entry.featuredArtists}
														placeholder="Artist X; Artist Y"
													/>
												</div>
												<div class="space-y-1">
													<label for="remix-{i}" class="text-xs font-medium">Remix</label>
													<TagInput
														id="remix-{i}"
														bind:value={entry.remixArtists}
														placeholder="Artist Z"
													/>
												</div>
												<div class="space-y-1">
													<label for="genre-{i}" class="text-xs font-medium">Genre</label>
													<TagInput
														id="genre-{i}"
														bind:value={entry.genre}
														placeholder="jazz; electronic"
													/>
												</div>
												<div class="space-y-1">
													<label for="license-{i}" class="text-xs font-medium">License URL *</label>
													<input
														id="license-{i}"
														type="url"
														bind:value={entry.licenseUrl}
														placeholder={sharedLicenseUrl || 'Uses shared'}
														class="h-9 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
													/>
												</div>
												<div class="space-y-1 sm:col-span-2">
													<label for="stream-{i}" class="text-xs font-medium">Stream URL</label>
													<input
														id="stream-{i}"
														type="url"
														bind:value={entry.streamUrl}
														placeholder={sharedStreamUrl || 'Optional'}
														class="h-9 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
													/>
												</div>
												{#if entry.metadataSource}
													<p class="text-xs text-muted-foreground sm:col-span-2">
														Metadata from <code class="rounded bg-muted px-1 py-0.5"
															>{entry.metadataSource}</code
														>
													</p>
												{/if}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>

						<div class="flex items-center justify-between gap-4 border-t border-border/60 pt-4">
							<p class="text-sm text-muted-foreground">
								{entries.filter(isComplete).length} of {entries.length} ready
							</p>
							<div class="flex gap-2">
								<button
									type="button"
									class="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
									onclick={handleResetUpload}
								>
									Cancel
								</button>
								<button
									type="button"
									disabled={!allComplete}
									class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
									onclick={handleUploadSubmit}
								>
									<Upload class="size-4" aria-hidden="true" />
									Upload {entries.length} file{entries.length === 1 ? '' : 's'}
								</button>
							</div>
						</div>
					{/if}
				</div>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	{#if form?.error}
		<div
			class="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive"
		>
			{form.error}
		</div>
	{/if}

	{#if data.sources.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-muted-foreground"
		>
			<Music class="mb-3 size-12 opacity-40" aria-hidden="true" />
			<p class="text-sm">No source files yet.</p>
			<p class="mt-0.5 text-xs text-muted-foreground">
				Click Upload to add lossless audio for transcoding.
			</p>
		</div>
	{:else}
		<div class="space-y-4">
			<div
				class="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-2.5"
			>
				<span class="text-sm text-muted-foreground">
					{someSelected
						? `${selectedIds.size} source${selectedIds.size === 1 ? '' : 's'} selected`
						: 'Select sources to approve or delete'}
				</span>
				<div class="flex gap-2">
					<form
						method="POST"
						action="?/approveBulk"
						use:enhance={() => (opts) => handleApproveResult(opts)}
						class="inline"
					>
						{#each [...selectedIds] as id}
							<input type="hidden" name="ids" value={id} />
						{/each}
						<button
							type="submit"
							disabled={!someSelected}
							class="flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
						>
							<CircleCheck class="size-4" aria-hidden="true" />
							Approve
						</button>
					</form>
					<form
						method="POST"
						action="?/removeBulk"
						use:enhance={() => (opts) => handleRemoveResult(opts)}
						class="inline"
					>
						{#each [...selectedIds] as id}
							<input type="hidden" name="ids" value={id} />
						{/each}
						<button
							type="submit"
							disabled={!someSelected}
							class="flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
							onclick={(e) => {
								if (
									!someSelected ||
									!confirm(
										`Delete ${selectedIds.size} source${selectedIds.size === 1 ? '' : 's'}? This cannot be undone.`
									)
								) {
									e.preventDefault();
								}
							}}
						>
							<Trash2 class="size-4" aria-hidden="true" />
							Delete
						</button>
					</form>
				</div>
			</div>

			<div class="overflow-x-auto rounded-lg border">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b bg-muted/30">
							<th class="w-8 px-2 py-2.5 pr-0"></th>
							<th class="w-10 px-2 py-2.5 pr-0">
								<Checkbox
									checked={allSelected}
									indeterminate={isIndeterminate}
									onCheckedChange={handleSelectAllChange}
									aria-label="Select all sources"
								/>
							</th>
							<th class="px-4 py-2.5 text-left font-medium">Title</th>
							<th class="px-4 py-2.5 text-left font-medium">Artist</th>
							<th class="px-4 py-2.5 text-left font-medium">Genre</th>
							<th class="px-4 py-2.5 text-left font-medium">Duration</th>
							<th class="px-4 py-2.5 text-left font-medium">Candidates</th>
							<th class="px-4 py-2.5 text-left font-medium">Status</th>
							<th class="px-4 py-2.5 text-left font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.sources as source}
							{@const candidates = data.candidatesBySource?.[source.id] ?? []}
							{@const isExpanded = expandedIds.has(source.id)}
							<tr class="border-b last:border-b-0 hover:bg-muted/20">
								<td class="w-8 px-2 py-2 pr-0">
									<button
										type="button"
										class="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
										aria-expanded={isExpanded}
										aria-label={isExpanded ? 'Collapse' : 'Expand'}
										onclick={() => handleToggleExpanded(source.id)}
									>
										<ChevronDown
											class="size-4 transition-transform {!isExpanded ? '-rotate-90' : ''}"
											aria-hidden="true"
										/>
									</button>
								</td>
								<td class="w-10 px-2 py-2 pr-0">
									<Checkbox
										checked={selectedIds.has(source.id)}
										onCheckedChange={(v) => handleSelectChange(source.id, v)}
										aria-label="Select {source.title}"
									/>
								</td>
								<td class="px-4 py-2 font-medium">{source.title}</td>
								<td
									class="max-w-xs truncate px-4 py-2 text-muted-foreground"
									title={formatTrackLabel({
										title: source.title,
										artist: source.artist,
										featuredArtists: source.featuredArtists,
										remixArtists: source.remixArtists
									})}
								>
									{formatTrackLabel({
										title: source.title,
										artist: source.artist,
										featuredArtists: source.featuredArtists,
										remixArtists: source.remixArtists
									})}
								</td>
								<td class="px-4 py-2 text-muted-foreground">{source.genre ?? '—'}</td>
								<td class="px-4 py-2 text-muted-foreground">
									{source.duration != null
										? `${Math.round(source.duration / 1000)}s`
										: 'Transcoding…'}
								</td>
								<td class="px-4 py-2 text-muted-foreground">
									{candidates.length > 0
										? candidates.map((c) => `${c.codec}@${c.bitrate}`).join(', ')
										: '—'}
								</td>
								<td class="px-4 py-2">
									{#if source.approvedAt}
										<span
											class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
										>
											Approved
										</span>
									{:else}
										<span
											class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200"
										>
											Pending
										</span>
									{/if}
								</td>
								<td class="px-4 py-2">
									<div class="flex items-center gap-2">
										{#if source.approvedAt}
											<form method="POST" action="?/reject" use:enhance class="inline">
												<input type="hidden" name="id" value={source.id} />
												<button type="submit" class="text-xs text-destructive hover:underline">
													Revoke
												</button>
											</form>
										{:else}
											<form method="POST" action="?/approve" use:enhance class="inline">
												<input type="hidden" name="id" value={source.id} />
												<button
													type="submit"
													class="text-xs text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
													disabled={source.r2Key == null}
													title={source.r2Key == null
														? 'Wait for transcoding to complete'
														: undefined}
												>
													Approve
												</button>
											</form>
										{/if}
										<form
											method="POST"
											action="?/remove"
											use:enhance={() => (opts) => handleRemoveResult(opts)}
											class="inline"
										>
											<input type="hidden" name="id" value={source.id} />
											<button
												type="submit"
												class="text-xs text-muted-foreground hover:text-destructive hover:underline"
												onclick={(e) => {
													if (
														!confirm('Remove this source and all its files? This cannot be undone.')
													) {
														e.preventDefault();
													}
												}}
											>
												Remove
											</button>
										</form>
									</div>
								</td>
							</tr>
							{#if isExpanded}
								<tr class="border-b bg-muted/20 last:border-b-0">
									<td colspan="9" class="p-4">
										<div class="space-y-6">
											<div>
												<h3 class="mb-3 text-sm font-medium">Candidates ({candidates.length})</h3>
												{#if candidates.length > 0}
													{@const codecs = ['flac', 'opus', 'mp3', 'aac']}
													{@const bitrates = [...new Set(candidates.map((c) => c.bitrate))].sort(
														(a, b) => (a === 0 ? -1 : b === 0 ? 1 : a - b)
													)}
													{@const hasCandidate = (codec: string, bitrate: number) =>
														candidates.some((c) => c.codec === codec && c.bitrate === bitrate)}
													<div class="overflow-x-auto rounded-md border border-border">
														<table class="w-full min-w-[200px] text-xs">
															<thead>
																<tr class="border-b bg-muted/50">
																	<th class="px-2 py-1.5 text-left font-medium">bitrate ↓</th>
																	{#each codecs as codec}
																		<th class="px-2 py-1.5 text-center font-medium">{codec}</th>
																	{/each}
																</tr>
															</thead>
															<tbody>
																{#each bitrates as bitrate}
																	<tr class="border-b last:border-b-0">
																		<td class="px-2 py-1 font-mono text-muted-foreground"
																			>{bitrate}</td
																		>
																		{#each codecs as codec}
																			<td class="px-2 py-1 text-center">
																				{#if hasCandidate(codec, bitrate)}
																					<span class="text-primary" aria-hidden="true">✓</span>
																				{:else}
																					<span class="text-muted-foreground/40" aria-hidden="true"
																						>—</span
																					>
																				{/if}
																			</td>
																		{/each}
																	</tr>
																{/each}
															</tbody>
														</table>
													</div>
												{:else}
													<p class="text-sm text-muted-foreground">
														No transcoded candidates yet. Euterpe will add them when transcoding
														completes.
													</p>
												{/if}
											</div>

											<div>
												<h3 class="mb-3 text-sm font-medium">Edit Metadata</h3>
												<form
													method="POST"
													action="?/updateMetadata"
													use:enhance={() => {
														return ({ result, update }) => {
															if (result.type === 'failure' && result.data?.error) {
																toast.error(result.data.error as string);
															} else if (result.type === 'success') {
																toast.success('Metadata saved');
															}
															update({ reset: false });
														};
													}}
													class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
												>
													<input type="hidden" name="id" value={source.id} />
													<div class="space-y-1">
														<label for="meta-title-{source.id}" class="text-xs font-medium"
															>Title</label
														>
														<input
															id="meta-title-{source.id}"
															name="title"
															type="text"
															value={source.title}
															required
															class="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
														/>
													</div>
													<div class="space-y-1">
														<label for="meta-artist-{source.id}" class="text-xs font-medium"
															>Artist</label
														>
														<TagInput
															id="meta-artist-{source.id}"
															name="artist"
															bind:value={source.artist as string}
															placeholder="Artist A; Artist B"
														/>
													</div>
													<div class="space-y-1">
														<label for="meta-featured-{source.id}" class="text-xs font-medium"
															>Featured</label
														>
														<TagInput
															id="meta-featured-{source.id}"
															name="featured_artists"
															bind:value={source.featuredArtists as string}
															placeholder="Artist X; Artist Y"
														/>
													</div>
													<div class="space-y-1">
														<label for="meta-remix-{source.id}" class="text-xs font-medium"
															>Remix</label
														>
														<TagInput
															id="meta-remix-{source.id}"
															name="remix_artists"
															bind:value={source.remixArtists as string}
															placeholder="Artist Z"
														/>
													</div>
													<div class="space-y-1">
														<label for="meta-genre-{source.id}" class="text-xs font-medium"
															>Genre</label
														>
														<TagInput
															id="meta-genre-{source.id}"
															name="genre"
															bind:value={source.genre as string}
															placeholder="jazz; electronic"
														/>
													</div>
													<div class="space-y-1">
														<label for="meta-license-{source.id}" class="text-xs font-medium"
															>License URL</label
														>
														<input
															id="meta-license-{source.id}"
															name="license_url"
															type="url"
															value={source.licenseUrl}
															required
															class="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
														/>
													</div>
													<div class="space-y-1">
														<label for="meta-stream-{source.id}" class="text-xs font-medium"
															>Stream URL</label
														>
														<input
															id="meta-stream-{source.id}"
															name="stream_url"
															type="url"
															value={source.streamUrl ?? ''}
															placeholder="https://…"
															class="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
														/>
													</div>
													<div class="space-y-1">
														<label for="meta-duration-{source.id}" class="text-xs font-medium"
															>Duration (ms)</label
														>
														<input
															id="meta-duration-{source.id}"
															name="duration"
															type="number"
															value={source.duration ?? ''}
															min="0"
															placeholder="Set by transcoding"
															class="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
														/>
													</div>
													<div class="flex items-end sm:col-span-2 lg:col-span-3">
														<button
															type="submit"
															class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
														>
															Save Metadata
														</button>
													</div>
												</form>
											</div>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<script lang="ts">
	import { base, resolve } from '$app/paths';
	import Preview from './Preview.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { post, profile, release } = $derived(data);

	const date = new Intl.DateTimeFormat('en', {
		dateStyle: 'long',
		timeZone: 'UTC'
	});
</script>

<svelte:head>
	<title>{post.title} | {profile.name}</title>
	{#if post.excerpt}
		<meta name="description" content={post.excerpt} />
	{/if}
</svelte:head>

<main class="blog-wrap py-8 sm:py-14">
	<article>
		<header class:release-header={release && post.featuredImage}>
			<div class="release-title">
				<h1 class="blog-title">{post.title}</h1>
				{#if release}
					<p class="release-artist">{release.artist}</p>
					<p class="blog-meta">{release.format} · {release.released} · {release.label}</p>
				{/if}
			</div>
			{#if release && post.featuredImage}
				<figure class="release-cover">
					<img
						src={`${base}/${post.featuredImage}`}
						alt={release.artworkAlt}
						width="900"
						height="900"
					/>
				</figure>
			{/if}

			<div class="release-intro">
				{#if post.excerpt}
					<p class="release-excerpt">{post.excerpt}</p>
				{/if}
				{#if release}
					{#key release.preview.url}
						<Preview {...release.preview} />
					{/key}
				{/if}
			</div>
		</header>

		<div class="post-content">
			<div class="post-main min-w-0">
				<p class="blog-meta mb-5 flex flex-wrap items-center gap-x-2">
					<a
						class="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
						href={resolve('/[profile]', { profile: profile.slug })}
					>
						{profile.name}
					</a>
					<span aria-hidden="true">·</span>
					<time datetime={post.published}>{date.format(new Date(post.published))}</time>
				</p>
				<div class="blog-copy space-y-4">
					{#each post.body as paragraph, index (index)}
						<p>{paragraph}</p>
					{/each}
				</div>
			</div>

			{#if release}
				<aside class="post-sidebar min-w-0" aria-label="Release details">
					{#if release.platforms.length}
						<section>
							<h2 class="blog-heading">Listen on</h2>
							{@render externalLinks(release.platforms)}
						</section>
					{/if}
					{#if release.credits.length}
						<section>
							<h2 class="blog-heading">Credits</h2>
							<ul class="blog-list">
								{#each release.credits as credit (credit.profile.slug)}
									<li>
										<a
											class="blog-list-link"
											href={resolve('/[profile]', { profile: credit.profile.slug })}
										>
											<span class="credit">
												<span>{credit.profile.name}</span>
												{#if credit.role}
													<span class="blog-meta">{credit.role}</span>
												{/if}
											</span>
											<span class="blog-arrow" aria-hidden="true">→</span>
										</a>
									</li>
								{/each}
							</ul>
						</section>
					{/if}
				</aside>
				{#if release.related.length || release.press.length}
					<div class="min-w-0 space-y-8">
						{#if release.related.length}
							<section>
								<h2 class="blog-heading">Related posts</h2>
								<ul class="blog-list">
									{#each release.related as related (related.slug)}
										<li>
											<a
												class="blog-list-link"
												href={resolve('/[profile]/[slug]', {
													profile: related.profile,
													slug: related.slug
												})}
											>
												<span>
													<span class="related-title block">{related.title}</span>
													{#if related.excerpt}
														<span class="blog-meta mt-1 block">{related.excerpt}</span>
													{/if}
												</span>
												<span class="blog-arrow" aria-hidden="true">→</span>
											</a>
										</li>
									{/each}
								</ul>
							</section>
						{/if}
						{#if release.press.length}
							<section>
								<h2 class="blog-heading">Press &amp; archives</h2>
								{@render externalLinks(release.press)}
							</section>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</article>
</main>

{#snippet externalLinks(links: { name: string; url: string }[])}
	<ul class="blog-list">
		{#each links as link (link.url)}
			<li>
				<a class="blog-list-link" href={link.url} rel="external">
					<span>{link.name}</span>
					<span class="blog-arrow" aria-hidden="true">↗</span>
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

<style>
	.release-header {
		display: grid;
		gap: 1.5rem;
	}

	.release-artist {
		margin-block: 0.75rem 0.375rem;
		font: normal clamp(1.25rem, 3vw, 1.7rem) / 1.2 var(--serif);
	}

	.release-cover img {
		width: 100%;
		max-width: 30rem;
		height: auto;
		aspect-ratio: 1;
		object-fit: cover;
		background: var(--ink);
	}

	.release-excerpt {
		max-width: 28rem;
		margin-bottom: 1.125rem;
		font: normal clamp(1.375rem, 2.7vw, 2rem) / 1.25 var(--serif);
		text-wrap: pretty;
	}

	header:not(.release-header) .release-intro {
		margin-top: 1rem;
	}

	.post-content {
		display: grid;
		gap: 2.5rem;
		margin-top: clamp(2rem, 5vw, 3.5rem);
		padding-top: clamp(1.5rem, 4vw, 2.5rem);
		border-top: 1px solid var(--line);
	}

	.post-sidebar {
		display: grid;
		align-content: start;
		gap: 1.75rem;
	}

	.credit {
		display: flex;
		flex-wrap: wrap;
		column-gap: 0.75rem;
		align-items: baseline;
	}

	.related-title {
		font: normal 1.375rem / 1.2 var(--serif);
	}

	@media (min-width: 48rem) {
		.release-header {
			grid-template-columns: minmax(16rem, 0.85fr) minmax(0, 1.15fr);
			grid-template-rows: 1fr 1fr;
			gap: 1.5rem clamp(2rem, 6vw, 5.5rem);
			align-items: start;
		}

		.release-title {
			grid-column: 2;
			align-self: end;
		}

		.release-cover {
			grid-area: 1 / 1 / 3 / 2;
		}

		.release-header .release-intro {
			grid-column: 2;
		}

		.post-content {
			grid-template-columns: minmax(0, 1fr) minmax(14rem, 0.46fr);
			grid-template-rows: auto 1fr;
			column-gap: clamp(2rem, 7vw, 6rem);
		}

		.post-sidebar {
			grid-area: 1 / 2 / 3 / 3;
			padding-inline-start: clamp(1.5rem, 4vw, 3rem);
			border-inline-start: 1px solid var(--line);
		}
	}
</style>

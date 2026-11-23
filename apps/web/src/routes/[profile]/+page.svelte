<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.profile.name} | Vesta</title>
	<meta name="description" content={data.profile.bio} />
</svelte:head>

<main class="blog-wrap py-12 sm:py-20">
	<h1 class="blog-title">{data.profile.name}</h1>
	<p class="blog-copy mt-5">{data.profile.bio}</p>
	{#if data.profile.website}
		<a
			class="mt-3 inline-block py-3 underline underline-offset-4"
			href={data.profile.website}
			rel="external"
		>
			More about {data.profile.name} <span class="blog-arrow" aria-hidden="true">↗</span>
		</a>
	{/if}

	{#each [{ title: 'Posts', posts: data.posts }, { title: 'Credits', posts: data.releases }] as section (section.title)}
		{#if section.posts.length}
			<section class="mt-10 max-w-2xl">
				<h2 class="blog-heading">{section.title}</h2>
				<ul class="blog-list">
					{#each section.posts as post (post.slug)}
						<li>
							<a
								class="blog-list-link"
								href={resolve('/[profile]/[slug]', { profile: post.profile, slug: post.slug })}
							>
								<span>{post.title}</span>
								<span class="blog-arrow" aria-hidden="true">→</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/each}
</main>

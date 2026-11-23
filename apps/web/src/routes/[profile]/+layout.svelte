<script lang="ts">
	import { resolve } from '$app/paths';
	import './blog.css';

	let { children } = $props();
</script>

<div class="music-blog" lang="en">
	<header class="blog-masthead">
		<div class="blog-wrap">
			<a class="blog-brand" href={resolve('/[profile]', { profile: 'shellac-notes' })}>
				Shellac Notes
			</a>
		</div>
	</header>
	{@render children()}
</div>

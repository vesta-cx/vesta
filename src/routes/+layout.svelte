<script lang="ts">
	import '$lib/styles/index.scss';
	import { Footer } from '@/layout/footer/index.js';
	import * as Header from '@/layout/header/index.js';
	import { Main } from '@/layout/main/index.js';
	import { ViewTransition } from '@/utils/view-transition/index.js';
	import '../app.css';

	let { children } = $props();
</script>

<ViewTransition />

<Header.Root class="z-50">
	<Header.Logo>
		<a href="/">@vesta-cx/ui</a>
	</Header.Logo>
	<nav class="contents">
		<ul class="flex gap-6">
			<li>Components</li>
			<li>About</li>
			<li>GitHub</li>
		</ul>
	</nav>
</Header.Root>
<Main>
	{@render children()}
</Main>
<Footer>
	<p>Footer</p>
</Footer>

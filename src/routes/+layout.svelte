<script lang="ts">
	import '$lib/styles/index.scss';
	import Footer from '@/layout/Footer.svelte';
	import * as Header from '@/layout/header/index.js';
	import Main from '@/layout/Main.svelte';
	import ViewTransition from '@/utils/view-transition.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<ViewTransition />

<Header.Root>vesta</Header.Root>
<Main>
	{@render children()}
</Main>
<Footer></Footer>

<script lang="ts">
	import { Footer } from '@vesta-cx/ui/components/layout/footer';
	import { Anchor } from '@vesta-cx/ui/components/utils/anchor';
	import GithubIcon from '@lucide/svelte/icons/github';
	import MailIcon from '@lucide/svelte/icons/mail';
</script>

<Footer>
	<div
		class="container grid grid-cols-1 items-start gap-8 rounded-none p-4 py-10 sm:rounded-2xl md:grid-cols-4"
	>
		<!-- Brand -->
		<section class="flex h-full flex-col justify-between md:col-span-2">
			<div>
				<h2 class="text-2xl font-bold tracking-tight">Vesta</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Audio quality perception research — which codecs and bitrates actually sound best?
				</p>
				<Anchor class="mt-2 text-sm font-bold" href="https://github.com/vesta-cx/sona">
					Contribute to this project
				</Anchor>
			</div>

			<div class="mt-6 flex flex-wrap items-center gap-6">
				<ul class="flex gap-4">
					<li>
						<a
							class="flex items-center text-muted-foreground transition-colors hover:text-foreground"
							target="_blank"
							rel="noopener noreferrer"
							href="https://github.com/vesta-cx"
						>
							<GithubIcon class="size-5" />
							<span class="sr-only">GitHub</span>
						</a>
					</li>
					<li>
						<Anchor
							class="text-muted-foreground transition-colors hover:text-foreground"
							href="mailto:contact@mia.cx"
							showIcon={false}
						>
							<MailIcon class="size-5" />
							<span class="sr-only">Email</span>
						</Anchor>
					</li>
				</ul>
			</div>
		</section>

		<!-- Sitemap -->
		<section>
			<h3 class="text-sm font-semibold tracking-wider uppercase">Sitemap</h3>
			<ul class="mt-3 space-y-2 text-sm">
				<li><Anchor class="text-muted-foreground hover:text-foreground" href="/">Home</Anchor></li>
				<li>
					<Anchor class="text-muted-foreground hover:text-foreground" href="/survey/setup">
						Take the Survey
					</Anchor>
				</li>
				<li>
					<Anchor class="text-muted-foreground hover:text-foreground" href="/admin">Admin</Anchor>
				</li>
			</ul>
		</section>

		<!-- Resources -->
		<section>
			<h3 class="text-sm font-semibold tracking-wider uppercase">Resources</h3>
			<ul class="mt-3 space-y-2 text-sm">
				<li>
					<Anchor
						class="text-muted-foreground hover:text-foreground"
						href="https://github.com/vesta-cx"
					>
						Source Code
					</Anchor>
				</li>
				<li>
					<Anchor class="text-muted-foreground hover:text-foreground" href="mailto:contact@mia.cx">
						Contact
					</Anchor>
				</li>
				<li>
					<Anchor class="text-muted-foreground hover:text-foreground" href="/legal/license">
						Content License
					</Anchor>
				</li>
				<li>
					<Anchor class="text-muted-foreground hover:text-foreground" href="/legal/privacy">
						Privacy Policy
					</Anchor>
				</li>
				<li>
					<Anchor class="text-muted-foreground hover:text-foreground" href="/legal/terms">
						Terms of Use
					</Anchor>
				</li>
				<li>
					<Anchor class="text-muted-foreground hover:text-foreground" href="/cookies">
						Cookie Settings
					</Anchor>
				</li>
			</ul>
		</section>

		<!-- Copyright -->
		<div class="flex text-xs text-muted-foreground md:col-span-4">
			<span>&copy; {new Date().getFullYear()} Vesta</span>
		</div>
	</div>
</Footer>

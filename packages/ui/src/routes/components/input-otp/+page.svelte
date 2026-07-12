<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as InputOTP from '@/ui/input-otp/index.js';

</script>

<ComponentPageHeader name="Input OTP" description="Collects one-time passcodes with grouped, keyboard-friendly slots." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Verification code">
		{#snippet preview()}
			<InputOTP.Root maxlength={6} value="123456">
				{#snippet children({ cells })}
					<InputOTP.Group>
						{#each cells.slice(0, 3) as cell}<InputOTP.Slot {cell} />{/each}
					</InputOTP.Group>
					<InputOTP.Separator />
					<InputOTP.Group>
						{#each cells.slice(3, 6) as cell}<InputOTP.Slot {cell} />{/each}
					</InputOTP.Group>
				{/snippet}
			</InputOTP.Root>
		{/snippet}
	</DemoBlock>
</section>

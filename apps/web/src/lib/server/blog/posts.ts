import type { posts, resourceAuthors, resources, resourceUrls } from '@vesta-cx/db/schema';

type Profile = {
	slug: string;
	name: string;
	bio: string;
	website?: string;
};

type PostLink = Pick<typeof resources.$inferSelect, 'title' | 'excerpt'> & {
	slug: string;
};

type Credit = Pick<typeof resourceAuthors.$inferSelect, 'role'> & { profile: string };
type Link = Pick<typeof resourceUrls.$inferSelect, 'name' | 'url'>;

type Post = Omit<PostLink, 'title'> &
	Pick<typeof posts.$inferSelect, 'featuredImage'> & {
		title: string;
		profile: string;
		published: string;
		body: string[];
	};

type ReleasePost = Post & {
	release: {
		format: 'Album' | 'Single' | 'Compilation';
		released: string;
		artist: string;
		label: string;
		artworkAlt: string;
		preview: { url: string; duration: number };
		platforms: Link[];
		credits: Credit[];
		press: Link[];
		related: string[];
	};
};

const profiles: Profile[] = [
	{
		slug: 'shellac-notes',
		name: 'Shellac Notes',
		bio: 'A listening journal for old records and the people who made them.'
	},
	{
		slug: 'louis-armstrong',
		name: 'Louis Armstrong',
		bio: 'Trumpeter, singer, and leader of the Hot Five. Armstrong recorded “West End Blues” in Chicago in 1928.',
		website: 'https://www.louisarmstronghouse.org/biography/'
	},
	{
		slug: 'earl-hines',
		name: 'Earl Hines',
		bio: 'Pianist on “West End Blues.” His solo trades a steady left hand for short, bright phrases in the right.',
		website: 'https://www.britannica.com/biography/Earl-Hines'
	},
	{
		slug: 'fred-robinson',
		name: 'Fred Robinson',
		bio: 'Trombonist in the Hot Five lineup that recorded “West End Blues” in Chicago.'
	},
	{
		slug: 'jimmy-strong',
		name: 'Jimmy Strong',
		bio: 'Clarinetist on “West End Blues.” Listen for the clarinet behind Armstrong’s wordless vocal.'
	},
	{
		slug: 'mancy-carr',
		name: 'Mancy Carr',
		bio: 'Banjo player in the Hot Five lineup that recorded “West End Blues.”'
	},
	{
		slug: 'zutty-singleton',
		name: 'Zutty Singleton',
		bio: 'Drummer on “West End Blues.” His cymbals answer the trumpet in the closing bars.'
	},
	{
		slug: 'king-oliver',
		name: 'King Oliver',
		bio: 'Cornetist, bandleader, and composer of “West End Blues.” Oliver recorded the tune before the Hot Five.',
		website:
			'https://archive.org/details/78_west-end-blues_king-olivers-dixie-syncopators_gbia0380362b'
	}
];

const westEndBlues: ReleasePost = {
	profile: 'shellac-notes',
	slug: 'west-end-blues',
	title: 'West End Blues',
	excerpt: 'A trumpet alone for twelve seconds, and then the whole room comes in.',
	published: '2026-06-28',
	featuredImage: 'releases/west-end-blues.webp',
	body: [
		'Louis Armstrong starts without the band. Listen to how he hangs on the high notes, then tumbles down the horn. When the Hot Five come in, it feels like they’ve been waiting for him to land.',
		'King Oliver wrote the tune. On this take, Armstrong sings a wordless duet with Jimmy Strong’s clarinet. Earl Hines takes over at the piano before the trumpet returns for one long, held note.'
	],
	release: {
		format: 'Single',
		released: '1928',
		artist: 'Louis Armstrong and His Hot Five',
		label: 'Okeh 8597',
		artworkAlt: 'Original black and gold Okeh record label for West End Blues',
		preview: { url: 'releases/west-end-blues.mp3', duration: 30 },
		platforms: [
			{
				name: 'Apple Music',
				url: 'https://music.apple.com/us/album/west-end-blues/201274363?i=201277870'
			},
			{ name: 'Internet Archive', url: 'https://archive.org/details/west-end-blues' }
		],
		credits: [
			{ profile: 'louis-armstrong', role: 'Trumpet, vocals' },
			{ profile: 'earl-hines', role: 'Piano' },
			{ profile: 'fred-robinson', role: 'Trombone' },
			{ profile: 'jimmy-strong', role: 'Clarinet' },
			{ profile: 'mancy-carr', role: 'Banjo' },
			{ profile: 'zutty-singleton', role: 'Drums' },
			{ profile: 'king-oliver', role: 'Composition' }
		],
		press: [
			{
				name: '“West End Blues” on NPR',
				url: 'https://www.npr.org/2000/08/06/1080400/west-end-blues'
			},
			{
				name: 'The Hot Five and Hot Seven recordings',
				url: 'https://loc.gov/static/programs/national-recording-preservation-board/documents/HotFiveHotSevenRecordings.pdf'
			}
		],
		related: ['king-olivers-west-end-blues', 'earl-hines-at-the-piano']
	}
};

const postsByDate: (Post | ReleasePost)[] = [
	westEndBlues,
	{
		profile: 'shellac-notes',
		slug: 'king-olivers-west-end-blues',
		title: 'King Oliver’s “West End Blues”',
		excerpt: 'The composer’s own recording puts the tune in a different light.',
		published: '2026-06-21',
		featuredImage: null,
		body: [
			'Play King Oliver’s version first and you can hear what Armstrong keeps: the slow pace, the blues form, and a melody that leaves room between its phrases.',
			'Then compare the entrances. Oliver lets the band establish the tune. Armstrong makes the introduction a solo before you hear the first full chorus.'
		]
	},
	{
		profile: 'shellac-notes',
		slug: 'earl-hines-at-the-piano',
		title: 'Earl Hines at the piano',
		excerpt: 'Listen for the piano chorus between Armstrong’s voice and trumpet.',
		published: '2026-06-14',
		featuredImage: null,
		body: [
			'When Hines takes the chorus, tap along to his left hand. His right hand doesn’t settle into the same pattern. Phrases arrive in little bursts, with pauses where you might expect more notes.',
			'The piano sounds crisp next to Armstrong’s sustained trumpet. Listen for that change in texture the next time the solo comes around.'
		]
	}
];

export function loadProfile(slug: string) {
	const profile = profiles.find((profile) => profile.slug === slug);
	if (!profile) return;

	const posts = postsByDate.filter((post) => post.profile === slug);
	const releases = postsByDate.filter(
		(post) => 'release' in post && post.release.credits.some((credit) => credit.profile === slug)
	);

	return { profile, posts, releases };
}

export function loadPost(profileSlug: string, slug: string) {
	const profile = profiles.find((profile) => profile.slug === profileSlug);
	const post = postsByDate.find((post) => post.profile === profileSlug && post.slug === slug);
	if (!profile || !post) return;
	if (!('release' in post)) return { post, profile, release: null };

	const credits = post.release.credits.flatMap((credit) => {
		const collaborator = profiles.find((profile) => profile.slug === credit.profile);
		return collaborator ? [{ role: credit.role, profile: collaborator }] : [];
	});
	const related = post.release.related.flatMap((slug) => {
		const relatedPost = postsByDate.find(
			(candidate) => candidate.profile === profileSlug && candidate.slug === slug
		);
		return relatedPost ? [relatedPost] : [];
	});

	return { post, profile, release: { ...post.release, credits, related } };
}

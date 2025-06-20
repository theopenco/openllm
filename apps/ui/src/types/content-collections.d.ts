declare module "content-collections" {
	export interface Changelog {
		id: string;
		slug: string;
		date: string;
		title: string;
		summary: string;
		image: {
			src: string;
			alt: string;
			width: number;
			height: number;
		};
		content: string;
	}

	export const allChangelogs: Changelog[];
}

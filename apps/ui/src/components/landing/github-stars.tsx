import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";

import { Button } from "@/lib/components/button";
import { GITHUB_URL } from "@/lib/env";

async function fetchGitHubStars(repo: string): Promise<number> {
	const res = await fetch(`https://api.github.com/repos/${repo}`);
	if (!res.ok) {
		throw new Error("Failed to fetch GitHub repo");
	}
	const data = await res.json();
	return data.stargazers_count;
}

function useGitHubStars(repo: string) {
	return useQuery({
		queryKey: ["github-stars", repo],
		queryFn: () => fetchGitHubStars(repo),
		refetchOnWindowFocus: false,
		staleTime: 1000 * 60 * 10, // 10 minutes
	});
}

const REPO = "theopenco/llmgateway";

export function GitHubStars() {
	const { data: stars, isLoading, isError } = useGitHubStars(REPO);

	return (
		<Button asChild>
			<a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
				<Star className="-ms-1 me-2 opacity-60" size={16} />
				<span className="flex items-baseline gap-2">
					Star
					<span className="text-xs text-primary-foreground/60">
						{isLoading ? "..." : isError ? "?" : stars?.toLocaleString()}
					</span>
				</span>
			</a>
		</Button>
	);
}

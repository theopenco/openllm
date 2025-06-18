export function maskToken(token: string, visibleChars = 12): string {
	return `${token.substring(0, visibleChars)}${"\u2022".repeat(11)}`;
}

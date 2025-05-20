export type LogoProps = React.HTMLAttributes<SVGElement>;

const Logo = (props: LogoProps) => (
	<svg
		{...props}
		fill="currentColor"
		viewBox="0 0 256 256"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M232 128A104 104 0 1 1 128 24a104.12041 104.12041 0 0 1 104 104Z" />
	</svg>
);

export default Logo;

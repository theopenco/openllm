/// <reference types="vinxi/types/client" />
import { StartClient } from "@tanstack/react-start";
import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

import { createRouter } from "./router";

const router = createRouter();

hydrateRoot(
	document,
	<StrictMode>
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			storageKey="theme"
		>
			<StartClient router={router} />
		</ThemeProvider>
	</StrictMode>,
);

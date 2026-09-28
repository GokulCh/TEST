"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/panel/form-parts";
import { ErrorPanel } from "@/components/shared/error-panel";

interface Props {
	children: ReactNode;
	/** Shown as the panel's heading; defaults to a generic message. */
	title?: string;
}

interface State {
	error: Error | null;
}

/** Catches render-time errors in its subtree so one broken widget doesn't blank the whole page. */
export class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null };

	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("ErrorBoundary caught:", error, info.componentStack);
	}

	render() {
		if (this.state.error) {
			return (
				<ErrorPanel
					title={this.props.title ?? "Something went wrong"}
					actions={
						<Button variant="secondary" onClick={() => this.setState({ error: null })}>
							Try again
						</Button>
					}
				>
					{this.state.error.message}
				</ErrorPanel>
			);
		}
		return this.props.children;
	}
}

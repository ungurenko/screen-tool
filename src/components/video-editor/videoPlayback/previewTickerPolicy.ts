export interface PreviewTickerState {
	isPlaying: boolean;
	isSeeking: boolean;
	isInteracting: boolean;
	isVisible: boolean;
	suspendRendering: boolean;
}

export function shouldRunPreviewTicker(state: PreviewTickerState): boolean {
	if (!state.isVisible || state.suspendRendering) return false;
	return state.isPlaying || state.isSeeking || state.isInteracting;
}

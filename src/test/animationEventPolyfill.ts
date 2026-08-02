// jsdom has no AnimationEvent global. React feature-detects `'AnimationEvent' in
// window` at module init to decide whether it needs vendor-prefixed animation
// event names (webkitAnimationEnd, etc.) — without this, onAnimationEnd handlers
// never fire in tests, since React ends up listening for the wrong native event
// name. Has to run before react-dom is first imported anywhere, hence its own
// setup file ordered ahead of setup.ts in vite.config.ts's setupFiles list.
if (typeof window.AnimationEvent === 'undefined') {
    (window as unknown as { AnimationEvent: unknown }).AnimationEvent = window.Event;
}

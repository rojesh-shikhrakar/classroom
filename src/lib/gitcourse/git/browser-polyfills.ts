import { Buffer } from 'buffer';

// isomorphic-git checks for the Node-compatible Buffer global while reading
// streamed packfiles. Vite no longer injects that global into browser bundles.
globalThis.Buffer ??= Buffer;

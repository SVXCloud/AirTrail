import { rewriteDiscoveryUrl } from './base-path.js';
import { server } from '../../build/index.js';

// Keep RFC 8414 and RFC 9728 discovery available at the host-level paths.
server.server.prependListener('request', rewriteDiscoveryUrl);

// The installed OKF parser must not resolve YAML from the host machine or fetch
// it at runtime. This adapter names the pinned, repository-local runtime.
export { isMap, parseDocument } from "../runtime/vendor/yaml/dist/index.js";

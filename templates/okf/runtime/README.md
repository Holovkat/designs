# OKF Parser Runtime

This directory carries the exact offline parser runtime used by installed OKF
consumers. It is intentionally repository-local: a parser must never resolve a
host-global package, run `npm install`, or fetch a dependency while reading a
bundle.

## Pinned artifact

| Field | Value |
|---|---|
| Package | `yaml` |
| Version | `2.8.3` |
| License | ISC (`vendor/yaml/LICENSE`) |
| npm integrity | `sha512-AvbaCLOO2Otw/lW5bmh9d/WEdcDFdQp2Z2ZUH3pX9U2ihyUY0nvLv7J6TrWowklRGPYbB/IuIMfYgxaCPg5Bpg==` |
| Source tarball SHA-256 | `9539805d7447def2bed5c5b4acacc283362c5e80abc5d93472b2f35f0cbf85ad` |

`package-lock.json` is the reproducible dependency receipt. `vendor/yaml/` is
the reviewed unpacked package, copied from that exact artifact; it is loaded
only through `lib/yaml-runtime.mjs`.

The runtime contains no OKF command, hook, scheduler, network client, curator,
or automatic action. Future dependency changes require an explicit dependency
refresh, a lockfile update, artifact integrity review, fixture tests, and a
separate commit.

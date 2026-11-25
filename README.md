<div align="center">
  <br/>
  <a href="https://hub.docker.com/r/johly/airtrail/">
    <img src="https://img.shields.io/docker/pulls/johly/airtrail?style=for-the-badge" alt="Docker pulls">
  </a>
  <a href="https://github.com/johanohly/AirTrail/releases/latest">
    <img src="https://img.shields.io/github/v/release/johanohly/AirTrail?style=for-the-badge" alt="Latest version">
  </a>
  <a href="https://github.com/johanohly/AirTrail/stargazers">
    <img src="https://img.shields.io/github/stars/johanohly/AirTrail?style=for-the-badge" alt="Stars">
  </a>
  <br/>
  <br/>
</div>

<div align="center">
  <a href="https://airtrail.johan.ohly.dk/">
    <img src="static/favicon.png" alt="AirTrail logo" width="80" height="80">
  </a>

<h3 align="center">AirTrail</h3>

  <p align="center">
    A web application that allows users to track their flights and view their flight history.
  </p>
</div>

<img src="static/showcase/toggle.png" alt="AirTrail Preview">

## ✨ Features

- **World Map**: View all your flights on an interactive world map.
- **Flight History**: Keep track of all your flights in one place.
- **Statistics**: Get insights into your flight history with statistics.
- **Multiple Users**: Manage multiple users, share flights among them, secure your data with user authentication and
  integrate with your OAuth provider.
- **Responsive Design**: Use the application on any device with a responsive design.
- **Dark Mode**: Switch between light and dark mode.
- **Import Flights**: Import flights from various sources including MyFlightRadar24, App in the Air, JetLog, TripIt, Flighty, byAir, JetLovers, OpenFlights and LogMyTrip.

## 🚀 Getting Started

- [Documentation](https://airtrail.johan.ohly.dk/docs/overview/introduction)
- [Installation](https://airtrail.johan.ohly.dk/docs/overview/quick-start)
- [About](https://airtrail.johan.ohly.dk/docs/overview/introduction)
- [Demo](https://demo.airtrail.johan.ohly.dk)
- [Contributing](https://airtrail.johan.ohly.dk/docs/overview/contributing)

## Deploying under a URL prefix

The `subpath` branch follows the latest official stable release. One image
supports both root and prefixed deployments. Leave `BASE_PATH` empty for
`https://flights.example.com/`, or set it to `/airtrail` for
`https://flights.example.com/airtrail/`. Multiple segments such as
`/apps/airtrail` are supported. Keep `ORIGIN=https://flights.example.com` in
both cases.

1. Copy `.env.example` to a deployment directory as `.env`. Set `ORIGIN`,
   `BASE_PATH`, `DB_PASSWORD`, and the matching password in `DB_URL`. If the
   password contains URL punctuation, percent-encode it in `DB_URL`.
2. Copy [the Compose example](docker/subpath/compose.yml) into that directory
   as `compose.yml`, then run `docker compose up -d`. The example uses
   `/airtrail` as its default. For root deployment set `BASE_PATH=` in `.env`.
3. Forward the **unchanged** request path through
   [Nginx](docker/subpath/nginx.conf), [Caddy](docker/subpath/Caddyfile), or
   [Cloudflare Tunnel](docker/subpath/cloudflared.yml). Adjust the hostname and
   every prefix in the example. If the proxy runs in Docker, replace the
   loopback upstream with the AirTrail service address on its Docker network.
   Preserve the two host-level OAuth discovery routes in the examples.

Build the image locally until a version has passed CI and been published:

```sh
docker build -f docker/Dockerfile -t airtrail-subpath:local .
AIRTRAIL_IMAGE=airtrail-subpath:local docker compose up -d
```

For a source checkout, export `BASE_PATH` before running Vite or building.
Start a source-built production server with the same value and
`node scripts/subpath/runtime.js`. The container sets its base at startup
and needs writable temporary storage for its relocated build.

To remount an existing installation, keep the existing PostgreSQL and uploads
volumes and the same Compose project name. Back them up before upgrading.
Changing the mount changes public URLs. Update existing share and calendar
links, set the external OIDC redirect URI to
`https://flights.example.com/airtrail/login`, and update API and MCP clients
to use the new resource and issuer URLs. Sign in again if the browser's
existing session cookie was scoped to the former mount.

The [stable release workflow](.github/workflows/subpath.yml) checks for upstream
stable releases daily, merges into a candidate, and runs unit tests plus root
and nested deployments on Linux amd64 and arm64. It publishes the tested
images to GHCR only after validation. Set `subpath` as the repository default branch to activate the schedule.
To publish the first image after review, choose **Run workflow** with
**publish** enabled on that branch. Merge conflicts and validation failures are recorded in the run
summary and downloadable logs.

## 🤝 Contributing

Want to contribute to AirTrail? Awesome! Check out the [contributing documentation](CONTRIBUTING.md) to get started.

If you find an issue, please report it on the [issue tracker](https://github.com/johanohly/AirTrail/issues/new/choose).

## Build Status

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/JohanOhly/AirTrail/build.yml?logo=github&style=for-the-badge)](https://github.com/JohanOhly/AirTrail/releases/latest)

#### Sonarcloud Quality metrics

[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=johanohly_AirTrail&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=johanohly_AirTrail)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=johanohly_AirTrail&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=johanohly_AirTrail)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=johanohly_AirTrail&metric=bugs)](https://sonarcloud.io/summary/new_code?id=johanohly_AirTrail)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=johanohly_AirTrail&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=johanohly_AirTrail)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=johanohly_AirTrail&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=johanohly_AirTrail)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=johanohly_AirTrail&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=johanohly_AirTrail)

#### FOSSA license and security scans

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fjohanohly%2FAirTrail.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fjohanohly%2FAirTrail?ref=badge_shield&issueType=license)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fjohanohly%2FAirTrail.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2Fjohanohly%2FAirTrail?ref=badge_shield&issueType=security)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fjohanohly%2FAirTrail.svg?type=small)](https://app.fossa.com/projects/git%2Bgithub.com%2Fjohanohly%2FAirTrail?ref=badge_small)

#### OpenSSF best practices

[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/9689/badge)](https://bestpractices.coreinfrastructure.org/projects/9689)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/johanohly/AirTrail/badge)](https://scorecard.dev/viewer/?uri=github.com/johanohly/AirTrail)

## Star History

<a href="https://www.star-history.com/?repos=johanohly%2Fairtrail&type=timeline&releases&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=johanohly/airtrail&type=date&theme=dark&legend=bottom-right" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=johanohly/airtrail&type=date&legend=bottom-right" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=johanohly/airtrail&type=date&legend=bottom-right" />
 </picture>
</a>

## Acknowledgements

### Data Sources

> [Airport Data](https://ourairports.com)

> [Country Borders](https://gisco-services.ec.europa.eu/distribution/v2/countries/geojson/CNTR_RG_01M_2024_4326.geojson), [NUTS Level 0 Borders](https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2024_4326_LEVL_0.geojson), and [Natural Earth Admin 0 Countries](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/)

> [EU Countries and Territories Vocabulary](https://op.europa.eu/en/web/eu-vocabularies/countries-and-territories)

> [Country Flags](https://flagpedia.net)

### Airline Icons

The airline icon list ([`static/airlines`](static/airlines)) is based on [Soaring Symbols](https://github.com/anhthang/soaring-symbols) by Anh Thang.

Airline logos/icons are provided for identification and reference purposes only. AirTrail does not claim ownership of any trademarks or copyrighted materials in those logos. All logos remain the intellectual property of their respective airlines.

### Logo

The logo is from Lucide, which is a free icon pack that can be found [here](https://www.lucide.dev/).

> Copyright (c) for portions of Lucide are held by Cole Bemis 2013-present as part of Feather (MIT). All other copyright (
> c) for Lucide are held by Lucide Contributors 2026.

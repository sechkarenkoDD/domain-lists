# Domain lists

`service-catalog.json` is the only source of truth. It is consumed directly by
the Keenetic Hopper service-routing controller every 15 minutes.

## Catalog structure

Each `services` entry has a permanent `id`, display `name`, one or more
`memberships` and optional `ipv4Lists`.

- A membership contains a category and the complete set of domains that move
  together.
- `ipv4Lists` references IPv4 networks that must follow the same service.
- `probeDomains` optionally defines the preferred health-check endpoints.
- `probeRejectPatterns` optionally contains text which identifies a
  service-specific blocking page.

The catalog never stores a country, a WireGuard server or a current route. That
state belongs to Hopper. A new service starts in WG1; later health checks may
move it between Ethernet, WG1, WG2 and WG3. A newly added domain of an existing
service stays with the route already selected for that service.

## Editing safely

Add a new service as one entry in `services`. Add a related domain to the
existing service's `memberships[].domains`. Add IPv4 networks to `ipv4Lists`
and reference that list from the owner service. Do not create a second list or
an independent route record for the same resource.

The former `data/`, `lists/`, `data-ipv4/`, `index.json` and `metadata/`
layouts were removed intentionally. Keeping them would create two conflicting
sources of truth.

## Validation

From the neighbouring `keenetic-sync` repository:

```sh
node keenetic-hopper-3810/catalog-audit.js ../domain-lists
node keenetic-hopper-3810/build-service-manifest.js ../domain-lists /tmp/service-routing-manifest.json
```

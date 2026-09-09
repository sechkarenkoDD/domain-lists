# Domain lists for Keenetic

This repository is the source of service domains used by `keenetic-sync`.
The editable source is `service-catalog.json`.

## Data model

The catalog keeps two useful levels of information:

- **categories** — AI, Anime, Art, Automotive and the other groups visible on
  the router;
- **services and memberships** — the service name, its domains and the category
  to which those domains belong.

Related domains stay attached to their service. For example, a service can
contain its main site, API, authentication hosts and CDN domains. This
information is preserved even though the current router configuration combines
all services in the same category into one DNS group.

The catalog also contains `ipv4Lists` for services that require network routes
in addition to domain routing.

## Current routing model

The Hopper downloads the catalog and creates exactly one DNS group for each
category:

```text
AI
Anime
Art
Automotive
Communication
Design
Education
Finance
Gambling
Games
Hosting Dev
Music
News Media
Porn
Social
Tools
Torrents
Video
```

All domains from all service memberships of a category are merged into its one
group. The router currently sends every managed category and catalog IPv4
network through `NetherlandsAmsterdamS9`.

If a completely new category is introduced later, the router initially creates
it with the ordinary Ethernet connection. It is moved to the managed
WireGuard route only after the category is reviewed and added to the router
configuration.

The catalog does not choose a WireGuard server and does not contain the active
router route. Those settings belong to the `keenetic-sync` configuration.

## Updating the catalog

When adding or changing a service:

1. Keep all domains required by that service together in its membership.
2. Assign each membership to the appropriate category.
3. Use lowercase host names without URL paths.
4. Add an IPv4 list only when domain routing cannot cover the service.
5. Preserve service boundaries even when several services share a category.

The router synchronizer removes obsolete domains, adds new domains and keeps the
single group per category up to date automatically.

## Future KeeneticOS policy routing

The service and membership structure is intentionally retained. When KeeneticOS
can assign a DNS route to a user policy, the existing category groups can be
sent to a visible policy containing several WireGuard connections in priority
order. No split into `WG1`, `WG2` and `WG3` copies will be required.

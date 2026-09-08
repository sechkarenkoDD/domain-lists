#!/usr/bin/env node
"use strict";

// The single editable source is service-catalog.json. This compiler produces
// legacy category files solely for Keenetic's existing list consumer.
const fs = require("fs");
const path = require("path");

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function write(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${value}\n`); }
function validateDomain(domain) { return /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(domain); }
function flatten(source) {
  if (source.version !== 1 || !Array.isArray(source.categories) || !Array.isArray(source.services) || !Array.isArray(source.ipv4Lists)) throw new Error("invalid service-catalog.json");
  const categoryIds = new Set(source.categories.map(x => x.id));
  if (categoryIds.size !== source.categories.length) throw new Error("duplicate category");
  const categoryDomains = Object.fromEntries(source.categories.map(x => [x.id, []]));
  const services = source.services.map(service => {
    if (!/^[a-z0-9-]+$/.test(service.id) || !Array.isArray(service.memberships) || !service.memberships.length) throw new Error(`invalid service: ${service.id}`);
    const seen = new Set(); const domains = [];
    for (const membership of service.memberships) {
      if (!categoryIds.has(membership.category) || !Array.isArray(membership.domains)) throw new Error(`invalid membership: ${service.id}`);
      for (const domain of membership.domains) {
        if (!validateDomain(domain)) throw new Error(`invalid domain ${domain}`);
        categoryDomains[membership.category].push(domain);
        if (!seen.has(domain)) { seen.add(domain); domains.push(domain); }
      }
    }
    return { ...service, category: service.category || service.memberships[0].category, categories: [...new Set(service.memberships.map(x => x.category))], domains, memberships: undefined };
  });
  for (const id of Object.keys(categoryDomains)) categoryDomains[id] = [...new Set(categoryDomains[id])].sort();
  const ipv4Lists = {};
  for (const list of source.ipv4Lists) {
    if (!/^[a-z0-9-]+$/.test(list.id) || !Array.isArray(list.cidrs)) throw new Error("invalid IPv4 list");
    ipv4Lists[list.id] = list.cidrs;
  }
  return { services, categoryDomains, ipv4Lists };
}
function compile(root) {
  const source = readJson(path.join(root, "service-catalog.json"));
  const { services, categoryDomains, ipv4Lists } = flatten(source);
  const index = { generated_at: new Date().toISOString(), generated_from: "service-catalog.json", domain_lists: [], ipv4_route_lists: [] };
  for (const category of source.categories) {
    const file = category.dataPath || `data/${category.id}`;
    write(path.join(root, file), categoryDomains[category.id].join("\n"));
    if (category.listPath) write(path.join(root, category.listPath), categoryDomains[category.id].join("\n"));
    index.domain_lists.push({ name: category.id, domain_count: categoryDomains[category.id].length, url_path: file });
  }
  for (const list of source.ipv4Lists) {
    const file = list.dataPath || `data-ipv4/${list.id}`;
    write(path.join(root, file), ipv4Lists[list.id].join("\n"));
    index.ipv4_route_lists.push({ name: list.id, route_count: ipv4Lists[list.id].length, url_path: file });
  }
  write(path.join(root, "index.json"), JSON.stringify(index, null, 2));
  write(path.join(root, "metadata/services.json"), JSON.stringify({ version: 2, description: "Generated from ../service-catalog.json. Edit that single source file.", services }, null, 2));
  return { categories: source.categories.length, services: services.length, domains: new Set(Object.values(categoryDomains).flat()).size, ipv4Lists: source.ipv4Lists.length };
}
module.exports = { compile, flatten };
if (require.main === module) console.log(JSON.stringify(compile(process.argv[2] || process.cwd())));

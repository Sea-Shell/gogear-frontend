import { createServer } from 'node:http';
import { parse as parseUrl } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

import ini from 'ini';
import sirv from 'sirv';
import YAML from 'yaml';

const DIST_DIR = path.resolve(process.env.DIST_DIR ?? './dist');
const CONFIG_ENDPOINT = '/console-config.json';
const DEFAULT_PORT = parsePort(process.env.PORT) ?? 3000;

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

const configPath = resolveConfigPath(args);
const runtimeConfig = buildRuntimeConfig(configPath);

const serveStatic = sirv(DIST_DIR, { single: true, dev: false, etag: true, immutable: true, maxAge: 31536000 });

const server = createServer((request, response) => {
  const { pathname } = parseUrl(request.url ?? '/');

  if (pathname === CONFIG_ENDPOINT) {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store, must-revalidate');
    response.end(JSON.stringify(runtimeConfig));
    return;
  }

  serveStatic(request, response);
});

server.listen(DEFAULT_PORT, () => {
  console.log(`GoGear console ready on port ${DEFAULT_PORT}`);
  if (configPath) {
    console.log(`Loaded runtime config from: ${configPath}`);
  }
});

function resolveConfigPath(argv) {
  const inline = argv.find((arg) => arg.startsWith('--config='));
  if (inline) {
    const value = inline.substring('--config='.length).trim();
    if (value) return path.resolve(value);
  }

  const flagIndex = argv.findIndex((arg) => arg === '--config');
  if (flagIndex !== -1 && argv[flagIndex + 1]) {
    return path.resolve(argv[flagIndex + 1]);
  }

  const envCandidate = process.env.CONFIG_FILE ?? process.env.GOGEAR_CONSOLE_CONFIG ?? process.env.GOGEAR_CONFIG;
  return envCandidate ? path.resolve(envCandidate) : null;
}

function buildRuntimeConfig(filePath) {
  const defaults = {
    baseUrl: 'https://gogear-api.sea-shell.no',
    apiPrefix: '/api/v1',
    googleClientId: '11917978315-lnsh30ocqm6taonip3handfmi1jj8tl3.apps.googleusercontent.com'
  };

  const fileConfig = loadConfigFile(filePath);
  const normalized = normalizeConfig(fileConfig);

  const baseUrl = sanitizeBaseUrl(
    coalesceString(
      process.env.GOGEAR_API_BASE_URL,
      process.env.GOGEAR_API_URL,
      process.env.API_BASE_URL,
      normalized.baseUrl
    )
  );
  const apiPrefix = sanitizePrefix(
    coalesceString(process.env.GOGEAR_API_PREFIX, process.env.API_PREFIX, normalized.apiPrefix, defaults.apiPrefix)
  );
  const googleClientId = coalesceString(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    normalized.googleClientId,
    defaults.googleClientId
  );

  return {
    baseUrl: baseUrl ?? defaults.baseUrl,
    apiPrefix: apiPrefix ?? defaults.apiPrefix,
    googleClientId: googleClientId ?? defaults.googleClientId
  };
}

function loadConfigFile(filePath) {
  if (!filePath) {
    return {};
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const extension = path.extname(filePath).toLowerCase();

    if (extension === '.yaml' || extension === '.yml') {
      return YAML.parse(raw) ?? {};
    }
    if (extension === '.json') {
      return JSON.parse(raw);
    }
    if (extension === '.ini') {
      return ini.parse(raw);
    }

    try {
      return JSON.parse(raw);
    } catch (_) {
      return YAML.parse(raw) ?? {};
    }
  } catch (error) {
    console.warn(`Unable to load config file at ${filePath}:`, error.message ?? error);
    return {};
  }
}

function normalizeConfig(input) {
  if (!isPlainObject(input)) {
    return {};
  }

  const google = isPlainObject(input.google) ? input.google : {};
  const api = isPlainObject(input.api) ? input.api : {};
  const auth = isPlainObject(input.auth) ? input.auth : {};

  return {
    baseUrl: coalesceString(input.baseUrl, input.apiBaseUrl, api.baseUrl, api.url, auth.baseUrl),
    apiPrefix: coalesceString(input.apiPrefix, input.prefix, api.prefix, api.path, auth.apiPrefix),
    googleClientId: coalesceString(input.googleClientId, google.clientId, google.clientID, auth.googleClientId)
  };
}

function coalesceString(...candidates) {
  for (const candidate of candidates) {
    const value = toOptionalString(candidate);
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}

function toOptionalString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function sanitizePrefix(value) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withoutTrailing = trimmed.replace(/\/+$/, '');
  const withoutLeading = withoutTrailing.replace(/^\/+/, '');
  return withoutLeading ? `/${withoutLeading}` : '';
}

function sanitizeBaseUrl(value) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePort(value) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function printHelp() {
  console.log(`Usage: node runtime-server.mjs [--config <path>] [--help]\n\nOptions:\n  --config  Path to a YAML, JSON, or INI file containing runtime settings.\n  --help    Show this help text.\n\nEnvironment overrides:\n  CONFIG_FILE, GOGEAR_CONSOLE_CONFIG, GOGEAR_CONFIG\n  GOGEAR_API_BASE_URL, GOGEAR_API_URL, API_BASE_URL\n  GOGEAR_API_PREFIX, API_PREFIX\n  GOOGLE_CLIENT_ID, GOOGLE_OAUTH_CLIENT_ID\n`);
}

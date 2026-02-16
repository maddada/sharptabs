#!/usr/bin/env node

/**
 * Chrome Web Store Status Checker (v2 API)
 *
 * Shows the current submission state of your extension.
 *
 * Usage:
 *   npx dotenv-cli -e .env.publish -- node scripts/cws-status.mjs
 *   npx dotenv-cli -e .env.publish -- node scripts/cws-status.mjs --json
 *   npx dotenv-cli -e .env.publish -- node scripts/cws-status.mjs --manifest apps/extension/public/manifest.template.json
 */

import fs from 'fs';

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const manifestIdx = args.indexOf('--manifest');
const manifestPath = manifestIdx !== -1 ? args[manifestIdx + 1] : null;

const requiredVars = [
  'CHROME_EXTENSION_ID',
  'CHROME_PUBLISHER_ID',
  'CHROME_CLIENT_ID',
  'CHROME_CLIENT_SECRET',
  'CHROME_REFRESH_TOKEN',
];

const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  console.error('Run with: npx dotenv-cli -e .env.publish -- node scripts/cws-status.mjs');
  process.exit(1);
}

const PUBLISHER_ID = process.env.CHROME_PUBLISHER_ID;
const EXTENSION_ID = process.env.CHROME_EXTENSION_ID;

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.CHROME_CLIENT_ID,
      client_secret: process.env.CHROME_CLIENT_SECRET,
      refresh_token: process.env.CHROME_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`Token error: ${data.error_description || data.error}`);
  }
  return data.access_token;
}

async function fetchItemStatus(accessToken) {
  const url = `https://chromewebstore.googleapis.com/v2/publishers/${PUBLISHER_ID}/items/${EXTENSION_ID}:fetchStatus`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error (${res.status}): ${text}`);
  }
  return res.json();
}

function readLocalVersion(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content).version;
  } catch {
    return null;
  }
}

function extractPublishedVersion(item) {
  // v2 API: published version is in publishedItemRevisionStatus
  const channels = item.publishedItemRevisionStatus?.distributionChannels;
  if (channels && channels.length > 0) {
    return channels[0].crxVersion || null;
  }
  // Fallback: try crxVersion at top level
  return item.crxVersion || null;
}

function extractSubmittedVersion(item) {
  // v2 API: submitted (pending) version
  return item.submittedItemRevisionStatus?.crxVersion || null;
}

async function main() {
  const accessToken = await getAccessToken();
  const item = await fetchItemStatus(accessToken);

  const publishedVersion = extractPublishedVersion(item) || 'unknown';
  const publishedState = item.publishedItemRevisionStatus?.state || item.status || 'unknown';
  const submittedVersion = extractSubmittedVersion(item);
  const submittedState = item.submittedItemRevisionStatus?.state || null;
  const itemId = EXTENSION_ID;

  // Read local version
  let localVersion = null;
  if (manifestPath) {
    localVersion = readLocalVersion(manifestPath);
  } else {
    const defaultPath = 'apps/extension/public/manifest.template.json';
    if (fs.existsSync(defaultPath)) {
      localVersion = readLocalVersion(defaultPath);
    }
  }

  const upToDate = localVersion ? localVersion === publishedVersion : null;
  const pendingReview = submittedState === 'PENDING_REVIEW' || publishedState === 'PENDING_REVIEW';

  const result = {
    itemId,
    localVersion,
    publishedVersion,
    publishedState,
    submittedVersion,
    submittedState,
    upToDate,
    pendingReview,
  };

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('');
    console.log('Chrome Web Store Status');
    console.log('=======================');
    console.log(`Extension ID:      ${itemId}`);
    if (localVersion) {
      console.log(`Local version:     ${localVersion}`);
    }
    console.log(`Published version: ${publishedVersion}`);
    console.log(`Published state:   ${publishedState}`);
    if (submittedVersion) {
      console.log(`Submitted version: ${submittedVersion}`);
      console.log(`Submitted state:   ${submittedState}`);
    }
    if (localVersion) {
      console.log(`Up to date:        ${upToDate ? 'Yes' : 'No'}`);
    }
    if (pendingReview) {
      console.log('');
      console.log('Note: A submission is currently pending review.');
    }
    if (localVersion && !upToDate && !pendingReview) {
      console.log('');
      console.log(`Version mismatch: local ${localVersion} vs published ${publishedVersion}`);
      console.log('Push to main to trigger a publish workflow.');
    }
    console.log('');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

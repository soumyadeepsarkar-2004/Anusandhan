import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  POST_REGISTRY,
  formatScrapedOpportunity,
  publishToLinkedIn,
  publishToX,
  publishToInstagram,
  scrapeAndPostAll
} from '../../scripts/social_autoposter.js';
import { TRACKED_FACULTY_SEEDS } from '../../server/services/dataIngestionService.js';

test('1. Post Registry contains valid launch content for Day 1', () => {
  const day1 = POST_REGISTRY.day1;
  assert.ok(day1, 'day1 entry must exist');
  assert.ok(day1.linkedin && day1.linkedin.text, 'LinkedIn text must exist');
  assert.ok(day1.x && Array.isArray(day1.x.thread), 'X thread array must exist');
  assert.ok(day1.instagram && day1.instagram.caption, 'Instagram caption must exist');
});

test('2. LinkedIn payload complies with LinkedIn UGC Post v2 specifications', async () => {
  const result = await publishToLinkedIn(POST_REGISTRY.day1.linkedin, true);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.mode, 'DRY_RUN');
  assert.strictEqual(result.platform, 'LinkedIn');
  assert.strictEqual(result.orgId, '145427516');
  assert.ok(result.length > 100 && result.length < 3000, 'LinkedIn post must be within valid length limits');
});

test('3. Twitter / X thread enforces strict 280-character limit on every tweet', async () => {
  const thread = POST_REGISTRY.day1.x.thread;
  assert.ok(thread.length >= 3, 'Thread must contain multiple tweets');

  for (let i = 0; i < thread.length; i++) {
    const tweet = thread[i];
    assert.ok(tweet.length <= 280, `Tweet ${i + 1} exceeds 280 characters (${tweet.length})`);
    assert.ok(tweet.startsWith(`${i + 1}/`), `Tweet ${i + 1} must have correct numerical index`);
  }

  const result = await publishToX(POST_REGISTRY.day1.x, true);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.mode, 'DRY_RUN');
  assert.strictEqual(result.tweetCount, thread.length);
});

test('4. Instagram caption complies with Meta Graph API limits and tags', async () => {
  const igContent = POST_REGISTRY.day1.instagram;
  assert.ok(igContent.caption.length <= 2200, 'Instagram caption must be under 2200 characters');
  assert.ok(igContent.caption.includes('#anusandhan'), 'Must include core brand hashtag');
  assert.ok(igContent.caption.includes('anusandhan.vercel.app'), 'Must reference official web domain');

  const result = await publishToInstagram(igContent, true);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.mode, 'DRY_RUN');
  assert.strictEqual(result.captionLength, igContent.caption.length);
});

test('5. Branding graphics and SVG assets are well-formed and meet exact resolution standards', () => {
  const assets = [
    { file: 'social/assets/anusandhan_official_avatar.svg', width: '1080', height: '1080' },
    { file: 'social/assets/launch_post_graphic.svg', width: '1080', height: '1080' },
    { file: 'social/assets/linkedin_banner_official.svg', width: '1584', height: '396' },
    { file: 'social/assets/twitter_header_official.svg', width: '1500', height: '500' }
  ];

  for (const asset of assets) {
    const filePath = path.resolve(asset.file);
    assert.ok(fs.existsSync(filePath), `Asset ${asset.file} must exist on disk`);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('<svg'), `Asset ${asset.file} must have opening <svg> tag`);
    assert.ok(content.includes('</svg>'), `Asset ${asset.file} must have closing </svg> tag`);
    assert.ok(content.includes(`viewBox="0 0 ${asset.width} ${asset.height}"`), `Asset ${asset.file} viewBox must match ${asset.width}x${asset.height}`);
  }
});

test('6. Dynamic scraping and multi-channel post generation formats all faculty opportunities', async () => {
  assert.ok(TRACKED_FACULTY_SEEDS.length > 0, 'Must have tracked faculty seeds');
  const results = await scrapeAndPostAll(true);
  assert.strictEqual(results.length, TRACKED_FACULTY_SEEDS.length);

  for (const item of results) {
    assert.strictEqual(item.linkedin.success, true);
    assert.strictEqual(item.x.success, true);
    assert.strictEqual(item.instagram.success, true);
  }
});

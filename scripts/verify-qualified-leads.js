'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { settings, assessLead, directTelegramUrl } = require('./lead-search-policy');

const QUALIFIED_JSON = path.resolve(__dirname, '../data/parsed_2gis/qualified_two_gis_leads.json');

function verifyQualifiedLeads() {
  if (!fs.existsSync(QUALIFIED_JSON)) {
    throw new Error(`Файл не найден: ${QUALIFIED_JSON}`);
  }

  const leads = JSON.parse(fs.readFileSync(QUALIFIED_JSON, 'utf8'));
  console.log(`=== ВЕРИФИКАЦИЯ КВАЛИФИЦИРОВАННЫХ ЛИДОВ ЧЕРЕЗ LEAD-SEARCH-POLICY ===`);
  console.log(`Записей для проверки: ${leads.length}`);

  let passed = 0;
  let withSite = 0;
  let noSite = 0;
  const slugs = new Set();

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const slug = lead.slug;

    assert(slug, `Запись #${i} не имеет slug`);
    assert(!slugs.has(slug), `Дубликат slug: ${slug}`);
    slugs.add(slug);

    const assessment = assessLead(lead);

    if (!assessment.eligible) {
      console.error(`ОШИБКА в лиде ${slug}:`);
      console.error(assessment.reasons.join('\n'));
      throw new Error(`Лид ${slug} не прошел валидацию: ${assessment.reasons.join('; ')}`);
    }

    assert(assessment.telegram_url, `Лид ${slug} прошел, но telegram_url пуст`);
    assert(directTelegramUrl(assessment.telegram_url), `Лид ${slug}: невалидный directTelegramUrl`);
    assert(['found', 'not_found_in_checked_sources'].includes(assessment.website_status), `Лид ${slug}: некорректный website_status ${assessment.website_status}`);

    if (assessment.website_status === 'found') {
      assert(assessment.website, `Лид ${slug}: website_status === found, но website пуст`);
      withSite++;
    } else {
      assert(assessment.website === null, `Лид ${slug}: website_status === not_found_in_checked_sources, но website не null`);
      noSite++;
    }

    passed++;
  }

  console.log(`\nРЕЗУЛЬТАТ: Все ${passed} лидов успешно прошли 100% строгую валидацию.`);
  console.log(`  С подтвержденным сайтом: ${withSite}`);
  console.log(`  Без подтвержденного сайта: ${noSite}`);
  console.log(`Качество данных полностью соответствует контракту LEAD_SEARCH_RULES.md.`);
  return { passed, withSite, noSite };
}

if (require.main === module) {
  try {
    verifyQualifiedLeads();
  } catch (err) {
    console.error('Сбой верификации:', err.message);
    process.exitCode = 1;
  }
}

module.exports = { verifyQualifiedLeads };

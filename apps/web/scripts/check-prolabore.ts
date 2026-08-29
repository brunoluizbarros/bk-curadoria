import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL não definida'); process.exit(1); }

  const sql = postgres(url, { ssl: 'require' });

  const rows = await sql`
    SELECT
      e.id,
      e.description,
      e.amount_cents,
      e.paid_at::date AS paid_date,
      e.installment_group_id,
      e.installment_number,
      e.total_installments,
      ec.name AS category_name
    FROM expenses e
    JOIN expense_categories ec ON ec.id = e.category_id
    WHERE LOWER(e.description) LIKE '%labore%'
       OR LOWER(e.description) LIKE '%pró%'
       OR LOWER(ec.name) LIKE '%labore%'
    ORDER BY e.paid_at DESC
  `;

  if (rows.length === 0) {
    console.log('Nenhum registro com "labore/pró". Listando todas as despesas (top 60):\n');
    const all = await sql`
      SELECT
        e.id,
        e.description,
        e.amount_cents,
        e.paid_at::date AS paid_date,
        e.installment_group_id,
        ec.name AS category_name
      FROM expenses e
      JOIN expense_categories ec ON ec.id = e.category_id
      ORDER BY e.paid_at DESC
      LIMIT 60
    `;
    console.table(all);
  } else {
    console.log(`\n${rows.length} registros encontrados:\n`);
    console.table(rows);

    const byMonth: Record<string, { total_reais: number; count: number }> = {};
    for (const r of rows) {
      const month = String(r.paid_date).slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { total_reais: 0, count: 0 };
      byMonth[month].total_reais += Number(r.amount_cents) / 100;
      byMonth[month].count += 1;
    }
    console.log('\nResumo por mês:');
    console.table(byMonth);
  }

  await sql.end();
}

main().catch(console.error);

import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const DEFAULT_CONFIG = {
  founder_draws: { hardik: 100000, binoy: 100000, soozy: 200000 },
  fixed_costs: [
    { label: 'CA fees', amount: 5000 },
    { label: 'Figma', amount: 4719 },
    { label: 'Framer', amount: 1500 },
    { label: 'GoDaddy', amount: 371 },
    { label: 'Miscellaneous', amount: 12000 },
  ],
  freelancer_retainers: [],
  target_margin_percent: 50,
  working_days_per_month: 22,
  working_hours_per_day: 8,
  billable_founders: 3,
  rate_tiers: {
    bootstrapped: 12000,
    funded: 18000,
    established: 25000,
    enterprise: 35000,
    international: 45000,
  },
  rush_premium_percent: 25,
  standard_revision_rounds: 2,
  passthrough_markup_percent: 15,
  contingency_default_percent: 10,
  margin_red_threshold: 40,
  margin_green_threshold: 50,
}

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS studio_config (
      id INT PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT single_row CHECK (id = 1)
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pricing_projects (
      id SERIAL PRIMARY KEY,
      client_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'inquiry',
      client_profile JSONB,
      scope JSONB,
      pricing JSONB,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `)

  const { rows } = await pool.query('SELECT id FROM studio_config WHERE id = 1')
  if (rows.length === 0) {
    await pool.query('INSERT INTO studio_config (id, data) VALUES (1, $1)', [
      JSON.stringify(DEFAULT_CONFIG),
    ])
    console.log('Seeded default studio_config')
  } else {
    console.log('studio_config already exists, skipping seed')
  }

  console.log('Migration complete')
  await pool.end()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

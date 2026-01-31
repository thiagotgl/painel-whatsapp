import sql from "mssql";

let pool: sql.ConnectionPool | null = null;

export async function getDb() {
  if (pool) {
    return pool;
  }

  const config: sql.config = {
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    server: process.env.DB_SERVER!,
    database: process.env.DB_NAME!,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  pool = await sql.connect(config);
  return pool;
}

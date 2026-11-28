import 'dotenv/config';
import { Pool } from 'pg';

// read a required env variable and fail early if it is missing
function getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

// initialize the payment database schema, tables, and indexes
async function initDB(): Promise<void> {
    // create PostgreSQL connection pool using values from .env
    const pool = new Pool({
        host: getRequiredEnv('DB_HOST'),
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: getRequiredEnv('DB_NAME'),
        user: getRequiredEnv('DB_USER'),
        password: getRequiredEnv('DB_PASSWORD'),
    });

    // open a single client connection from the pool
    const client = await pool.connect();

    try {
        console.log('Connected to PostgreSQL successfully');

        // create the payment schema if it does not already exist
        await client.query(`
            CREATE SCHEMA IF NOT EXISTS payment;
        `);
        console.log('Schema "payment" is ready');

        // create the main transactions table to track every payment lifecycle
        await client.query(`
            CREATE TABLE IF NOT EXISTS payment.tbl_transactions (
                id UUID PRIMARY KEY,
                source_app VARCHAR(100) NOT NULL,
                purchase_order_id VARCHAR(150) NOT NULL,
                purchase_order_name VARCHAR(255),
                idempotency_key VARCHAR(255) UNIQUE NOT NULL,
                provider VARCHAR(50) NOT NULL,
                provider_ref VARCHAR(255),
                amount NUMERIC(12, 2) NOT NULL,
                currency VARCHAR(10) NOT NULL DEFAULT 'NPR',
                status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
                payment_url TEXT,
                customer_name VARCHAR(150),
                customer_email VARCHAR(255),
                raw_response JSONB,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('Table "payment.tbl_transactions" is ready');

        // index for fast lookup by gateway reference (e.g., Khalti pidx)
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_transactions_provider_ref
            ON payment.tbl_transactions (provider_ref);
        `);

        // index for finding transactions by calling app and order ID
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_transactions_source_order
            ON payment.tbl_transactions (source_app, purchase_order_id);
        `);

        // index for filtering transactions by status (PENDING, COMPLETED, FAILED, etc.)
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_transactions_status
            ON payment.tbl_transactions (status);
        `);
        console.log('Indexes on "payment.tbl_transactions" are ready');
    } finally {
        // always release the client back to the pool
        client.release();
        // close the pool so the script exits cleanly
        await pool.end();
    }
}

// run the database initialization script
initDB()
    .then(() => {
        console.log('Database initialized successfully');
    })
    .catch((error: unknown) => {
        console.error('Error initializing database:', error);
        process.exitCode = 1;
    });

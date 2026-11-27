
async function initDB() {
    const { Pool } = await import('pg');

    // Initialize PostgreSQL connection pool
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        // test database connection
        const client = await pool.connect();

        try {
            console.log('Database connection test successful');

            // create payment schema
            const createSchemaQuery = `
                CREATE SCHEMA IF NOT EXISTS payment;
            `;

            await client.query(createSchemaQuery);

            console.log('Database schema initialized successfully');

            // create payment tables
            const createTablesQuery = `
                CREATE TABLE IF NOT EXISTS payment.tbl_payments (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            await client.query(createTablesQuery);

            console.log('Database tables initialized successfully');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    } finally {
        // cllose database connection pool
        await pool.end();
    }
}

// Execute database initialization
initDB()
    .then(() => {
        console.log('Database initialized successfully');
    })
    .catch((error) => {
        console.error('Error initializing database:', error);
        process.exitCode = 1;
    });
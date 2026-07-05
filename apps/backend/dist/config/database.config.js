"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = getDatabaseConfig;
const path_1 = require("path");
function getDatabaseConfig() {
    const dbType = process.env.DATABASE_TYPE || 'postgres';
    const entities = [(0, path_1.join)(__dirname, '..', '**', '*.entity{.ts,.js}')];
    const synchronize = process.env.NODE_ENV !== 'production';
    const logging = process.env.NODE_ENV === 'development';
    if (dbType === 'sqlite') {
        const databasePath = process.env.DATABASE_PATH || (0, path_1.join)(process.cwd(), 'data', 'ziii_living_dev.sqlite');
        return {
            type: 'better-sqlite3',
            database: databasePath,
            entities,
            synchronize,
            logging,
        };
    }
    return {
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER || 'ziii_user',
        password: process.env.DATABASE_PASSWORD || 'ziii_password_dev',
        database: process.env.DATABASE_NAME || 'ziii_living_dev',
        entities,
        migrations: [(0, path_1.join)(__dirname, '..', 'migrations', '**', '*{.ts,.js}')],
        synchronize,
        logging,
    };
}
//# sourceMappingURL=database.config.js.map
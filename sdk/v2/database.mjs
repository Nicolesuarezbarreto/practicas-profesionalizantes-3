import sqlite3 from 'sqlite3';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync('./config.json', 'utf-8'));
const db = new sqlite3.Database(resolve(config.database.path));

export { db };
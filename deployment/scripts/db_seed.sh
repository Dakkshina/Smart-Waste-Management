#!/bin/bash
# Seed the database with demo data
set -e
echo "🌱 Seeding SmartWaste database..."
cd "$(dirname "$0")/../.."

PGPASSWORD=${DB_PASSWORD:-securepass} psql \
  -h localhost -U postgres -d smart_waste_db \
  -f docs/DATABASE_SCHEMA.sql

echo "✅ Schema applied."

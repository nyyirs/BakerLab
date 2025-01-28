#!/bin/sh

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z db 3306; do
  sleep 1
done

# Additional wait for database initialization
sleep 5

echo "Database is ready!"

# Test database connection
if mysql -h db -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
    echo "Database connection successful"
else
    echo "Failed to connect to database. Check credentials"
    exit 1
fi

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting the application..."
npm start

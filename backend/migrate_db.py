import sqlite3
import psycopg2

sql_conn = sqlite3.connect('dicunglac.db')
sql_cur = sql_conn.cursor()

pg_conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/dicunglac')
pg_cur = pg_conn.cursor()

tables = [
    'users',
    'provinces',
    'locations',
    'menu_items',
    'itineraries',
    'itinerary_items',
    'expenses',
    'payment_transactions',
    'reviews',
    'wishlists',
    'trip_members',
    'notifications'
]

# Fetch boolean columns in postgres to convert int 0/1 to bool
pg_cur.execute("""
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE data_type = 'boolean'
""")
bool_cols = set((r[0], r[1]) for r in pg_cur.fetchall())

for table in tables:
    try:
        sql_cur.execute(f"PRAGMA table_info({table})")
        cols_info = sql_cur.fetchall()
        if not cols_info:
            continue
        cols = [c[1] for c in cols_info]
        col_names = ', '.join([f'"{c}"' for c in cols])
        placeholders = ', '.join(['%s'] * len(cols))
        
        sql_cur.execute(f"SELECT {col_names} FROM {table}")
        rows = sql_cur.fetchall()
        if not rows:
            continue
            
        clean_rows = []
        for row in rows:
            new_row = []
            for col_name, val in zip(cols, row):
                if (table, col_name) in bool_cols:
                    new_row.append(bool(val) if val is not None else None)
                else:
                    new_row.append(val)
            clean_rows.append(tuple(new_row))
            
        insert_query = f'INSERT INTO "{table}" ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'
        pg_cur.executemany(insert_query, clean_rows)
        pg_conn.commit()
        print(f"Successfully migrated {len(clean_rows)} rows for table {table}")
    except Exception as e:
        pg_conn.rollback()
        print(f"Error migrating table {table}: {e}")

# Reset sequences in postgres so new inserts work cleanly
for table in tables:
    try:
        pg_cur.execute(f"""
            SELECT setval(pg_get_serial_sequence('"{table}"', 'id'), COALESCE(max(id), 1))
            FROM "{table}";
        """)
        pg_conn.commit()
    except Exception:
        pg_conn.rollback()

sql_conn.close()
pg_conn.close()
print("All SQLite data migrated to PostgreSQL successfully!")

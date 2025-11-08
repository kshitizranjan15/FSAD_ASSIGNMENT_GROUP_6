# Database Documentation

## Overview
The School Lending Equipment Management System uses MySQL hosted on db4free.net for data storage. This document outlines the database schema, relationships, and management procedures.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('admin', 'staff', 'student') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Equipment Categories Table
```sql
CREATE TABLE equipment_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Equipment Table
```sql
CREATE TABLE equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INT,
    status ENUM('available', 'borrowed', 'maintenance') DEFAULT 'available',
    condition_status VARCHAR(50),
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id)
);
```

### Lending Records Table
```sql
CREATE TABLE lending_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT,
    user_id INT,
    borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    return_date TIMESTAMP NULL,
    status ENUM('pending', 'approved', 'rejected', 'returned') DEFAULT 'pending',
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Database Relationships

### One-to-Many Relationships
1. Category → Equipment
   - One category can have multiple equipment items
   - Each equipment item belongs to one category

2. User → Lending Records
   - One user can have multiple lending records
   - Each lending record belongs to one user

3. Equipment → Lending Records
   - One equipment item can have multiple lending records
   - Each lending record belongs to one equipment item

## Indexes

### Primary Indexes
- `users.id`
- `equipment_categories.id`
- `equipment.id`
- `lending_records.id`

### Secondary Indexes
- `users.username`
- `users.email`
- `equipment_categories.name`
- `equipment.category_id`
- `lending_records.equipment_id`
- `lending_records.user_id`

## Database Connection

### Connection Parameters
```python
DB_CONFIG = {
    'host': 'db4free.net',
    'port': 3306,
    'user': 'your_username',
    'password': 'your_password',
    'database': 'school_lending_p'
}
```

### Connection Pool Configuration
- Maximum connections: 10
- Connection timeout: 30 seconds
- Pool recycle: 3600 seconds

## Data Access Patterns

### Common Queries
1. **Equipment Availability Check**
   ```sql
   SELECT * FROM equipment 
   WHERE status = 'available' 
   AND category_id = ?;
   ```

2. **User Lending History**
   ```sql
   SELECT e.name, lr.* 
   FROM lending_records lr
   JOIN equipment e ON lr.equipment_id = e.id
   WHERE lr.user_id = ?;
   ```

3. **Category Equipment Count**
   ```sql
   SELECT c.name, COUNT(e.id) as count
   FROM equipment_categories c
   LEFT JOIN equipment e ON c.id = e.category_id
   GROUP BY c.id;
   ```

## Backup and Recovery

### Backup Procedure
1. **Daily Backups**
   ```bash
   mysqldump -h db4free.net -u your_username -p school_lending_p > backup_$(date +%Y%m%d).sql
   ```

2. **Backup Verification**
   ```bash
   mysql -h db4free.net -u your_username -p school_lending_p < backup_file.sql
   ```

### Recovery Procedures
1. **Full Database Restore**
   ```bash
   mysql -h db4free.net -u your_username -p school_lending_p < backup.sql
   ```

2. **Table-Level Recovery**
   ```sql
   BEGIN TRANSACTION;
   DELETE FROM target_table;
   INSERT INTO target_table SELECT * FROM backup_table;
   COMMIT;
   ```

## Performance Optimization

### Implemented Optimizations
1. **Proper Indexing**
   - Primary keys on all tables
   - Foreign key indexes
   - Frequently searched columns

2. **Query Optimization**
   - Prepared statements
   - Connection pooling
   - Result set limiting

### Monitoring Queries
```sql
-- Slow Query Analysis
SELECT * FROM information_schema.processlist
WHERE command != 'Sleep'
AND time >= 5;
```

## Security Measures

### Access Control
- Role-based access
- Prepared statements for all queries
- Input validation and sanitization

### Data Protection
- Encrypted passwords using bcrypt/argon2
- TLS/SSL for database connections
- Regular security audits

## Maintenance Tasks

### Regular Maintenance
1. **Optimize Tables**
   ```sql
   OPTIMIZE TABLE users, equipment, equipment_categories, lending_records;
   ```

2. **Update Statistics**
   ```sql
   ANALYZE TABLE users, equipment, equipment_categories, lending_records;
   ```

### Monitoring
1. **Connection Status**
   ```sql
   SHOW STATUS WHERE variable_name LIKE 'Threads%';
   ```

2. **Table Sizes**
   ```sql
   SELECT table_name, table_rows, data_length, index_length
   FROM information_schema.tables
   WHERE table_schema = 'school_lending_p';
   ```
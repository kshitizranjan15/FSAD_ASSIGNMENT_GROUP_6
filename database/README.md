# Database Documentation

## Overview
The School Lending Equipment Management System uses MySQL hosted on db4free.net for data storage. This document outlines the database schema, relationships, and management procedures.

## Database Schema

### Users Table
```sql
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('Student','Staff','Admin') NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
);
```

### Equipment Category Table
```sql
CREATE TABLE `equipment_category` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `description` text,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `category_name` (`category_name`)
);
```

### Equipment Table
```sql
CREATE TABLE `equipment` (
  `equipment_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `category_id` int NOT NULL,
  `total_quantity` int NOT NULL DEFAULT '0',
  `available_quantity` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`equipment_id`),
  KEY `fk_equipment_category` (`category_id`),
  CONSTRAINT `fk_equipment_category` FOREIGN KEY (`category_id`) 
    REFERENCES `equipment_category` (`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE
);
```

### Bookings Table
```sql
CREATE TABLE `bookings` (
  `booking_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `equipment_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `request_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `approval_status` enum('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
  `approved_by` int DEFAULT NULL,
  `approval_date` datetime DEFAULT NULL,
  `rejection_reason` text,
  PRIMARY KEY (`booking_id`),
  KEY `user_id` (`user_id`),
  KEY `equipment_id` (`equipment_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`equipment_id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
);
```

### Booking Schedule Table
```sql
CREATE TABLE `booking_schedule` (
  `schedule_id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `actual_return_date` datetime DEFAULT NULL,
  PRIMARY KEY (`schedule_id`),
  KEY `booking_id` (`booking_id`),
  CONSTRAINT `booking_schedule_ibfk_1` FOREIGN KEY (`booking_id`) 
    REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_date_range` CHECK ((`start_date` < `end_date`))
);
```

### Booking Return Log Table
```sql
CREATE TABLE `booking_return_log` (
  `return_log_id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `returned_by` int NOT NULL,
  `condition_on_return` enum('Good','Damaged','Lost') DEFAULT 'Good',
  `remarks` text,
  `received_by` int NOT NULL,
  `received_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`return_log_id`),
  KEY `booking_id` (`booking_id`),
  KEY `returned_by` (`returned_by`),
  KEY `received_by` (`received_by`),
  CONSTRAINT `booking_return_log_ibfk_1` FOREIGN KEY (`booking_id`) 
    REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
  CONSTRAINT `booking_return_log_ibfk_2` FOREIGN KEY (`returned_by`) 
    REFERENCES `users` (`user_id`),
  CONSTRAINT `booking_return_log_ibfk_3` FOREIGN KEY (`received_by`) 
    REFERENCES `users` (`user_id`)
);
```

### Booking Status History Table
```sql
CREATE TABLE `booking_status_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `status` enum('Requested','Approved','Rejected','Issued','Returned','Cancelled') NOT NULL,
  `changed_by` int DEFAULT NULL,
  `change_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `remarks` text,
  PRIMARY KEY (`history_id`),
  KEY `booking_id` (`booking_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `booking_status_history_ibfk_1` FOREIGN KEY (`booking_id`) 
    REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
  CONSTRAINT `booking_status_history_ibfk_2` FOREIGN KEY (`changed_by`) 
    REFERENCES `users` (`user_id`) ON DELETE SET NULL
);
```

### Lending Requests Table
```sql
CREATE TABLE `lending_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `equipment_id` int NOT NULL,
  `requester_id` int NOT NULL,
  `request_date` datetime NOT NULL,
  `borrow_date` date DEFAULT NULL,
  `expected_return_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `quantity` int NOT NULL,
  `status` enum('Pending','Approved','Issued','Rejected','Returned') NOT NULL,
  `approver_id` int DEFAULT NULL,
  `rejection_reason` text,
  PRIMARY KEY (`request_id`),
  KEY `fk_lr_equipment` (`equipment_id`),
  KEY `fk_lr_requester` (`requester_id`),
  KEY `fk_lr_approver` (`approver_id`),
  CONSTRAINT `fk_lr_approver` FOREIGN KEY (`approver_id`) 
    REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lr_equipment` FOREIGN KEY (`equipment_id`) 
    REFERENCES `equipment` (`equipment_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_lr_requester` FOREIGN KEY (`requester_id`) 
    REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
);
```

### Repair Log Table
```sql
CREATE TABLE `repair_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `equipment_id` int NOT NULL,
  `damage_description` text NOT NULL,
  `reported_by_user_id` int DEFAULT NULL,
  `report_date` date NOT NULL,
  `repair_cost` decimal(10,2) DEFAULT NULL,
  `repair_date` date DEFAULT NULL,
  `repaired_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `fk_rl_equipment` (`equipment_id`),
  KEY `fk_rl_reported_by` (`reported_by_user_id`),
  CONSTRAINT `fk_rl_equipment` FOREIGN KEY (`equipment_id`) 
    REFERENCES `equipment` (`equipment_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_rl_reported_by` FOREIGN KEY (`reported_by_user_id`) 
    REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
);
```

## Database Relationships

### Key Relationships
1. **Users → Bookings & Lending Requests**
   - One user can make multiple bookings and requests
   - Each booking/request is associated with one user
   - Users can have different roles (Student, Staff, Admin)

2. **Equipment Category → Equipment**
   - One category can have multiple equipment items
   - Each equipment item must belong to one category
   - Category deletion is restricted if equipment exists

3. **Equipment → Bookings/Lending**
   - One equipment item can have multiple bookings/requests
   - Tracks both total and available quantity
   - Equipment deletion is restricted when active bookings exist

4. **Bookings → Related Tables**
   - Each booking has:
     - One schedule (booking_schedule)
     - One return log (booking_return_log)
     - Multiple status history entries (booking_status_history)
   - All related records are deleted when a booking is deleted (CASCADE)

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
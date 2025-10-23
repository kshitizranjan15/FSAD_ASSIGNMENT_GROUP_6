-- 1. CREATE DATABASE
CREATE DATABASE IF NOT EXISTS school_lending_portal;
USE school_lending_portal;

-- 2. CREATE TABLES

-- Table 1: USERS (Handles User Authentication and Roles)
CREATE TABLE USERS (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('Student', 'Staff', 'Admin') NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone_number VARCHAR(15)
);

-- Table 2: EQUIPMENT_CATEGORY
CREATE TABLE EQUIPMENT_CATEGORY (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Table 3: EQUIPMENT (Stores the types/models of equipment)
CREATE TABLE EQUIPMENT (
    equipment_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    total_quantity INT NOT NULL DEFAULT 0,
    available_quantity INT NOT NULL DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES EQUIPMENT_CATEGORY(category_id)
);

-- Table 4: LENDING_REQUESTS (Core table for borrowing/tracking)
CREATE TABLE LENDING_REQUESTS (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    requester_id INT NOT NULL,
    request_date DATETIME NOT NULL,
    borrow_date DATE,
    expected_return_date DATE NOT NULL,
    return_date DATE,
    quantity INT NOT NULL,
    status ENUM('Pending', 'Approved', 'Issued', 'Rejected', 'Returned') NOT NULL,
    approver_id INT,
    rejection_reason TEXT,
    FOREIGN KEY (equipment_id) REFERENCES EQUIPMENT(equipment_id),
    FOREIGN KEY (requester_id) REFERENCES USERS(user_id),
    FOREIGN KEY (approver_id) REFERENCES USERS(user_id)
);

-- Table 5: REPAIR_LOG (Handles Damage/Repair Maintenance)
CREATE TABLE REPAIR_LOG (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    damage_description TEXT NOT NULL,
    reported_by_user_id INT,
    report_date DATE NOT NULL,
    repair_cost DECIMAL(10, 2),
    repair_date DATE,
    repaired_by VARCHAR(100),
    FOREIGN KEY (equipment_id) REFERENCES EQUIPMENT(equipment_id),
    FOREIGN KEY (reported_by_user_id) REFERENCES USERS(user_id)
);

-- Insert Sample Users
INSERT INTO USERS (username, password_hash, full_name, role, email) VALUES
('admin01', 'hash_admin123', 'John Doe', 'Admin', 'john.doe@school.edu'), -- user_id 1
('student101', 'hash_student101', 'Alice Smith', 'Student', 'alice.smith@school.edu'), -- user_id 2
('staff05', 'hash_staff05', 'Jane Brown', 'Staff', 'jane.brown@school.edu'); -- user_id 3

-- Insert Equipment Categories
INSERT INTO EQUIPMENT_CATEGORY (category_name) VALUES
('Cameras'), -- category_id 1
('Sports Kits'), -- category_id 2
('Musical Instruments'); -- category_id 3

-- Insert Equipment Items
INSERT INTO EQUIPMENT (name, category_id, total_quantity, available_quantity) VALUES
('Digital Camera Nikon D3500', 1, 10, 8), -- equipment_id 1
('Soccer Ball Kit (Size 5)', 2, 20, 20), -- equipment_id 2
('Acoustic Guitar Yamaha F310', 3, 5, 4); -- equipment_id 3

-- Insert Lending Requests (Past and Current)

-- 1. Issued and Overdue loan (Expected: 2025-10-10, Assume CURDATE() is 2025-10-23)
INSERT INTO LENDING_REQUESTS (equipment_id, requester_id, request_date, borrow_date, expected_return_date, quantity, status, approver_id) VALUES
(1, 2, '2025-10-01', '2025-10-01', '2025-10-10', 1, 'Issued', 1);

-- 2. Issued and NOT Overdue loan (Expected: 2025-11-05)
INSERT INTO LENDING_REQUESTS (equipment_id, requester_id, request_date, borrow_date, expected_return_date, quantity, status, approver_id) VALUES
(3, 3, '2025-10-15', '2025-10-15', '2025-11-05', 1, 'Issued', 1);

-- 3. Returned loan (for analytics)
INSERT INTO LENDING_REQUESTS (equipment_id, requester_id, request_date, borrow_date, expected_return_date, return_date, quantity, status, approver_id) VALUES
(1, 2, '2025-09-01', '2025-09-01', '2025-09-10', '2025-09-08', 1, 'Returned', 1);

-- 4. Another Returned loan (for analytics)
INSERT INTO LENDING_REQUESTS (equipment_id, requester_id, request_date, borrow_date, expected_return_date, return_date, quantity, status, approver_id) VALUES
(2, 2, '2025-09-20', '2025-09-20', '2025-10-01', '2025-10-05', 2, 'Returned', 1);

-- Insert Sample Repair Log
INSERT INTO REPAIR_LOG (equipment_id, damage_description, reported_by_user_id, report_date, repair_cost) VALUES
(1, 'Tripod leg broken upon return.', 2, '2025-09-15', 50.00);


-- 1) Due Date Tracking and Automatic Overdue Notifications

-- Identify current loans that are past their expected return date and get the contact email for notification.

SELECT
    R.request_id,
    U.email AS Requester_Email,
    U.full_name AS Borrower_Name,
    E.name AS Equipment_Name,
    R.expected_return_date
FROM LENDING_REQUESTS R
JOIN USERS U ON R.requester_id = U.user_id
JOIN EQUIPMENT E ON R.equipment_id = E.equipment_id
WHERE
    -- The item must be currently issued
    R.status = 'Issued' 
    -- The expected return date must be earlier than the current date
    AND R.expected_return_date < CURDATE();
    
-- 2) Request History and Usage Analytics

-- Calculate key metrics on equipment usage over time.

-- Top 3 Most Requested Equipment (by Total Units Borrowed)

SELECT
    E.name AS Equipment_Name,
    SUM(R.quantity) AS Total_Units_Requested
FROM LENDING_REQUESTS R
JOIN EQUIPMENT E ON R.equipment_id = E.equipment_id
GROUP BY E.name
ORDER BY Total_Units_Requested DESC
LIMIT 3;
    
-- Average Loan Duration for Returned Items

SELECT
    E.name AS Equipment_Name,
    -- DATEDIFF calculates the number of days between the two dates
    AVG(DATEDIFF(R.return_date, R.borrow_date)) AS Average_Loan_Duration_Days
FROM LENDING_REQUESTS R
JOIN EQUIPMENT E ON R.equipment_id = E.equipment_id
WHERE
    -- Only calculate duration for items that have been fully returned
    R.status = 'Returned' 
    AND R.borrow_date IS NOT NULL
    AND R.return_date IS NOT NULL
GROUP BY E.name;

-- Request Volume Breakdown by User Role

SELECT
    U.role AS User_Role,
    COUNT(R.request_id) AS Total_Requests_Made
FROM LENDING_REQUESTS R
JOIN USERS U ON R.requester_id = U.user_id
GROUP BY U.role;

-- 3)  Damage/Repair Log for Equipment Maintenance

-- Track reported damage, repair status, and total maintenance costs.

-- Log New Damage and Update Equipment Availability

-- 1. Insert the damage report
INSERT INTO REPAIR_LOG (equipment_id, damage_description, reported_by_user_id, report_date) 
VALUES (3, 'Crack on guitar neck, needs professional repair.', 3, CURDATE());

-- 2. Update the total 'available_quantity' for that equipment type (Acoustic Guitar, equipment_id 3)
UPDATE EQUIPMENT 
SET available_quantity = available_quantity - 1 
WHERE equipment_id = 3;

-- View All Equipment Maintenance History and Costs

SELECT
    R.log_id,
    E.name AS Equipment_Type,
    U.full_name AS Reported_By,
    R.damage_description,
    R.report_date,
    R.repair_cost,
    R.repair_date
FROM REPAIR_LOG R
JOIN EQUIPMENT E ON R.equipment_id = E.equipment_id
LEFT JOIN USERS U ON R.reported_by_user_id = U.user_id
ORDER BY R.report_date DESC;

-- Log Repair Completion (Update Repair Log and Equipment Availability)

-- Assuming the log_id we are closing is 1
-- 1. Update the repair log with cost and completion date
UPDATE REPAIR_LOG
SET
    repair_cost = 450.00,
    repair_date = CURDATE(),
    repaired_by = 'Local Repair Shop'
WHERE log_id = 1;

-- 2. Update the total 'available_quantity' for that equipment type (Digital Camera, equipment_id 1)
UPDATE EQUIPMENT 
SET available_quantity = available_quantity + 1 
WHERE equipment_id = 1;
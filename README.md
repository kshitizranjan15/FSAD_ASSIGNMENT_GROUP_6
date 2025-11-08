# School Lending Equipment Management System

A comprehensive system for managing school equipment lending, built with FastAPI backend and React frontend.

## Project Overview

The School Lending Equipment Management System is designed to streamline the process of managing and tracking equipment loans within an educational institution. It provides a user-friendly interface for staff and students to request, borrow, and return equipment while maintaining accurate records of all transactions.

## Features

- **User Authentication & Authorization**
  - Role-based access control (Admin, Staff, Student)
  - Secure login and registration
  - JWT token-based authentication

- **Equipment Management**
  - Add, update, and delete equipment
  - Categorize equipment
  - Track equipment status (Available, Borrowed, Under Maintenance)
  - Equipment details and specifications

- **Equipment Category Management**
  - Create and manage equipment categories
  - Associate equipment with specific categories
  - Category-based filtering and organization

- **Lending Management**
  - Request equipment
  - Approve/reject lending requests
  - Track borrowed equipment
  - Monitor return dates
  - Handle overdue items

- **Analytics and Reporting**
  - Usage statistics
  - Equipment availability reports
  - Borrowing history
  - User activity tracking

## Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **MySQL**: Database management system
- **SQLAlchemy**: SQL toolkit and ORM
- **Passlib & JWT**: Authentication and security
- **Python 3.13+**: Programming language

### Frontend
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Context**: State management

## Getting Started

### Prerequisites
- Python 3.13 or higher
- Node.js 16 or higher
- MySQL 8.0 or higher

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/kshitizranjan15/FSAD_ASSIGNMENT_GROUP_6.git
   cd FSAD_ASSIGNMENT_equipment_portal
   ```

2. **Backend Setup**
   ```bash
   cd Fsad_Assignment/backend
   pip install -r requirements.txt
   ```

   Create a .env file in the backend directory:
   ```env
   DATABASE_URL=mysql+mysqlconnector://user:password@localhost:3306/school_equipment_db
   SECRET_KEY=your_secret_key_here
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
   The API will be available at http://localhost:8000

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```
   The application will be available at http://localhost:3000

## API Documentation

Once the backend server is running, you can access:
- Interactive API documentation (Swagger UI): http://localhost:8000/docs
- Alternative API documentation (ReDoc): http://localhost:8000/redoc

## Project Structure

```
FSAD_ASSIGNMENT_equipment_portal/
├── Fsad_Assignment/
│   ├── backend/
│   │   ├── api/
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── requirements.txt
│   └── frontend/
│       ├── public/
│       ├── src/
│       ├── package.json
│       └── README.md
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

* FastAPI Documentation
* React Documentation
* MySQL Documentation
* Contributors and team members

## Contact

* Project Link: [https://github.com/kshitizranjan15/FSAD_ASSIGNMENT_GROUP_6](https://github.com/kshitizranjan15/FSAD_ASSIGNMENT_GROUP_6)
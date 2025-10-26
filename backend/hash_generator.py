# hash_generator.py

from auth_utils import get_password_hash # Import the hashing function
import sys

# NOTE: This script assumes you have imported the necessary libraries (like passlib[bcrypt])

def generate_hash(plain_password):
    """Generates and prints the bcrypt hash of a plain text password."""
    try:
        hashed = get_password_hash(plain_password)
        print("\n---------------------------------------------------")
        print(f"Plain Text Password: {plain_password}")
        print(f"Generated Hash: {hashed}")
        print("---------------------------------------------------\n")
        print("Copy the Generated Hash and paste it into your SQL INSERT statement.")
        return hashed
    except Exception as e:
        print(f"Error generating hash. Ensure 'passlib[bcrypt]' is installed: {e}")
        sys.exit(1)

# --- Configuration ---
# Choose a secure, memorable plain text password for your initial Admin
ADMIN_PASSWORD = "AdminPassword123"

if __name__ == "__main__":
    generate_hash(ADMIN_PASSWORD)
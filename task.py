from flask import Flask, jsonify,request
from flask_cors import CORS
import pyodbc

app = Flask(__name__)
CORS(app)

app.config['CONNECTIONSTRING'] = (
    "DRIVER=SQL Server;"
    "SERVER=DESKTOP-TB42104;"
    "DATABASE=studentportal;"
    "Trusted_Connection=yes;"
)

def connection():
    return pyodbc.connect(app.config['CONNECTIONSTRING'])


@app.route('/students', methods=['GET'])
def get_students():
    try:
        # Step 1: Attempt DB connection
        try:
            conn = connection()
        except pyodbc.InterfaceError as e:
            return jsonify({"error": "Database connection failed", "details": str(e)}), 500

        # Step 2: Execute query
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT stdid, fullname, email FROM Students")  # safer to include ID
            rows = cursor.fetchall()
        except Exception as e:
            conn.close()
            return jsonify({"error": "Query failed", "details": str(e)}), 500

        # Step 3: Convert results to list of dicts
        students = []
        for column in rows:
            try:
                students.append({
                    "stdid": column[0],
                    "fullname": column[1],
                    "email": column[2]
                })
            except IndexError as e:
                conn.close()
                return jsonify({"error": "Row format error", "details": str(e)}), 500

        conn.close()

        # Step 4: Return response
        if not students:
            return jsonify({"message": "No students found"}), 200
        return jsonify(students), 200

    except Exception as e:
        return jsonify({"error": "Unexpected server error", "details": str(e)}), 500

@app.route('/students', methods=['POST'])
def add_student():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Missing JSON payload'}), 400

        conn = connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Students ( fullname, email, password) VALUES ( ?, ?, ?)",
            ( data['name'], data['email'], data['password'])
        )
        conn.commit()
        conn.close()
        return jsonify({'message': 'Student added'}), 201
    except Exception as e:
        return jsonify({'error': 'Insert failed', 'details': str(e)}), 500

@app.route('/students/<int:id>', methods = ['DELETE'])
def del_students(id):
    conn = connection()
    cursor = conn.cursor()
    cursor.execute('DELETE from Students where stdid=?',(id,))
    conn.commit()
    conn.close()
    return jsonify({'message':' Deleted'}),200
### auth

@app.route('/login', methods=['POST'])
def login_user():
    """
    Authenticates a user based on provided email and password.
    Returns success message if credentials are valid, otherwise an error.
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Missing JSON payload'}), 400
        if not all(k in data for k in ('email', 'password')):
            return jsonify({'error': 'Missing required fields: email, password'}), 400

        email = data['email']
        password = data['password']

        conn = connection()
        cursor = conn.cursor()
        # IMPORTANT: In a real application, NEVER store plain text passwords.
        # Use a strong hashing algorithm (e.g., bcrypt) for passwords.
        # For this example, we're checking against plain text as per your current setup.
        cursor.execute(
            "SELECT stdid, fullname, email FROM Students WHERE email = ? AND password = ?",
            (email, password)
        )
        user = cursor.fetchone() # Fetch one matching row
        conn.close()

        if user:
            # User found, login successful
            return jsonify({
                "message": "Login successful",
                "user": {
                    "stdid": user[0],
                    "fullname": user[1],
                    "email": user[2]
                }
            }), 200
        else:
            # No user found with those credentials
            return jsonify({"error": "Invalid email or password"}), 401

    except pyodbc.Error as ex:
        return jsonify({'error': 'Database query failed during login', 'details': str(ex)}), 500
    except Exception as e:
        return jsonify({'error': 'Unexpected server error during login', 'details': str(e)}), 500


@app.route('/courses', methods=['GET'])
def get_all_courses(): # Renamed function for clarity
    """
    Retrieves all courses from the Courses table.
    """
    conn = None # Initialize conn to None for finally block
    try:
        conn = connection() # Establish database connection
        cursor = conn.cursor() # Create a cursor object

        # Execute the SELECT query to get all courses
        cursor.execute('SELECT CourseId, coursecode, coursename, description FROM Courses')

        # Fetch all results from the query
        # Fetchall returns a list of tuples, where each tuple is a row
        rows = cursor.fetchall()

        # Get column names from cursor description to create a list of dictionaries
        # This makes the JSON output more readable (e.g., [{"CourseId": 1, "coursecode": "CS101", ...}])
        columns = [column[0] for column in cursor.description]
        courses = []
        for row in rows:
            courses.append(dict(zip(columns, row)))

        return jsonify(courses), 200 # Return the list of courses as JSON with 200 OK status

    except Exception as e:
        print(f"Error fetching courses: {e}")
        return jsonify({"error": "Failed to retrieve courses.", "details": str(e)}), 500
    finally:
        if conn:
            conn.close() # Ensure the database connection is closed


@app.route('/courses', methods=['POST'])
def create_course():
    """
    Adds a new course to the Courses table.
    Expects JSON data in the request body with 'coursecode', 'coursename', and 'description'.
    """
    conn = None  # Initialize conn to None for finally block
    try:
        data = request.get_json() # Get JSON data from the request body

        # Validate incoming data
        course_code = data.get('coursecode')
        course_name = data.get('coursename')
        description = data.get('description')

        if not course_code or not course_name:
            return jsonify({"error": "Course code and course name are required."}), 400

        conn = connection() # Assuming connection() function is defined elsewhere
        cursor = conn.cursor()

        # SQL INSERT statement
        # Using parameterized query to prevent SQL injection
        sql = "INSERT INTO Courses (coursecode, coursename, description) VALUES (?, ?, ?)"
        cursor.execute(sql, (course_code, course_name, description))

        conn.commit() # Commit the transaction to save changes

        return jsonify({"message": "Course added successfully!", "coursecode": course_code}), 201

    except Exception as e:
        if conn:
            conn.rollback() # Rollback in case of error
        print(f"Error adding course: {e}")
        return jsonify({"error": "Failed to add course.", "details": str(e)}), 500
    finally:
        if conn:
            conn.close() # Ensure connection is closed

@app.route('/courses/<int:id>', methods = ['DELETE'])
def del_courses(id):
    conn = connection()
    cursor = conn.cursor()
    cursor.execute( "DELETE from Courses where Courseid = ?",(id,))
    conn.commit()
    conn.close()
    return jsonify({'message':'Deleted'}),200



if __name__ == '__main__':
    app.run(debug=True)

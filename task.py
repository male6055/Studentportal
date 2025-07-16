from flask import Flask, jsonify, request
# from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity
from flask_cors import CORS
import pyodbc

app = Flask(__name__)
CORS(app)

# JWT Config (disabled)
# app.config["JWT_SECRET_KEY"] = "test"
# jwt = JWTManager(app)

# Debugging request headers (optional, keep if needed)
@app.before_request
def log_request_headers():
    if request.path == '/student/dashboard' and request.method == 'GET':
        print(f"\n--- Incoming Request to {request.path} ---")
        for header, value in request.headers.items():
            if header == 'Authorization':
                print(f"Header: {header}: {value[:30]}...")  # Print partial token
            else:
                print(f"Header: {header}: {value}")
        print("-------------------------------------------\n")

# JWT error handlers (disabled)
# @jwt.unauthorized_loader
# def unauthorized_response(callback):
#     print("DEBUG: JWT unauthorized_loader triggered", flush=True)
#     return jsonify({"msg": "Missing Authorization Header or Token"}), 401

# @jwt.invalid_token_loader
# def invalid_token_response(callback):
#     print("DEBUG: JWT invalid_token_loader triggered", flush=True)
#     return jsonify({"msg": "Signature verification failed"}), 403

# @jwt.expired_token_loader
# def expired_token_response(callback):
#     print("DEBUG: JWT expired_token_loader triggered", flush=True)
#     return jsonify({"msg": "Token has expired"}), 401

# @jwt.revoked_token_loader
# def revoked_token_response(callback):
#     print("DEBUG: JWT revoked_token_loader triggered", flush=True)
#     return jsonify({"msg": "Token has been revoked"}), 401

app.config['CONNECTIONSTRING'] = (
    "DRIVER={SQL Server};"
    "SERVER=DESKTOP-TB42104;"
    "DATABASE=studentportal;"
    "Trusted_Connection=yes;"
)

def connectionstring():
    return pyodbc.connect(app.config['CONNECTIONSTRING'])


@app.route('/students', methods=['GET'])
def get_students():
    try:
        conn = connectionstring()
        cursor = conn.cursor()
        cursor.execute("SELECT stdid, fullname, email FROM Students")
        rows = cursor.fetchall()
        students = [
            {"stdid": r[0], "fullname": r[1], "email": r[2]} for r in rows
        ]
        conn.close()
        return jsonify(students if students else {"message": "No students found"}), 200
    except Exception as e:
        return jsonify({"error": "Unexpected server error", "details": str(e)}), 500


@app.route('/students', methods=['POST'])
def add_student():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing JSON payload'}), 400
        conn = connectionstring()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Students (fullname, email, password) VALUES (?, ?, ?)",
            (data['name'], data['email'], data['password'])
        )
        conn.commit()
        conn.close()
        return jsonify({'message': 'Student added'}), 201
    except Exception as e:
        return jsonify({'error': 'Insert failed', 'details': str(e)}), 500


@app.route('/students/<int:id>', methods=['DELETE'])
def del_students(id):
    conn = connectionstring()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM Students WHERE stdid=?', (id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Deleted'}), 200


@app.route('/login', methods=['POST'])
def login_user():
    """
    Authenticates a user based on email and password.
    JWT removed for testing/dev mode.
    """
    try:
        data = request.get_json()
        if not data or not all(k in data for k in ('email', 'password')):
            return jsonify({'error': 'Missing email or password'}), 400

        email = data['email']
        password = data['password']
        conn = None

        try:
            conn = connectionstring()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT stdid, fullname, email FROM Students WHERE email = ? AND password = ?",
                (email, password)
            )
            user = cursor.fetchone()


            if user:
                # access_token = create_access_token(identity=user[0])  # JWT disabled
                return jsonify({
                    "message": "Login successful",
                    # "access_token": access_token,  # Commented JWT
                    "user": {
                        "stdid": user[0],
                        "fullname": user[1],
                        "email": user[2]
                    }
                }), 200

            else:
                return jsonify({"error": "Invalid email or password"}), 401
        finally:
            if conn:
                conn.close()
    except Exception as e:
            return jsonify({'error': 'Server error during login', 'details': str(e)}), 500


@app.route('/courses', methods=['GET'])
def get_all_courses():
    try:
        conn = connectionstring()
        cursor = conn.cursor()
        cursor.execute('SELECT CourseId, coursecode, coursename, description FROM Courses')
        rows = cursor.fetchall()
        columns = [column[0] for column in cursor.description]
        courses = [dict(zip(columns, row)) for row in rows]
        return jsonify(courses), 200
    except Exception as e:
        return jsonify({"error": "Failed to retrieve courses", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/courses', methods=['POST'])
def create_course():
    try:
        data = request.get_json()
        if not data or not data.get('coursecode') or not data.get('coursename'):
            return jsonify({"error": "Course code and name required"}), 400
        conn = connectionstring()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Courses (coursecode, coursename, description) VALUES (?, ?, ?)",
            (data['coursecode'], data['coursename'], data.get('description'))
        )
        conn.commit()
        return jsonify({"message": "Course added"}), 201
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "Failed to add course", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/courses/<int:id>', methods=['DELETE'])
def del_courses(id):
    conn = connectionstring()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Courses WHERE CourseId = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Deleted'}), 200


@app.route('/students/<int:stdid>/dashboard', methods=['GET'])
# @jwt_required()  # Disabled
def get_student_dashboard_info(stdid):
    """
    Fetches hardcoded student info and course details (JWT removed).
    """
    # current_student_id = get_jwt_identity()  # JWT disabled
    current_student_id = stdid
    conn = None
    try:
        conn = connectionstring()
        cursor = conn.cursor()
        cursor.execute("SELECT stdid, fullname, email FROM Students WHERE stdid = ?", (current_student_id,))
        student_info = cursor.fetchone()

        if not student_info:
            return jsonify({"error": "Student not found."}), 404

        student_data = {
            "stdid": student_info[0],
            "fullname": student_info[1],
            "email": student_info[2],
            "courses": []
        }

        cursor.execute("""
            SELECT C.CourseId, C.coursecode, C.coursename, C.description
            FROM Courses C
            JOIN StudentCourses SC ON C.CourseId = SC.CourseId
            WHERE SC.stdid = ?
        """, (current_student_id,))
        course_rows = cursor.fetchall()
        columns = [column[0] for column in cursor.description]
        student_data["courses"] = [dict(zip(columns, row)) for row in course_rows]

        return jsonify(student_data), 200

    except Exception as e:
        return jsonify({'error': 'Unexpected error', 'details': str(e)}), 500
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    app.run(host="127.0.0.1", debug=True)

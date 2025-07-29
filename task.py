from flask import Flask, jsonify, request
# from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity
from flask_cors import CORS
import pyodbc
import logging # Add this at the top

app = Flask(__name__)
CORS(app)

# JWT Config (disabled)
# app.config["JWT_SECRET_KEY"] = "test"
# jwt = JWTManager(app)

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

# clean it up
@app.route('/students/<int:stdid>/courses', methods=['POST'])
def add_student_course(stdid):
    conn = None
    try:
        data = request.get_json()
        course_code = data.get('coursecode')
        course_name = data.get('coursename')
        description = data.get('description')

        # Input validation
        if not all([course_code, course_name, description]):
            logging.warning(f"Missing course details for student {stdid}. Data: {data}")
            return jsonify({"error": "Missing course details (code, name, description)."}), 400

        conn = connectionstring()
        cursor = conn.cursor()

        course_id = None

        # 1. Check if the course already exists
        cursor.execute("SELECT CourseId FROM Courses WHERE coursecode = ? AND coursename = ?",
                       (course_code, course_name))
        existing_course = cursor.fetchone()

        if existing_course:
            course_id = existing_course[0]
            logging.info(f"Course '{course_code}' already exists (ID: {course_id}).")
        else:
            # 2. If not, insert the new course and retrieve the generated ID using OUTPUT
            # CourseId is an IDENTITY column
            cursor.execute("""
                INSERT INTO Courses (coursecode, coursename, description)
                OUTPUT INSERTED.CourseId
                VALUES (?, ?, ?)
            """, (course_code, course_name, description))
            course_id = cursor.fetchone()[0] # Fetch the ID directly from the INSERT statement
            logging.info(f"New course '{course_code}' created with ID: {course_id}.")

        # Ensure we have a course_id before proceeding
        if not course_id:
            logging.error(f"Failed to retrieve CourseId after insert for course: {course_code}")
            return jsonify({"error": "Failed to get or create CourseId after insert."}), 500

        # 3. Check if the student is already enrolled in this specific course
        cursor.execute("SELECT 1 FROM StudentCourses WHERE stdid = ? AND CourseId = ?",
                       (stdid, course_id))
        if cursor.fetchone():
            # If already enrolled, rollback any potential new course creation from this transaction
            conn.rollback()
            logging.info(f"Student {stdid} is already enrolled in course {course_id}.")
            return jsonify({"error": "Student is already enrolled in this course."}), 409

        # 4. Enroll the student in the course
        cursor.execute("INSERT INTO StudentCourses (stdid, CourseId) VALUES (?, ?)",
                       (stdid, course_id))
        logging.info(f"Student {stdid} enrolled in course {course_id}.")
        conn.commit()
        logging.info(f"Transaction committed successfully for student {stdid}, course {course_id}.")

        return jsonify({"message": "Course added to student successfully!", "CourseId": course_id}), 201

    except Exception as e:
        # If any error occurs, rollback all changes made in this chunk
        if conn:
            conn.rollback()
        logging.error(f"Error in add_student_course for student {stdid}: {e}", exc_info=True)
        return jsonify({'error': 'Unexpected error adding course', 'details': str(e)}), 500
    finally:
        # Ensure the connection is closed in all cases
        if conn:
            conn.close()

# deleting a course:
@app.route('/students/<int:stdid>/courses/<int:courseId>', methods=['DELETE'])
def delete_student_course(stdid, courseId):
    conn = None
    try:
        conn = connectionstring()
        cursor = conn.cursor()

        # Check if the enrollment exists before attempting to delete
        cursor.execute("SELECT 1 FROM StudentCourses WHERE stdid = ? AND CourseId = ?",
                       (stdid, courseId))
        if not cursor.fetchone():
            logging.warning(f"Attempted to delete non-existent enrollment: Student {stdid}, Course {courseId}")
            return jsonify({"error": "Student is not enrolled in this course."}), 404

        # Delete the enrollment from the StudentCourses table
        cursor.execute("DELETE FROM StudentCourses WHERE stdid = ? AND CourseId = ?",
                       (stdid, courseId))
        conn.commit()
        logging.info(f"Enrollment deleted: Student {stdid}, Course {courseId}.")
        return jsonify({'message': 'Course removed from student successfully!'}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        logging.error(f"Error deleting course enrollment for student {stdid}, course {courseId}: {e}", exc_info=True)
        return jsonify({'error': 'Unexpected error removing course', 'details': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/students/<int:stdid>/dashboard', methods=['GET'])
# @jwt_required()  # Disabled
def get_student_dashboard_info(stdid):
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

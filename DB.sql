Create Database studentportal;
GO

use studentportal;
Go

Create table Students(
	Stdid INT Primary Key Identity(1,1),
	fullname varchar(50) Not Null,
	email	varchar(50) Not Null Unique,
	password varchar(100) Not Null,
	date Datetime default getdate()
);

Create table Courses(
	Courseid INT Primary Key Identity(1,1),
	coursecode varchar(10) Not Null Unique,
	coursename varchar(100) Not Null,
	description varchar(255)
);


Create table StudentCourses(
	Enrollid INT Primary Key Identity(1,1),
	stdid INT Not Null,
	courseid INT Not Null,
	enrolledon Datetime default getdate(),

	Foreign Key (stdid) References Students(stdid),
	Foreign Key (courseid) References Courses(courseid)
);


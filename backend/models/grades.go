package models

type StudentGrade struct {
	ID          string `json:"student_id"`
	Subject     string `json:"subject"`
	Grade       int    `json:"grade"`
	StudentName string `json:"student_name"`
}

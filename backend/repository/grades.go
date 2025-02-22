package repository

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/youssefsiam38/file-upload-fullstack-task/models"
)

type GradesRepository interface {
	InsertGrades(ctx context.Context, grades []models.StudentGrade) (chan int, error)
}

type GradesPgRepository struct {
	pgxPool *pgxpool.Pool
}

func NewGradesPgRepository(pgxPool *pgxpool.Pool) *GradesPgRepository {
	return &GradesPgRepository{pgxPool: pgxPool}
}

func (g *GradesPgRepository) InsertGrades(ctx context.Context, grades []models.StudentGrade) (chan int, error) {
	progress := make(chan int)
	go func() {
		defer close(progress)

		tx, err := g.pgxPool.Begin(ctx)
		if err != nil {
			progress <- -1
			return
		}

		defer func() {
			if p := recover(); p != nil {
				tx.Rollback(ctx)
				panic(p)
			} else if err != nil {
				tx.Rollback(ctx)
			} else {
				err = tx.Commit(ctx)
			}
		}()

		for i, grade := range grades {
			_, err = tx.Exec(ctx, "INSERT INTO student_grades (id, subject, grade, student_name) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET subject = EXCLUDED.subject, grade = EXCLUDED.grade, student_name = EXCLUDED.student_name", grade.ID, grade.Subject, grade.Grade, grade.StudentName)
			if err != nil {
				log.Println(err)
				return
			}
			progress <- i + 1
		}
	}()
	return progress, nil
}

package repository

import (
	"context"
	"fmt"
	"log"
	"strings"

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
		const batchSize = 200
		numGrades := len(grades)

		for batchStart := 0; batchStart < numGrades; batchStart += batchSize {
			batchEnd := batchStart + batchSize
			if batchEnd > numGrades {
				batchEnd = numGrades
			}
			batch := grades[batchStart:batchEnd]

			tx, err := g.pgxPool.Begin(ctx)
			if err != nil {
				progress <- -1
				log.Println("Failed to begin transaction:", err)
				return
			}

			// Build the INSERT query
			var queryBuilder strings.Builder
			queryBuilder.WriteString("INSERT INTO student_grades (id, subject, grade, student_name) VALUES ")
			args := make([]interface{}, 0, len(batch)*4)

			for i, grade := range batch {
				// Build placeholders
				if i > 0 {
					queryBuilder.WriteString(", ")
				}
				argIdx := i * 4
				queryBuilder.WriteString(fmt.Sprintf("($%d, $%d, $%d, $%d)", argIdx+1, argIdx+2, argIdx+3, argIdx+4))

				// Append grade values to args
				args = append(args, grade.ID, grade.Subject, grade.Grade, grade.StudentName)

				// Send progress update
				progress <- batchStart + i + 1
			}

			// Add ON CONFLICT clause
			queryBuilder.WriteString(`
                ON CONFLICT (id) DO UPDATE
                SET subject = EXCLUDED.subject,
                    grade = EXCLUDED.grade,
                    student_name = EXCLUDED.student_name
            `)

			// Execute the query
			_, err = tx.Exec(ctx, queryBuilder.String(), args...)
			if err != nil {
				log.Println("Failed to execute batch insert:", err)
				if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
					log.Println("Failed to rollback transaction:", rollbackErr)
				}
				progress <- -1
				return
			}

			// Commit the transaction
			if err = tx.Commit(ctx); err != nil {
				log.Println("Failed to commit transaction:", err)
				progress <- -1
				return
			}
		}
	}()
	return progress, nil
}

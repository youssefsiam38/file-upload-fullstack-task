package usecase

import (
	"context"

	"github.com/youssefsiam38/file-upload-fullstack-task/models"
	"github.com/youssefsiam38/file-upload-fullstack-task/repository"
)

type GradesUsecase interface {
	InsertGrades(ctx context.Context, grades []models.StudentGrade) (chan int, error)
}

type GradesUsecaseImpl struct {
	gradesRepository repository.GradesRepository
}

func NewGradesUsecase(gradesRepository repository.GradesRepository) *GradesUsecaseImpl {
	return &GradesUsecaseImpl{gradesRepository: gradesRepository}
}

func (g *GradesUsecaseImpl) InsertGrades(ctx context.Context, grades []models.StudentGrade) (chan int, error) {
	return g.gradesRepository.InsertGrades(ctx, grades)
}

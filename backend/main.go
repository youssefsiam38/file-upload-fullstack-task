package main

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/youssefsiam38/file-upload-fullstack-task/http"
	"github.com/youssefsiam38/file-upload-fullstack-task/repository"
	usecase "github.com/youssefsiam38/file-upload-fullstack-task/usecases"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	conn, err := pgxpool.New(context.Background(), os.Getenv("DB_CONNECTION_STRING"))
	if err != nil {
		log.Printf("failed to connect to database: %v", err)
		os.Exit(1)
	}
	defer conn.Close()

	studentGradesRepository := repository.NewGradesPgRepository(conn)

	studentGradesUsecase := usecase.NewGradesUsecase(studentGradesRepository)

	gradesAPIs := http.NewGradesAPIs(studentGradesUsecase)

	apis := http.APIs{
		GradesAPIs: gradesAPIs,
	}

	http.StartServer(apis)
}

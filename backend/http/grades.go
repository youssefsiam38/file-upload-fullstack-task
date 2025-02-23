package http

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"math"
	"mime/multipart"
	"net/http"
	"strconv"
	"sync"

	"github.com/youssefsiam38/file-upload-fullstack-task/models"
	usecase "github.com/youssefsiam38/file-upload-fullstack-task/usecases"
)

type GradesAPIs interface {
	UploadGradesCSVs(w http.ResponseWriter, r *http.Request)
}

type gradesAPIs struct {
	GradesUsecase usecase.GradesUsecase
}

func NewGradesAPIs(gradesUsecase usecase.GradesUsecase) GradesAPIs {
	return gradesAPIs{GradesUsecase: gradesUsecase}
}

func (g gradesAPIs) UploadGradesCSVs(w http.ResponseWriter, r *http.Request) {
	// Set response headers for streaming
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Transfer-Encoding", "chunked")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(http.StatusOK)

	// Ensure the ResponseWriter can be flushed
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	// Parse the multipart form
	err := r.ParseMultipartForm(1 << 30) // 1 GB
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Retrieve the files from form data
	files := r.MultipartForm.File["files"]

	// Channel to receive progress updates
	progressChan := make(chan string)
	// WaitGroup to wait for all goroutines to finish
	var wg sync.WaitGroup
	wg.Add(len(files))

	// Process each file in a separate goroutine
	for idx, fileHeader := range files {
		// Capture index and fileHeader variables
		idxCopy := idx
		fileHeaderCopy := fileHeader

		go func(idx int, fh *multipart.FileHeader) {
			defer wg.Done()

			temp, err := convertCSVFileHeadersToStudentGrades([]*multipart.FileHeader{fh})
			if err != nil {
				progressChan <- fmt.Sprintf("{\"fileIndex\":%d,\"error\":\"%s\"}\n", idx, err.Error())
				return
			}

			noOfInsertedGradesChan, err := g.GradesUsecase.InsertGrades(r.Context(), temp)
			if err != nil {
				progressChan <- fmt.Sprintf("{\"fileIndex\":%d,\"error\":\"%s\"}\n", idx, err.Error())
				return
			}

			for noOfInsertedGrades := range noOfInsertedGradesChan {
				log.Println("noOfInsertedGrades", noOfInsertedGrades)
				log.Println("len(temp)", len(temp))
				percentage := (float64(noOfInsertedGrades) / float64(len(temp))) * 100
				log.Println(percentage)
				if int(percentage) == 100 {
					progressChan <- fmt.Sprintf("{\"fileIndex\":%d,\"processingComplete\":true}\n", idx)
				} else {
					progressChan <- fmt.Sprintf("{\"fileIndex\":%d,\"processingProgress\":%d}\n", idx, int(math.Ceil(percentage)))
				}
			}
		}(idxCopy, fileHeaderCopy)
	}

	// Goroutine to close the progress channel after all processing is done
	go func() {
		wg.Wait()
		close(progressChan)
	}()

	// Listen to progress channel and write updates to ResponseWriter
	for {
		select {
		case progressUpdate, ok := <-progressChan:
			if !ok {
				// All progress updates have been sent
				return
			}
			// Write progress update to client
			fmt.Fprint(w, progressUpdate)
			// Flush the buffer to ensure the client receives the update immediately
			flusher.Flush()
		case <-r.Context().Done():
			// Client disconnected
			fmt.Println("Client closed the connection.")
			return
		}
	}
}

func convertCSVFileHeadersToStudentGrades(fileHeaders []*multipart.FileHeader) ([]models.StudentGrade, error) {
	var grades []models.StudentGrade

	for _, fileHeader := range fileHeaders {
		// Open the file from the file header
		file, err := fileHeader.Open()
		if err != nil {
			return nil, fmt.Errorf("failed to open file %q: %v", fileHeader.Filename, err)
		}
		// Ensure the file is closed after processing
		defer file.Close()

		reader := csv.NewReader(file)

		// Read the header line to get field names
		headers, err := reader.Read()
		if err != nil {
			return nil, fmt.Errorf("failed to read CSV header from file %q: %v", fileHeader.Filename, err)
		}

		// Map column positions to field names
		columnIndex := make(map[string]int)
		for i, header := range headers {
			columnIndex[header] = i
		}

		// Read the rest of the CSV records
		for {
			record, err := reader.Read()
			if err == io.EOF {
				// End of file
				break
			}
			if err != nil {
				return nil, fmt.Errorf("failed to read CSV record from file %q: %v", fileHeader.Filename, err)
			}

			// Parse the record into StudentGrade
			var studentGrade models.StudentGrade

			// Get student_id
			if idx, ok := columnIndex["student_id"]; ok {
				studentGrade.ID = record[idx]
			} else {
				return nil, fmt.Errorf("student_id field not found in CSV file %q", fileHeader.Filename)
			}

			// Get student_name
			if idx, ok := columnIndex["student_name"]; ok {
				studentGrade.StudentName = record[idx]
			} else {
				return nil, fmt.Errorf("student_name field not found in CSV file %q", fileHeader.Filename)
			}

			// Get subject
			if idx, ok := columnIndex["subject"]; ok {
				studentGrade.Subject = record[idx]
			} else {
				return nil, fmt.Errorf("subject field not found in CSV file %q", fileHeader.Filename)
			}

			// Get grade (as int)
			if idx, ok := columnIndex["grade"]; ok {
				gradeStr := record[idx]
				gradeInt, err := strconv.Atoi(gradeStr)
				if err != nil {
					return nil, fmt.Errorf("invalid grade value %q in file %q: %v", gradeStr, fileHeader.Filename, err)
				}
				studentGrade.Grade = gradeInt
			} else {
				return nil, fmt.Errorf("grade field not found in CSV file %q", fileHeader.Filename)
			}

			grades = append(grades, studentGrade)
		}
	}
	return grades, nil
}

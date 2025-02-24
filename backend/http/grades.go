package http

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"mime/multipart"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/youssefsiam38/file-upload-fullstack-task/models"
	usecase "github.com/youssefsiam38/file-upload-fullstack-task/usecases"
)

type GradesAPIs interface {
	UploadGradesCSV(w http.ResponseWriter, r *http.Request)
	GetProcessingProgress(w http.ResponseWriter, r *http.Request)
}

type gradesAPIs struct {
	GradesUsecase usecase.GradesUsecase
}

func NewGradesAPIs(gradesUsecase usecase.GradesUsecase) GradesAPIs {
	return gradesAPIs{GradesUsecase: gradesUsecase}
}

// FileProcessingInfo holds the processing state of an uploaded file
type FileProcessingInfo struct {
	ID                 string
	NoOfInsertedGrades int
	TotalGrades        int
	Progress           int       // Progress in percentage
	LastUpdated        time.Time // Last time the progress was updated
}

var (
	// Global map to hold processing info of all files
	fileProcessingInfoMap = make(map[string]*FileProcessingInfo)
	fileProcessingMutex   sync.Mutex
)

func (g gradesAPIs) UploadGradesCSV(w http.ResponseWriter, r *http.Request) {
	// Parse the incoming form to get the file
	err := r.ParseMultipartForm(1 << 30) // 1 GB
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Retrieve the file from form data
	fileHeaders := r.MultipartForm.File["file"]
	if len(fileHeaders) == 0 {
		http.Error(w, "No file provided", http.StatusBadRequest)
		return
	}
	fileHeader := fileHeaders[0]

	// Generate a new UUID for this file
	fileID := uuid.New().String()

	// Initialize the file processing info and add to the map
	fileInfo := &FileProcessingInfo{
		ID:          fileID,
		Progress:    0,
		LastUpdated: time.Now(),
	}
	fileProcessingMutex.Lock()
	fileProcessingInfoMap[fileID] = fileInfo
	fileProcessingMutex.Unlock()

	// Return the file ID to the client
	response := map[string]string{"file_id": fileID}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	// Start the background goroutine to process the file
	go func() {
		defer func() {
			// Schedule removal of this file info after one hour of completion or error
			time.AfterFunc(time.Hour, func() {
				fileProcessingMutex.Lock()
				delete(fileProcessingInfoMap, fileID)
				fileProcessingMutex.Unlock()
			})
		}()

		grades, err := convertCSVFileHeaderToStudentGrades(fileHeader)
		if err != nil {
			fileProcessingMutex.Lock()
			fileInfo.Progress = -1 // Indicate error
			fileInfo.LastUpdated = time.Now()
			fileProcessingMutex.Unlock()
			return
		}

		totalGrades := len(grades)
		fileProcessingMutex.Lock()
		fileInfo.TotalGrades = totalGrades
		fileProcessingMutex.Unlock()

		noOfInsertedGradesChan, err := g.GradesUsecase.InsertGrades(context.Background(), grades)
		if err != nil {
			fileProcessingMutex.Lock()
			fileInfo.Progress = -1 // Indicate error
			fileInfo.LastUpdated = time.Now()
			fileProcessingMutex.Unlock()
			return
		}

		for noOfInsertedGrades := range noOfInsertedGradesChan {
			// Calculate the progress percentage
			percentage := int(math.Ceil((float64(noOfInsertedGrades) / float64(totalGrades)) * 100))
			fileProcessingMutex.Lock()
			fileInfo.NoOfInsertedGrades = noOfInsertedGrades
			fileInfo.Progress = percentage
			fileInfo.LastUpdated = time.Now()
			fileProcessingMutex.Unlock()
		}
	}()
}

func (g gradesAPIs) GetProcessingProgress(w http.ResponseWriter, r *http.Request) {
	fileProcessingMutex.Lock()
	defer fileProcessingMutex.Unlock()

	var progressData []map[string]interface{}
	for _, fileInfo := range fileProcessingInfoMap {
		data := map[string]interface{}{
			"file_id":           fileInfo.ID,
			"records_processed": fileInfo.NoOfInsertedGrades,
			"progress":          fileInfo.Progress,
		}
		progressData = append(progressData, data)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(progressData)
}

func convertCSVFileHeaderToStudentGrades(fileHeader *multipart.FileHeader) ([]models.StudentGrade, error) {
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

	var grades []models.StudentGrade

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

	return grades, nil
}

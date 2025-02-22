package http

import (
	"flag"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/ieee0824/getenv"
)

type APIs struct {
	GradesAPIs GradesAPIs
}

var port *string

func init() {
	serverPort := getenv.String("HTTP_SERVER_PORT", "9000")
	port = flag.String("port", serverPort, "Port to listen on")
}

func StartServer(apis APIs) {
	flag.Parse()

	r := mux.NewRouter()
	apiPrefix := "/api"

	apiRouter := r.PathPrefix(apiPrefix).Subrouter()
	apiRouter.HandleFunc("/healthz", healthz).Methods("GET")

	// grades
	paymentApiSubrouter := apiRouter.PathPrefix("/grades").Subrouter()

	paymentApiSubrouter.HandleFunc("/upload", apis.GradesAPIs.UploadGradesCSVs).Methods("POST")

	start(*port, r)
}

func start(port string, r http.Handler) {
	log.Println("Server is running on port " + port)
	loggingRouter := loggingHandler(r)
	log.Fatal(http.ListenAndServe(":"+port, loggingRouter))
}

func loggingHandler(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.ServeHTTP(w, r)
	})
}

func healthz(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("OK"))
}

## Janan File Upload Task - Backend

## Tools Used
- Supabase: Supabase was employed to leverage its PostgREST API, simplifying the implementation of CRUD operations.  Specifically. It is important to note that I didn't use Supabase's object storage service for the actual file processing, which is handled by the Golang backend.

- Golang: The backend service, written in Golang, is responsible for the core file processing logic, including the parallel uploading of files.

## Installation Guide

### Prerequisites

Ensure the following tools are installed:

*   Golang: [https://go.dev/doc/install](https://go.dev/doc/install)
*   Supabase CLI:

```bash
brew install supabase/tap/supabase
```

### Setup Steps

1.  **Supabase Setup:**

    *   Navigate to the project directory:

    ```bash
    cd file-upload-fullstack-task
    ```

    *   Start Supabase (this will also run migrations):

    ```bash
    supabase start
    ```

2.  **Backend Setup (Golang):**

    *   Navigate to the backend directory:

    ```bash
    cd backend
    ```

    *   Start the Golang service:

    ```bash
    go run main.go
    ```

## Workflow
- The backend service is responsible for the parallel file uploads processing were implemented with inspiration from the clean architecture with the following layers:
    - **Models**: Contains the data model that will be used in the application
    - **UseCase**: Contains the use case that the application can perform
    - **Repository**: Contains the interface that the use cases will use to interact with the database
    - **Http**: Contains the http handler that will be used to interact with the frontend

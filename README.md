# Janan File Upload Task

## Tools Used
- Supabase: Supabase was employed to leverage its PostgREST API, simplifying the implementation of CRUD operations.  Specifically. It is important to note that I didn't use Supabase's object storage service for the actual file processing, which is handled by the Golang backend.

- Golang: The backend service, written in Golang, is responsible for the core file processing logic, including the parallel uploading of files.

- React/Next.js with Refine: The frontend is built using React and Next.js, along with the Refine framework (https://refine.dev) and Antd UI framework. This combination facilitates the development of a user-friendly interface for the file listing page, complete with features such as pagination, filtering, and sorting.

## Installation Guide

### Prerequisites

Ensure the following tools are installed:

*   Golang: [https://go.dev/doc/install](https://go.dev/doc/install)
*   Node.js: [https://nodejs.org/en/download](https://nodejs.org/en/download)
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

2.  **Environment Configuration:**

    *   Rename the example environment file:

    ```bash
    mv .env.example .env
    ```

    *   Populate the `.env` file with the necessary environment variables. You'll only need the missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` (obtain this by running `supabase status`).

    ```
    source .env
    ```

3.  **Backend Setup (Golang):**

    *   Navigate to the backend directory:

    ```bash
    cd backend
    ```

    *   Start the Golang service:

    ```bash
    go run main.go
    ```

4.  **Frontend Setup (React/Next.js):**

    *   Start the development server:

    ```bash
    npm run build
    npm run start
    ```

## AI vs Not AI
While AI tools like GitHub Copilot were used for code completion and assistance with specific syntax or API-specific functions (e.g low-level implementation like using xhr upload in frontend), the overall project architecture, design decisions, and high-level code implementation were primarily human-driven. Specifically: Lets split the work into three parts:

### High level decisions
Examples
- Choosing the tools to use
- Deciding the frontend UI/UX

### High level code implementation
Examples
- Deciding the backend code architecture (inspired by clean architecture)
- The big scope of the backend and frontend code and how code components interact with each other
- The decision of using streamed response for the file processing progress indication
- Using channels to make the file processing parallel

### Low level code implementation
Examples
- Dealing with hard to memorize APIs of the browser like the xhr upload
- The code that deals with the file processing in the backend

I think the last part is the only part that I used AI in (cannot measure exactly as I used auto-completion, but it was included in alot of details), not the bigger picture of the project

## Workflow

### Backend
- The backend service is responsible for the parallel file uploads processing were implemented with inspiration from the clean architecture with the following layers:
    - **Models**: Contains the data model that will be used in the application
    - **UseCase**: Contains the use case that the application can perform
    - **Repository**: Contains the interface that the use cases will use to interact with the database
    - **Http**: Contains the http handler that will be used to interact with the frontend
  
### Frontend
- The frontend is a NextJS application that uses Refine which works perfectly with NextJS and supabase to implement the listing page with pagination, filtering and sorting in place
- [Antd](https://ant.design/) was used for the UI components
- The frontend also uses the xhr upload to upload the files to the backend
- We used the streamed response to get the file processing progress indication for each file and calculate the overall progress in the frontend

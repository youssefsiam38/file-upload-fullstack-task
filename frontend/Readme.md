## Janan File Upload Task - Frontend

## Tools Used
- React/Next.js with Refine: The frontend is built using React and Next.js, along with the Refine framework ([https://refine.dev](https://refine.dev)) and Antd UI framework. This combination facilitates the development of a user-friendly interface for the file listing page, complete with features such as pagination, filtering, and sorting.

## Installation Guide

### Prerequisites

Ensure the following tools are installed:

*   Node.js: [https://nodejs.org/en/download](https://nodejs.org/en/download)

### Setup Steps

1.  **Environment Configuration:**

    *   Rename the example environment file:

    ```bash
    mv .env.example .env
    ```

    *   Populate the `.env` file with the necessary environment variables. You'll only need the missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` (obtain this by running `supabase status`).

    ```
    source .env
    ```

2.  **Frontend Setup (React/Next.js):**

    *   Start the development server:

    ```bash
    npm run build
    npm run start
    ```

## Workflow

- The frontend is a NextJS application that uses Refine which works perfectly with NextJS and supabase to implement the listing page with pagination, filtering and sorting in place
- [Antd](https://ant.design/) was used for the UI components
- The frontend also uses the xhr upload to upload the files to the backend
- We used the streamed response to get the file processing progress indication for each file and calculate the overall progress in the frontend
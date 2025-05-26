# Simple Product API

A simple REST API built with Node.js and Express to manage a list of products.

## Features

- `GET /products`: Returns a list of all products.
- `POST /products`: Adds a new product to the list. Expects a JSON body with `name` (string), `price` (number), and `quantity` (integer).

## Setup and Running

1.  **Prerequisites**:
    *   Node.js and npm installed.

2.  **Installation**:
    *   Clone the repository (or download the files).
    *   Navigate to the project directory.
    *   Install dependencies:
        ```bash
        npm install
        ```

3.  **Running the API**:
    *   Start the server:
        ```bash
        node app.js
        ```
    *   The API will be running at `http://localhost:3000`.

## Data Storage

Product data is stored in `products.json` in the root of the project.

## Error Handling

- The API returns appropriate HTTP status codes for errors.
- Basic validation is in place for the `POST /products` endpoint.

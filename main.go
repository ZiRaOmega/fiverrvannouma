package main

// This line declares the package that this file is a part of. In Go, every file must declare a package. The main package is special in Go. It defines a standalone executable program, not a library.

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"time"

	// Importing necessary packages for this program
	// fmt: package for formatted I/O with functions analogous to C's printf and scanf
	// html/template: package implements data-driven templates for generating HTML output safe against code injection
	// log: package implements a simple logging package
	// net/http: package provides HTTP client and server implementations
	// time: package provides functionality for measuring and displaying time

	uuid "github.com/satori/go.uuid"
	// Importing the package for generating UUIDs
)

const (
	COOKIE_SESSION_NAME     = "SESSION_ID"
	COOKIE_SESSION_DURATION = time.Hour * 3
	// Defining constants related to the session cookie. The session cookie will be named "SESSION_ID" and will last for 3 hours.
)

func SendIndex(w http.ResponseWriter, r *http.Request) {
	log.Printf("[SendIndex:%s] New Client with IP: %s\n", r.URL.Path, r.RemoteAddr)
	// This function is used to handle requests to send the index page. It logs the IP address of the client making the request.

	tmpl, err := template.ParseFiles("templates/header.html", "templates/footer.html", "templates/index.html")
	if err != nil {
		panic(err)
		// Parsing the HTML templates for the header, footer, and index. If there is an error, the program will panic and stop execution.
	}

	err = tmpl.ExecuteTemplate(w, "index", nil)
	if err != nil {
		panic(err)
		// Executing the "index" template and sending it to the client. If there is an error, the program will panic and stop execution.
	}
}

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		SendIndex(w, r)
		// Mapping the root URL ("/") to the SendIndex function.
	})
	http.HandleFunc("/ws", wsHandler)
	// Mapping the "/ws" URL to the wsHandler function. This function is not defined in the provided code.

	db := GetDB()
	sqlMaker(db)
	defer CloseDB()
	// Getting a reference to the database, initializing it with the sqlMaker function, and making sure it will be closed when the main function ends.

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static/"))))
	// Setting up a static file server that serves files from the "./static/" directory when a URL starts with "/static/".

	http.HandleFunc("/api/logout", func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(COOKIE_SESSION_NAME)
		if err == nil && cookie != nil {
			sessionId := cookie.Value
			GetDB().Exec("DELETE FROM session WHERE session_id = ?", sessionId)
			// Handling the "/api/logout" URL. It deletes the session with the ID from the cookie from the database.

			http.SetCookie(w, &http.Cookie{
				Name:     COOKIE_SESSION_NAME,
				Value:    "",
				Expires:  time.Unix(0, 0),
				HttpOnly: false,
				Path:     "/",
				// Setting a new cookie with the same name but an empty value and an expiration date in the past, effectively deleting the cookie from the client's browser.
			})
		}
	})

	http.HandleFunc("/api/register", func(w http.ResponseWriter, r *http.Request) {
		username := r.FormValue("username")
		firstname := r.FormValue("firstname")
		lastname := r.FormValue("lastname")
		email := r.FormValue("email")
		age := r.FormValue("age")
		gender := r.FormValue("gender")
		password := r.FormValue("password")
		// Reading the values from the form submitted by the user.

		allFilled := true
		for _, s := range []string{username, firstname, lastname, email, age, gender, password} {
			if s == "" {
				allFilled = false
			}
		}
		// Checking if all fields are filled.

		if allFilled {
			hashedPassword, _ := HashPassword(password)
			// Hashing the user's password for secure storage.

			GetDB().Exec(
				"INSERT INTO user (name, mail, age, gender, firstname, lastname, password) VALUES (?,?,?,?,?,?,?)",
				username, email, age, gender, firstname, lastname, hashedPassword)
			// Inserting the new user into the database.

			w.WriteHeader(http.StatusOK)
			// Sending a 200 OK status code to the client.
			return
		}

		w.WriteHeader(http.StatusUnauthorized)
		// If not all fields are filled, sending a 401 Unauthorized status code to the client.
	})

	http.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
		username := r.FormValue("username")
		password := r.FormValue("password")
		// Reading the username and password from the form submitted by the user.

		if username != "" && password != "" {
			row := GetDB().QueryRow("SELECT idUser, password FROM user WHERE name = ? OR mail = ?", username, username)
			// Querying the database for a user with the provided username or email.

			if row != nil {
				var sqUserId int
				var sqHashedPassword string
				if row.Scan(&sqUserId, &sqHashedPassword) == nil {
					if CheckPasswordHash(password, sqHashedPassword) {
						// If the password provided by the user matches the hashed password from the database, generating a new session.

						sessionId := uuid.NewV4().String()
						GetDB().Exec("INSERT INTO session (session_id, user_id) VALUES (?, ?)", sessionId, sqUserId)
						// Inserting the new session into the database.

						http.SetCookie(w, &http.Cookie{
							Name:     COOKIE_SESSION_NAME,
							Value:    sessionId,
							Expires:  time.Now().Add(COOKIE_SESSION_DURATION),
							HttpOnly: false,
							Path:     "/",
							// Setting a new session cookie in the client's browser.
						})

						w.WriteHeader(http.StatusOK)
						// Sending a 200 OK status code to the client.
						return
					}
				}
			}
		}
		w.WriteHeader(http.StatusUnauthorized)
		// If the username or password is incorrect, sending a 401 Unauthorized status code to the client.
	})

	fmt.Println("http://localhost:8080")
	// Printing the URL of the server to the console.

	http.ListenAndServe(":8080", nil)
	// Starting the server and listening for requests on port 8080.
}

//

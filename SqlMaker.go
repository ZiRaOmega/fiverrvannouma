package main

import (
	"database/sql"
	"log"
	"os"
	"strconv"
	"time"

	_ "github.com/mattn/go-sqlite3" // Import go-sqlite3 library
	// Import bcrypt library
)

type Profile struct {
	Username string
	Email    string
	Password string
}

const SQLITE_DATABASE_PATH = "./sqlite-database.db"

// Do not use that, don't mind that. Just use GetDB
var private_db *sql.DB = nil

// Return a pointer (handle) to the database if open
// else open it
func GetDB() *sql.DB {
	if private_db == nil {
		var err error = nil
		private_db, err = sql.Open("sqlite3", SQLITE_DATABASE_PATH)
		if err != nil {
			log.Fatal(err)
		}
	}
	return private_db
}

func CloseDB() {
	if private_db != nil {
		private_db.Close()
	}
}

func sqlMaker(db *sql.DB) {
	// Create Database Tables
	createMpTable(db)
	createUserTable(db)
	CreateUUIDTable(db)
	createPostTable(db)
	createCommentsTable(db)
	// createConversationsTable(db)
	createSessionTable(db)

	// INSERT RECORDS
	// passtest, _ := HashPassword("test")

	// fmt.Println(CheckPasswordHash("d", HashD), CheckPasswordHash("", HashD))
}

// Log prints a message to the standard logger. It accepts a variable
// number of arguments, similar to fmt.Println.
func Log(texttolog ...interface{}) {
	log.Println(texttolog...)
}

// createUserTable creates a new table named "user" if it does not already exist.
func createUserTable(db *sql.DB) {
	createUserTableSQL := `CREATE TABLE IF NOT EXISTS user (
		"idUser" integer NOT NULL PRIMARY KEY AUTOINCREMENT,		
		"name" TEXT,
		"mail" TEXT,
		"age" TEXT,
		"gender" TEXT,
		"firstname" TEXT,
		"lastname" TEXT,
		"password" TEXT
	  );` // SQL Statement for Create Table

	statement, err := db.Prepare(createUserTableSQL) // Prepare SQL Statement
	if err != nil {
		log.Fatal(err.Error())
	}
	statement.Exec() // Execute SQL Statements
}

// createSessionTable creates a new table named "session" if it does not already exist.
func createSessionTable(db *sql.DB) {
	query := `CREATE TABLE IF NOT EXISTS session (
		"session_id" TEXT NOT NULL PRIMARY KEY,
		"user_id" INTEGER
	  );`

	statement, err := db.Prepare(query) // Prepare SQL Statement
	if err != nil {
		log.Fatal(err.Error())
	}
	statement.Exec()
}

// AddOneComment increments the number of comments for a particular post by 1.
func AddOneComment(db *sql.DB, idPost int) {
	go Log("[\033[32m+\033[0m] Adding comment on post with ID :", idPost)
	AddOneCommentSQL := `UPDATE post SET nbr_comments = nbr_comments + 1 WHERE idPost = ?`
	statement, err := db.Prepare(AddOneCommentSQL) // Prepare statement.
	// This is good to avoid SQL injections
	if err != nil {
		log.Fatalln(err.Error())
	}
	_, err = statement.Exec(idPost)
	if err != nil {
		log.Fatalln(err.Error())
	}
}

// createCommentsTable creates a new table named "comments" if it does not already exist.
func createCommentsTable(db *sql.DB) {
	createCommentsTableSQL := `CREATE TABLE IF NOT EXISTS comments (
		"commentID" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
		"comment" TEXT,
		"username" TEXT,
		"date" TEXT,
		"postID" integer,
		FOREIGN KEY(postID) REFERENCES post(idPost) 
	);`

	statement, err := db.Prepare(createCommentsTableSQL) // Prepare SQL Statement
	if err != nil {
		log.Fatal(err.Error())
	}
	statement.Exec() // Execute SQL Statements
}

// createPostTable creates a new table named "post" if it does not already exist.
func createPostTable(db *sql.DB) {
	createPostTableSQL := `CREATE TABLE IF NOT EXISTS post (
		"idPost" integer NOT NULL PRIMARY KEY AUTOINCREMENT,		
		"title" TEXT,
		"username" TEXT,
		"date" TEXT,
		"content" TEXT,
		"categories" TEXT,
		"comments" TEXT
	  );` // SQL Statement for Create Table

	statement, err := db.Prepare(createPostTableSQL) // Prepare SQL Statement
	if err != nil {
		log.Fatal(err.Error())
	}
	statement.Exec() // Execute SQL Statements
}

// createMpTable creates a new table named "mp" if it does not already exist.
func createMpTable(db *sql.DB) {
	createMpTableSQL := `CREATE TABLE IF NOT EXISTS mp (
        "sender" TEXT,        
        "receiver" TEXT,
        "content" TEXT,
        "date" TEXT
      );` // SQL Statement for Create Table

	statement, err := db.Prepare(createMpTableSQL) // Prepare SQL Statement
	if err != nil {
		log.Fatal(err.Error())
	}
	statement.Exec() // Execute SQL Statements
}

// AddComment adds a new comment to the "comments" table.
func AddComment(db *sql.DB, comment string, usernames string, postID int) {
	insertSQL := `INSERT INTO comments(comment, username, date, postID) VALUES (?, ?, ?, ?)`
	statement, err := db.Prepare(insertSQL)
	if err != nil {
		log.Fatal(err.Error())
	}

	date := time.Now().UnixNano() / 1000000
	_, err = statement.Exec(comment, usernames, date, postID)

	if err != nil {
		log.Fatal(err.Error())
	}
}

// RemoveAllLike removes all likes associated with a particular post.
func RemoveAllLike(db *sql.DB, postID string) {
	go Log("[\033[31m-\033[0m] Removing like")
	removeLikeSQL := `DELETE FROM likes WHERE postID = ?`
	statement, err := db.Prepare(removeLikeSQL) // Prepare statement.
	if err != nil {
		log.Fatalln(err.Error())
	}
	idPost, err := strconv.Atoi(postID)
	_, err = statement.Exec(idPost)
	if err != nil {
		log.Fatalln(err.Error())
	}
}

// NoEmptyCategory removes empty categories from a given slice of categories.
func NoEmptyCategory(categorie []string) (NoEmpty []string) {
	for i := 0; i < len(categorie); i++ {
		if categorie[i] != "" && categorie[i] != " " {
			NoEmpty = append(NoEmpty, categorie[i])
		}
	}
	return NoEmpty
}

// AddOneLike increments the number of likes for a particular post by 1.
func AddOneLike(db *sql.DB, idPost int) {
	go Log("[\033[32m+\033[0m] Adding like on post with ID :", idPost)
	addOneLikeSQL := `UPDATE post SET nbr_likes = nbr_likes + 1 WHERE idPost = ?`
	statement, err := db.Prepare(addOneLikeSQL) // Prepare statement.
	// This is good to avoid SQL injections
	if err != nil {
		log.Fatalln(err.Error())
	}
	_, err = statement.Exec(idPost)
	if err != nil {
		log.Fatalln(err.Error())
	}
}

// AddOneDisLike increments the number of dislikes for a particular post by 1.
func AddOneDisLike(db *sql.DB, idPost int) {
	go Log("[\033[32m+\033[0m] Adding dislike on post with ID :", idPost)
	addOneLikeSQL := `UPDATE post SET nbr_dislikes = nbr_dislikes + 1 WHERE idPost = ?`
	statement, err := db.Prepare(addOneLikeSQL) // Prepare statement.
	// This is good to avoid SQL injections
	if err != nil {
		log.Fatalln(err.Error())
	}
	_, err = statement.Exec(idPost)
	if err != nil {
		log.Fatalln(err.Error())
	}
}

// EditUserEmail edits a user's email address.
func EditUserEmail(db *sql.DB, name string, newEmail string) {
	go Log("[\033[33m>\033[0m] Editing user email")
	editUserEmailSQL := `UPDATE user SET mail = ? WHERE name = ?`
	statement, err := db.Prepare(editUserEmailSQL) // Prepare statement.
	// This is good to avoid SQL injections
	if err != nil {
		log.Fatalln(err.Error())
	}
	_, err = statement.Exec(newEmail, name)
	if err != nil {
		log.Fatalln(err.Error())
	}
}

// EditUserPicture edits a user's profile picture.
func EditUserPicture(db *sql.DB, name string, newPicture string) {
	go Log("[\033[33m>\033[0m] Editing user profile picture")
	editUserPictureSQL := `UPDATE user SET profile_picture = ? WHERE name = ?`
	statement, err := db.Prepare(editUserPictureSQL) // Prepare statement.
	// This is good to avoid SQL injections
	if err != nil {
		log.Fatalln(err.Error())
	}
	_, err = statement.Exec(newPicture, name)
	if err != nil {
		log.Fatalln(err.Error())
	}
}

// EditUserPassword edits a user's password.
func EditUserPassword(db *sql.DB, name string, newPassword string) {
	go Log("[\033[33m>\033[0m] Editing user password")
	editUserPasswordSQL := `UPDATE user SET password = ? WHERE name = ?`
	statement, err := db.Prepare(editUserPasswordSQL) // Prepare statement.
	// This is good to avoid SQL injections
	if err != nil {
		log.Fatalln(err.Error())
	}
	_, err = statement.Exec(newPassword, name)
	if err != nil {
		log.Fatalln(err.Error())
	}
}

// displayUsers retrieves and displays all user records from the "user" table.
func displayUsers(db *sql.DB) {
	row, err := db.Query("SELECT * FROM user ORDER BY name")
	if err != nil {
		log.Fatal(err)
	}
	defer row.Close()
	for row.Next() { // Iterate and fetch the records from result cursor
		var id int
		var name string
		var mail string
		var password string
		var profile_picture string
		var rank string
		row.Scan(&id, &name, &mail, &password, &profile_picture, &rank)
	}
}

// displayPosts retrieves and displays all post records from the "post" table.
func displayPosts(db *sql.DB) {
	row, err := db.Query("SELECT * FROM post ORDER BY title")
	if err != nil {
		log.Fatal(err)
	}
	defer row.Close()
	for row.Next() { // Iterate and fetch the records from result cursor
		var id int
		var title string
		var username string
		var profile_picture string
		var date string
		var content string
		var image_in_post string
		var nbr_likes int
		var nbr_dislikes int
		var nbr_comments int
		var categories string
		row.Scan(&id, &title, &username, &profile_picture, &date, &content, &image_in_post, &nbr_likes, &nbr_dislikes, &nbr_comments, &categories)
	}
}

// displayComments retrieves and displays all comment records from the "comments" table.
func displayComments(db *sql.DB) {
	row, err := db.Query("SELECT * FROM comments ORDER BY postID")
	if err != nil {
		log.Fatal(err)
	}
	defer row.Close()
	for row.Next() { // Iterate and fetch the records from result cursor
		var id int
		var comment string
		var username string
		var date string
		var postID int
		row.Scan(&id, &comment, &username, &date, &postID)
	}
}

// fileExists checks if a file exists in the filesystem.
func fileExists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

// getLatestCommentID retrieves the latest comment ID from the "comments" table.
func getLatestCommentID(db *sql.DB) int {
	row, err := db.Query("SELECT commentID FROM comments ORDER BY commentID DESC LIMIT 1")
	if err != nil {
		log.Fatal(err)
	}
	defer row.Close()
	for row.Next() { // Iterate and fetch the records from result cursor
		var commentID int
		row.Scan(&commentID)
		return commentID
	}
	return 0
}

// IsOnline checks if a user with the given username is currently online.
func IsOnline(Username string) bool {
	for k, v := range UserCookie {
		if k == Username && v.Expires.After(time.Now()) {
			return true
		}
	}
	return false
}

// GetAllUsers retrieves all user records from the "user" table and returns them as a slice of User structs.
func GetAllUsers(db *sql.DB) ([]User, error) {
	rows, err := db.Query("SELECT name FROM user ORDER BY name")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	var users []User
	for rows.Next() {
		var username string
		if err := rows.Scan(&username); err != nil {
			return nil, err
		}
		users = append(users, User{Username: username})
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

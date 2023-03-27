package main

// Import sql package
import (
	"database/sql"
	"log"
	"strconv"
	"strings"
	"time"

	// mattn/go-sqlite3
	_ "github.com/mattn/go-sqlite3"
	// bcrypt
	"golang.org/x/crypto/bcrypt"
)

func IsGoodCredentials(db *sql.DB, username string, password string) bool {
	// Get Password from Database
	var passwordFromDB string
	err := db.QueryRow("SELECT password FROM user WHERE name = ? or mail= ?", username, username).Scan(&passwordFromDB)
	if err != nil || passwordFromDB == "" {
		return false
	}
	// Compare Passwords
	err = bcrypt.CompareHashAndPassword([]byte(passwordFromDB), []byte(password))
	return err == nil
}

func RegisterUser(db *sql.DB, username string, email string, age string, gender string, firstname string, lastname string, password string) {
	// Hash Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}

	// Insert User into Database
	stmt, err := db.Prepare("INSERT INTO user(name, mail, age, gender, firstname, lastname, password) VALUES(?, ?, ?, ?, ?, ?, ?)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()
	_, err = stmt.Exec(username, email, age, gender, firstname, lastname, hashedPassword)
	if err != nil {
		log.Fatal(err)
	}
}

func DidUserExist(db *sql.DB, username string) bool {
	// Get Password from Database
	// Check if email or username already exists
	SqlQuery := "SELECT name FROM user WHERE name = ? or mail = ?"
	// prepare
	stmt, err := db.Prepare(SqlQuery)
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()
	// execute
	rows, err := stmt.Query(username, username)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	// check if user exists
	return rows.Next()
}

func CreatePost(db *sql.DB, Title string, Username string, Date string, Content string, Categories []string) {
	// Insert Post into Database
	stmt, err := db.Prepare("INSERT INTO post(title,username,date, content, categories) VALUES(?, ?, ?, ?, ?)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()
	_, err = stmt.Exec(Title, Username, Date, Content, strings.Join(Categories, ";"))
	if err != nil {
		log.Fatal(err)
	}
}

func CreatePrivateMessage(db *sql.DB, From string, To string, Content string, Date string) {
	// Insert Private Message into Database
	stmt, err := db.Prepare("INSERT INTO mp(sender, receiver, content, date) VALUES(?, ?, ?, ?)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()
	_, err = stmt.Exec(From, To, Content, Date)
	if err != nil {
		log.Fatal(err)
	}
}

func UuidInsert(db *sql.DB, uuid string, username string, authenticated string, expires string) {
	// Insert UUID with associated username into Database
	stmt, err := db.Prepare("INSERT INTO uuids(uuid, username, authenticated, expires) VALUES(?, ?, ?, ?)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()
	_, err = stmt.Exec(uuid, username, true, time.Now().AddDate(0, 0, +1))
	if err != nil {
		log.Fatal(err)
	}
}

func CreateUUIDTable(db *sql.DB) {
	// Create UUID Table
	stmt, err := db.Prepare("CREATE TABLE IF NOT EXISTS uuids(uuid TEXT PRIMARY KEY, username TEXT, authenticated TEXT, expires TEXT)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()
	_, err = stmt.Exec()
	if err != nil {
		log.Fatal(err)
	}
}

type conv struct {
	Sender   string
	Receiver string
	Content  string
	Date     string
}

func ReadConversation(db *sql.DB, username string) []conv {
	// Get all messages from Database
	rows, err := db.Query("SELECT * FROM mp WHERE sender or receiver = ?", username)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	convs := make([]conv, 0)
	for rows.Next() {
		var content string
		var date string
		var sender string
		var receiver string
		err = rows.Scan(&sender, &receiver, &content, &date)
		if err != nil {
			log.Fatal(err)
		}
		convs = append(convs, conv{Sender: sender, Receiver: receiver, Content: content, Date: date})
	}
	return convs
}

func GetUsernameBySessionsID(db *sql.DB, session_id string) (string, int) {
	rows, err := db.Query("SELECT user_id FROM session WHERE session_id = ?", session_id)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	var user_id string
	if rows.Next() {
		err = rows.Scan(&user_id)
		if err != nil {
			log.Fatal(err)
		}
	}
	rows, err = db.Query("SELECT name FROM user WHERE idUser = ?", user_id)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	var username string
	if rows.Next() {
		err = rows.Scan(&username)
		if err != nil {
			log.Fatal(err)
		}
	}
	uid, err := strconv.Atoi(user_id)
	if err != nil {
		log.Fatal(err)
	}
	return username, uid
}

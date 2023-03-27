package main

// Websocket

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	// import json

	"github.com/gorilla/websocket"
	// import uuid
	UUID "github.com/satori/go.uuid"
)

type ClientWS struct {
	SessionId string
	UserId    int
	Username  string
}

// Used for sending messages Message = switch (login, register, post, private) in json need to be parsed
var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
	clients = make(map[*websocket.Conn]*ClientWS)
)

var (
	uuidUser   = make(map[string]string)
	UserCookie = make(map[string]*http.Cookie)
)

// Used for sending messages Message = switch (login, register, post, private) in json need to be parsed
type Message struct {
	Username     string      `json:"username"`
	Message      interface{} `json:"message"`
	Message_Type string      `json:"type"`
}

// Used for sending login (for user)
type LoginMessage struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Used for sending register (for user)
type RegisterMessage struct {
	Username  string `json:"username"`
	Email     string `json:"email"`
	Age       string `json:"age"`
	Gender    string `json:"gender"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Password  string `json:"password"`
}

// Used for sending posts
type PostMessage struct {
	Creator    string   `json:"creator"`
	Title      string   `json:"title"`
	Content    string   `json:"content"`
	Categories []string `json:"categories"`
	Comments   []string `json:"comments"`
}

// Used for sending private messages
type PrivateMessage struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Content string `json:"content"`
	Date    string `json:"date"`
}

// Used for sending answer to client
type ServerAnswer struct {
	Answer string `json:"answer"`
	UUID   string `json:"uuid"`
	Type   string `json:"type"`
}

// Used for registering uuid and username in database
type UuidMessage struct {
	Uuid          string `json:"uuid"`
	Username      string `json:"username"`
	Authenticated string `json:"authenticated"`
	Expires       string `json:"expires"`
}

type User struct {
	Username string
}

// handle websocket connection
func wsHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(COOKIE_SESSION_NAME)
	if err == nil && cookie != nil {
		sessionId := cookie.Value
		row := GetDB().QueryRow("SELECT user_id FROM session WHERE session_id = ?", sessionId)

		var sqUsername string
		var sqUserId int
		if row.Scan(&sqUserId) != sql.ErrNoRows {
			row = GetDB().QueryRow("SELECT name FROM user WHERE idUser = ?", sqUserId)
			if row.Scan(&sqUsername) != sql.ErrNoRows {
				ws, err := upgrader.Upgrade(w, r, nil)
				if err != nil {
					log.Printf("Error upgrading client: %s\n", err)
					delete(clients, ws)
					return
				}

				log.Printf("[WebSocket] New client with session %s.\n", sessionId)
				clients[ws] = &ClientWS{SessionId: sessionId, UserId: sqUserId, Username: sqUsername}

				go MessageHandler(ws)
				return
			}
		}
	}
	w.WriteHeader(http.StatusUnauthorized)
}

type userMessage struct {
	To      string
	From    string
	Content string
	Date    string
}

type wsSynchronize struct {
	Messages []userMessage
	Type     string `json:"type"`
}

// handle messages from websocket
func MessageHandler(ws *websocket.Conn) {
	db := GetDB()

	for {
		var msg Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("[WebSocket] Dropped client.\n")
			delete(clients, ws)
			WsSynchronizeUserList(db, ws)
			WsSynchronizeUsers(db, ws)
			break
		}

		// switch message type (login, register, post, private) and call function
		switch msg.Message_Type {
		case "post":
			WsPost(db, ws, msg)
		case "private":
			WsPrivate(db, ws, msg)
		case "comment":
			WsComment(db, ws, msg)
		case "sync:profile":
			WsSynchronizeProfile(db, ws)
		case "sync:messages":
			WsSynchronizeMessages(db, ws, msg)
		case "sync:users":
			WsSynchronizeUsers(db, ws)
		case "sync:userList":
			WsSynchronizeUserList(db, ws)
		case "sync:posts":
			WsSynchronizePosts(db, ws)
		case "ping":
			fmt.Printf("Client %d/%s (%s) has pinged.\n", clients[ws].UserId, clients[ws].Username, clients[ws].SessionId)
			ws.WriteJSON(map[string]string{
				"request": "ping",
			})
		case "typing":
			WsTyping(db, ws, msg)
		}
	}
}
func WsTyping(db *sql.DB, ws *websocket.Conn, msg Message) {
	var message map[string]interface{} = msg.Message.(map[string]interface{})
	var to string = message["to"].(string)
	var from string = message["from"].(string)
	type Typing struct {
		Type string `json:"type"`
		From string `json:"from"`
		To   string `json:"to"`
	}
	var tiping Typing
	tiping.Type = "typing"
	tiping.From = from
	tiping.To = to
	for client, info := range clients {
		if info.Username == to {
			client.WriteJSON(tiping)
		}
	}
}
func WsComment(db *sql.DB, ws *websocket.Conn, msg Message) {
	var mp map[string]interface{} = msg.Message.(map[string]interface{})
	fmt.Println(mp)
	content := mp["content"].(string)
	Username := mp["username"].(string)
	postIDStr := mp["postID"].(string)

	postId, err := strconv.Atoi(postIDStr)
	if err != nil {
		log.Fatalln(err)
	}

	fmt.Println(content, Username, postId)
	AddComment(db, content, Username, postId)
	WsSynchronizePosts(db, ws)
}

func WsSynchronizePosts(db *sql.DB, ws *websocket.Conn) {
	type Comment struct {
		Comment  string `json:"comment"`
		Username string `json:"username"`
		Date     string `json:"date"`
	}
	type Post struct {
		ID         int       `json:"id"`
		Title      string    `json:"title"`
		Username   string    `json:"username"`
		Date       string    `json:"date"`
		Content    string    `json:"content"`
		Categories []string  `json:"categories"`
		Comments   []Comment `json:"comments"`
	}

	Posts := []Post{}

	rows, err := db.Query("SELECT idPost,title, username, date, content, categories FROM post")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	for rows.Next() {
		var idPost int
		var title string
		var username string
		var date string
		var content string
		var categories string
		if err := rows.Scan(&idPost, &title, &username, &date, &content, &categories); err != nil {
			log.Fatal(err)
		}
		rowsComments, err := db.Query("SELECT comment, username, date FROM comments WHERE postID = ? ", idPost)
		if err != nil {
			log.Fatal(err)
		}
		defer rowsComments.Close()

		Comments := []Comment{}
		for rowsComments.Next() {
			var comment string
			var username string
			var date string
			if err := rowsComments.Scan(&comment, &username, &date); err != nil {
				log.Fatal(err)
			}
			Comments = append(Comments, Comment{
				Comment:  comment,
				Username: username,
				Date:     date,
			})
		}
		Posts = append(Posts, Post{
			ID:         idPost,
			Title:      title,
			Username:   username,
			Date:       date,
			Content:    content,
			Categories: strings.Split(categories, ";"),
			Comments:   Comments,
		})
	}
	if err := rows.Err(); err != nil {
		log.Fatal(err)
	}

	type SyncPosts struct {
		Posts []Post `json:"posts"`
		Type  string `json:"type"`
	}

	syncPosts := SyncPosts{Posts: Posts, Type: "sync:posts"}

	ws.WriteJSON(syncPosts)
}

func WsSynchronizeProfile(db *sql.DB, ws *websocket.Conn) {
	type SyncProfile struct {
		Username string `json:"username"`
	}

	type SyncProfilePacket struct {
		Profile SyncProfile `json:"profile"`
		Type    string      `json:"type"`
	}

	syncProfilePacket := SyncProfilePacket{Profile: SyncProfile{
		Username: clients[ws].Username,
	}, Type: "sync:profile"}

	ws.WriteJSON(syncProfilePacket)
}

func WsSynchronizeUsers(db *sql.DB, ws *websocket.Conn) {
	type OnlineUser struct {
		Username string `json:"username"`
		UserID   int    `json:"idUser"`
	}
	type Online struct {
		OnlineUsers []OnlineUser `json:"online"`
		Type        string       `json:"type"`
	}
	OnlineUsers := Online{Type: "sync:users"}

	for _, clientInfo := range clients {
		OnlineUsers.OnlineUsers = append(OnlineUsers.OnlineUsers, OnlineUser{
			Username: clientInfo.Username,
			UserID:   clientInfo.UserId,
		})
	}

	for client := range clients {
		client.WriteJSON(OnlineUsers)
	}
}

func WsSynchronizeUserList(db *sql.DB, ws *websocket.Conn) {
	type User struct {
		Username string `json:"username"`
	}
	type UserLists struct {
		User []User `json:"userList"`
		Type string `json:"type"`
	}

	Users, err := GetAllUsers(db)
	if err != nil {
		return
	}
	var UserList UserLists
	UserList.Type = "sync:userList"
	for _, user := range Users {
		UserList.User = append(UserList.User, User{Username: user.Username})
	}

	for client := range clients {
		client.WriteJSON(UserList)
	}
}

func WsSynchronizeMessages(db *sql.DB, ws *websocket.Conn, Message Message) {
	username := clients[ws].Username

	// get all messages from user
	rows, err := db.Query("SELECT sender, receiver, content, date FROM mp WHERE receiver = ? OR sender = ?", username, username)
	if err != nil {
		fmt.Println(err)
	}
	defer rows.Close()
	var messages []userMessage
	for rows.Next() {
		var to string
		var from string
		var content string
		var date string
		err := rows.Scan(&from, &to, &content, &date)
		if err != nil {
			fmt.Println(err)
		}
		messages = append(messages, userMessage{To: to, From: from, Content: content, Date: date})
	}
	// send messages to client
	fmt.Println(messages)
	ws.WriteJSON(wsSynchronize{Messages: messages, Type: "sync:messages"})
}

func RemoveUserFromUuid(username string) {
	for key, value := range uuidUser {
		if value == username {
			delete(uuidUser, key)
		}
	}
}

func CreateUserUUIDandStoreit(Username string) string {
	uuid := UUID.NewV4()
	uuidUser[uuid.String()] = Username
	// expire in 5 hours
	cookie := http.Cookie{Name: "uuid", Value: uuid.String(), Expires: time.Now().Add(5 * time.Hour)}
	UserCookie[Username] = &cookie
	return uuid.String()
}

// convert interface to []byte for json
func (m *Message) ConvertInterface() []byte {
	// convert Message to []byte
	Mes := m.Message.(string)
	return []byte(Mes)
}

// post using websocket
func WsPost(db *sql.DB, ws *websocket.Conn, Message Message) {
	var mp map[string]interface{} = Message.Message.(map[string]interface{})
	fmt.Println(mp)
	Title := mp["title"].(string)
	Username := mp["username"].(string)
	Date := mp["date"].(string)
	Content := mp["content"].(string)
	var Categories []string
	switch v := mp["categories"].(type) {
	case []interface{}:
		for _, category := range v {
			Categories = append(Categories, category.(string))
		}
	case string:
		Categories = []string{v}
	default:
		// handle error case where value is not a string or slice of interfaces
	}
	Categoriesarray := []string{}
	for _, category := range Categories {
		Categoriesarray = append(Categoriesarray, fmt.Sprint(category))
	}

	CreatePost(db, Title, Username, Date, Content, Categoriesarray)

	for client := range clients {
		WsSynchronizePosts(db, client)
	}
}

// private message using websocket
func WsPrivate(db *sql.DB, ws *websocket.Conn, message Message) {
	var mp map[string]interface{} = message.Message.(map[string]interface{})
	fmt.Println(mp)
	From := mp["from"].(string)
	To := mp["to"].(string)
	Content := mp["content"].(string)
	Date := mp["date"].(string)
	CreatePrivateMessage(db, From, To, Content, Date)

	for client := range clients {
		WsSynchronizeMessages(db, client, message)
	}
}

func broadcastMessage(msg Message) {
	for client := range clients {
		err := client.WriteJSON(msg)
		if err != nil {
			log.Printf("error: %v", err)
			client.Close()
			delete(clients, client)
		}
	}
}

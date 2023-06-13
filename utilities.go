package main

import (
	"net/mail"
	"regexp"
	"strconv"

	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func ValidUsername(username string) bool {
	r := regexp.MustCompile("[a-z][a-z0-9_]+")
	return r.Match([]byte(username))
}

func ValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

func ValidAge(age string) bool {
	ageInt, err := strconv.Atoi(age)
	if err != nil {
		return false
	}
	return ageInt >= 10 && ageInt <= 99
}

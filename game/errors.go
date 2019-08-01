package game

import "errors"

var ErrNotConnected = errors.New("Not connected")
var ErrInvalidCredentials = errors.New("Invalid credentials")
var ErrInvalidSubscription = errors.New("Invalid subscription")
var ErrNotSubscribed = errors.New("Not subscribed")
var ErrPasswordTooLong = errors.New("Password too long")
var ErrUnknownResponse = errors.New("Unknown response")

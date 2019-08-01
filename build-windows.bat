@echo off
go generate
go build -ldflags "-H windowsgui" -o release/spif-fe.exe
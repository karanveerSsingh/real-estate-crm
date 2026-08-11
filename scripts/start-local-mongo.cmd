@echo off
subst R: "D:\real estate crm"
"C:\PROGRA~1\MongoDB\Server\7.0\bin\mongod.exe" --dbpath R:\.mongodb\data --bind_ip 127.0.0.1 --port 27017
